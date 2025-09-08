/**
 * Script de monitoramento de performance
 * Monitora métricas do sistema e identifica gargalos
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      cpu: [],
      memory: [],
      database: [],
      api: [],
      stellar: []
    };
    this.isMonitoring = false;
    this.monitoringInterval = null;
    
    // Configurar Supabase para testes de performance
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
  }

  /**
   * Inicia o monitoramento contínuo
   */
  startMonitoring(intervalMs = 30000) { // 30 segundos por padrão
    if (this.isMonitoring) {
      console.log('Monitoramento já está ativo');
      return;
    }

    console.log(`🔍 Iniciando monitoramento de performance (intervalo: ${intervalMs}ms)`);
    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
    }, intervalMs);

    // Coletar métricas iniciais
    this.collectMetrics();
  }

  /**
   * Para o monitoramento
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      console.log('Monitoramento não está ativo');
      return;
    }

    console.log('⏹️ Parando monitoramento de performance');
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Coleta todas as métricas do sistema
   */
  async collectMetrics() {
    const timestamp = new Date().toISOString();
    
    try {
      // Métricas do sistema
      const cpuMetrics = this.getCPUMetrics();
      const memoryMetrics = this.getMemoryMetrics();
      
      // Métricas de banco de dados
      const dbMetrics = await this.getDatabaseMetrics();
      
      // Métricas da API Stellar
      const stellarMetrics = await this.getStellarMetrics();
      
      // Armazenar métricas
      this.metrics.cpu.push({ timestamp, ...cpuMetrics });
      this.metrics.memory.push({ timestamp, ...memoryMetrics });
      this.metrics.database.push({ timestamp, ...dbMetrics });
      this.metrics.stellar.push({ timestamp, ...stellarMetrics });
      
      // Manter apenas as últimas 100 medições
      Object.keys(this.metrics).forEach(key => {
        if (this.metrics[key].length > 100) {
          this.metrics[key] = this.metrics[key].slice(-100);
        }
      });
      
      // Log de métricas críticas
      this.logCriticalMetrics(cpuMetrics, memoryMetrics, dbMetrics, stellarMetrics);
      
    } catch (error) {
      console.error('Erro ao coletar métricas:', error);
    }
  }

  /**
   * Obtém métricas de CPU
   */
  getCPUMetrics() {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    
    return {
      cores: cpus.length,
      loadAverage1m: loadAvg[0],
      loadAverage5m: loadAvg[1],
      loadAverage15m: loadAvg[2],
      usage: this.calculateCPUUsage(cpus)
    };
  }

  /**
   * Calcula uso de CPU
   */
  calculateCPUUsage(cpus) {
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    return 100 - ~~(100 * totalIdle / totalTick);
  }

  /**
   * Obtém métricas de memória
   */
  getMemoryMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    return {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      usagePercent: (usedMem / totalMem) * 100,
      processMemory: process.memoryUsage()
    };
  }

  /**
   * Testa performance do banco de dados
   */
  async getDatabaseMetrics() {
    const metrics = {
      connectionTime: 0,
      queryTime: 0,
      error: null
    };

    try {
      // Teste de conexão
      const connectionStart = Date.now();
      const { data, error } = await this.supabase
        .from('user_balances')
        .select('count')
        .limit(1);
      
      metrics.connectionTime = Date.now() - connectionStart;
      
      if (error) {
        metrics.error = error.message;
        return metrics;
      }
      
      // Teste de query mais complexa
      const queryStart = Date.now();
      await this.supabase
        .from('snapshots')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      metrics.queryTime = Date.now() - queryStart;
      
    } catch (error) {
      metrics.error = error.message;
    }
    
    return metrics;
  }

  /**
   * Testa performance da API Stellar
   */
  async getStellarMetrics() {
    const metrics = {
      horizonResponseTime: 0,
      error: null
    };

    try {
      const StellarSdk = require('stellar-sdk');
      const server = new StellarSdk.Horizon.Server(
        process.env.STELLAR_NETWORK === 'testnet' 
          ? 'https://horizon-testnet.stellar.org'
          : 'https://horizon.stellar.org'
      );
      
      const start = Date.now();
      await server.ledgers().limit(1).call();
      metrics.horizonResponseTime = Date.now() - start;
      
    } catch (error) {
      metrics.error = error.message;
    }
    
    return metrics;
  }

  /**
   * Log de métricas críticas
   */
  logCriticalMetrics(cpu, memory, db, stellar) {
    const alerts = [];
    
    // Alertas de CPU
    if (cpu.usage > 80) {
      alerts.push(`🔥 CPU alta: ${cpu.usage.toFixed(1)}%`);
    }
    
    // Alertas de memória
    if (memory.usagePercent > 85) {
      alerts.push(`🔥 Memória alta: ${memory.usagePercent.toFixed(1)}%`);
    }
    
    // Alertas de banco de dados
    if (db.connectionTime > 1000) {
      alerts.push(`🔥 DB lento: ${db.connectionTime}ms`);
    }
    
    if (db.error) {
      alerts.push(`❌ Erro DB: ${db.error}`);
    }
    
    // Alertas da API Stellar
    if (stellar.horizonResponseTime > 2000) {
      alerts.push(`🔥 Stellar lento: ${stellar.horizonResponseTime}ms`);
    }
    
    if (stellar.error) {
      alerts.push(`❌ Erro Stellar: ${stellar.error}`);
    }
    
    // Log dos alertas
    if (alerts.length > 0) {
      console.warn('⚠️ ALERTAS DE PERFORMANCE:');
      alerts.forEach(alert => console.warn(`   ${alert}`));
    }
  }

  /**
   * Gera relatório de performance
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.calculateSummary(),
      recommendations: this.generateRecommendations(),
      metrics: {
        cpu: this.metrics.cpu.slice(-10), // Últimas 10 medições
        memory: this.metrics.memory.slice(-10),
        database: this.metrics.database.slice(-10),
        stellar: this.metrics.stellar.slice(-10)
      }
    };
    
    return report;
  }

  /**
   * Calcula resumo das métricas
   */
  calculateSummary() {
    const summary = {};
    
    // Resumo de CPU
    if (this.metrics.cpu.length > 0) {
      const cpuUsages = this.metrics.cpu.map(m => m.usage);
      summary.cpu = {
        average: cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length,
        max: Math.max(...cpuUsages),
        min: Math.min(...cpuUsages)
      };
    }
    
    // Resumo de memória
    if (this.metrics.memory.length > 0) {
      const memUsages = this.metrics.memory.map(m => m.usagePercent);
      summary.memory = {
        average: memUsages.reduce((a, b) => a + b, 0) / memUsages.length,
        max: Math.max(...memUsages),
        min: Math.min(...memUsages)
      };
    }
    
    // Resumo de banco de dados
    if (this.metrics.database.length > 0) {
      const dbTimes = this.metrics.database
        .filter(m => !m.error)
        .map(m => m.connectionTime);
      
      if (dbTimes.length > 0) {
        summary.database = {
          averageConnectionTime: dbTimes.reduce((a, b) => a + b, 0) / dbTimes.length,
          maxConnectionTime: Math.max(...dbTimes),
          minConnectionTime: Math.min(...dbTimes),
          errorRate: (this.metrics.database.filter(m => m.error).length / this.metrics.database.length) * 100
        };
      }
    }
    
    // Resumo da API Stellar
    if (this.metrics.stellar.length > 0) {
      const stellarTimes = this.metrics.stellar
        .filter(m => !m.error)
        .map(m => m.horizonResponseTime);
      
      if (stellarTimes.length > 0) {
        summary.stellar = {
          averageResponseTime: stellarTimes.reduce((a, b) => a + b, 0) / stellarTimes.length,
          maxResponseTime: Math.max(...stellarTimes),
          minResponseTime: Math.min(...stellarTimes),
          errorRate: (this.metrics.stellar.filter(m => m.error).length / this.metrics.stellar.length) * 100
        };
      }
    }
    
    return summary;
  }

  /**
   * Gera recomendações de otimização
   */
  generateRecommendations() {
    const recommendations = [];
    const summary = this.calculateSummary();
    
    // Recomendações de CPU
    if (summary.cpu && summary.cpu.average > 70) {
      recommendations.push({
        category: 'CPU',
        priority: 'HIGH',
        issue: 'Alto uso de CPU detectado',
        recommendation: 'Considere otimizar algoritmos ou aumentar recursos de CPU'
      });
    }
    
    // Recomendações de memória
    if (summary.memory && summary.memory.average > 80) {
      recommendations.push({
        category: 'Memory',
        priority: 'HIGH',
        issue: 'Alto uso de memória detectado',
        recommendation: 'Verifique vazamentos de memória ou aumente RAM disponível'
      });
    }
    
    // Recomendações de banco de dados
    if (summary.database && summary.database.averageConnectionTime > 500) {
      recommendations.push({
        category: 'Database',
        priority: 'MEDIUM',
        issue: 'Tempo de resposta do banco elevado',
        recommendation: 'Otimize queries, adicione índices ou considere connection pooling'
      });
    }
    
    if (summary.database && summary.database.errorRate > 5) {
      recommendations.push({
        category: 'Database',
        priority: 'HIGH',
        issue: 'Alta taxa de erros no banco de dados',
        recommendation: 'Investigue erros de conexão e implemente retry logic'
      });
    }
    
    // Recomendações da API Stellar
    if (summary.stellar && summary.stellar.averageResponseTime > 1500) {
      recommendations.push({
        category: 'Stellar',
        priority: 'MEDIUM',
        issue: 'API Stellar com resposta lenta',
        recommendation: 'Implemente cache para dados da Stellar ou use múltiplos endpoints'
      });
    }
    
    if (summary.stellar && summary.stellar.errorRate > 10) {
      recommendations.push({
        category: 'Stellar',
        priority: 'HIGH',
        issue: 'Alta taxa de erros na API Stellar',
        recommendation: 'Implemente fallback e retry logic para chamadas Stellar'
      });
    }
    
    return recommendations;
  }

  /**
   * Salva relatório em arquivo
   */
  saveReport(filename) {
    const report = this.generateReport();
    const reportsDir = path.join(__dirname, '..', 'reports');
    
    // Criar diretório se não existir
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const filepath = path.join(reportsDir, filename || `performance-${Date.now()}.json`);
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Relatório salvo em: ${filepath}`);
    return filepath;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  require('dotenv').config();
  
  const monitor = new PerformanceMonitor();
  
  console.log('🚀 Iniciando monitoramento de performance...');
  monitor.startMonitoring(10000); // 10 segundos
  
  // Parar após 5 minutos e gerar relatório
  setTimeout(() => {
    monitor.stopMonitoring();
    monitor.saveReport();
    console.log('✅ Monitoramento concluído');
    process.exit(0);
  }, 5 * 60 * 1000);
}

module.exports = PerformanceMonitor;