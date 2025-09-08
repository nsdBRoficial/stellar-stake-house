/**
 * Script de otimização de banco de dados
 * Analisa e otimiza performance das consultas no Supabase
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class DatabaseOptimizer {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
    
    this.optimizations = [];
    this.recommendations = [];
  }

  /**
   * Executa análise completa de otimização
   */
  async runOptimization() {
    console.log('🔍 Iniciando análise de otimização do banco de dados...');
    
    try {
      // Analisar estrutura das tabelas
      await this.analyzeTableStructure();
      
      // Analisar performance das consultas
      await this.analyzeQueryPerformance();
      
      // Verificar índices
      await this.analyzeIndexes();
      
      // Analisar dados duplicados
      await this.analyzeDuplicateData();
      
      // Verificar tamanho das tabelas
      await this.analyzeTableSizes();
      
      // Gerar relatório
      this.generateOptimizationReport();
      
    } catch (error) {
      console.error('Erro durante otimização:', error);
    }
  }

  /**
   * Analisa estrutura das tabelas
   */
  async analyzeTableStructure() {
    console.log('📊 Analisando estrutura das tabelas...');
    
    const tables = ['user_balances', 'snapshots', 'rewards', 'staking_delegations'];
    
    for (const table of tables) {
      try {
        const { data, error } = await this.supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          this.recommendations.push({
            category: 'Structure',
            priority: 'HIGH',
            table,
            issue: `Erro ao acessar tabela ${table}`,
            recommendation: `Verificar se a tabela ${table} existe e tem permissões adequadas`,
            error: error.message
          });
        } else {
          console.log(`✅ Tabela ${table} acessível`);
        }
      } catch (err) {
        console.error(`Erro ao analisar tabela ${table}:`, err);
      }
    }
  }

  /**
   * Analisa performance das consultas comuns
   */
  async analyzeQueryPerformance() {
    console.log('⚡ Analisando performance das consultas...');
    
    const queries = [
      {
        name: 'user_balances_by_address',
        query: () => this.supabase
          .from('user_balances')
          .select('*')
          .eq('stellar_address', 'GTEST')
          .limit(1)
      },
      {
        name: 'recent_snapshots',
        query: () => this.supabase
          .from('snapshots')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
      },
      {
        name: 'pending_rewards',
        query: () => this.supabase
          .from('rewards')
          .select('*')
          .eq('status', 'pending')
          .limit(10)
      },
      {
        name: 'active_delegations',
        query: () => this.supabase
          .from('staking_delegations')
          .select('*')
          .eq('status', 'active')
          .limit(10)
      }
    ];
    
    for (const queryTest of queries) {
      try {
        const startTime = Date.now();
        const { data, error } = await queryTest.query();
        const executionTime = Date.now() - startTime;
        
        if (error) {
          this.recommendations.push({
            category: 'Query Performance',
            priority: 'HIGH',
            query: queryTest.name,
            issue: `Erro na consulta ${queryTest.name}`,
            recommendation: 'Verificar sintaxe e estrutura da consulta',
            error: error.message
          });
        } else {
          console.log(`📈 ${queryTest.name}: ${executionTime}ms`);
          
          if (executionTime > 1000) {
            this.recommendations.push({
              category: 'Query Performance',
              priority: 'MEDIUM',
              query: queryTest.name,
              issue: `Consulta lenta: ${executionTime}ms`,
              recommendation: 'Considerar adicionar índices ou otimizar consulta',
              executionTime
            });
          }
        }
      } catch (err) {
        console.error(`Erro ao testar consulta ${queryTest.name}:`, err);
      }
    }
  }

  /**
   * Analisa índices necessários
   */
  async analyzeIndexes() {
    console.log('🔍 Analisando necessidade de índices...');
    
    const indexRecommendations = [
      {
        table: 'user_balances',
        column: 'stellar_address',
        reason: 'Consultas frequentes por endereço Stellar',
        priority: 'HIGH'
      },
      {
        table: 'snapshots',
        column: 'created_at',
        reason: 'Ordenação por data de criação',
        priority: 'HIGH'
      },
      {
        table: 'rewards',
        column: 'status',
        reason: 'Filtros por status de recompensa',
        priority: 'MEDIUM'
      },
      {
        table: 'rewards',
        column: 'stellar_address',
        reason: 'Consultas por endereço do usuário',
        priority: 'HIGH'
      },
      {
        table: 'staking_delegations',
        column: 'stellar_address',
        reason: 'Consultas por endereço delegador',
        priority: 'HIGH'
      },
      {
        table: 'staking_delegations',
        column: 'status',
        reason: 'Filtros por status de delegação',
        priority: 'MEDIUM'
      }
    ];
    
    indexRecommendations.forEach(index => {
      this.recommendations.push({
        category: 'Indexes',
        priority: index.priority,
        table: index.table,
        column: index.column,
        issue: `Índice recomendado para ${index.table}.${index.column}`,
        recommendation: `CREATE INDEX idx_${index.table}_${index.column} ON ${index.table}(${index.column});`,
        reason: index.reason
      });
    });
  }

  /**
   * Analisa dados duplicados
   */
  async analyzeDuplicateData() {
    console.log('🔍 Analisando dados duplicados...');
    
    try {
      // Verificar duplicatas em user_balances
      const { data: duplicateBalances, error: balanceError } = await this.supabase
        .rpc('find_duplicate_balances'); // Função personalizada no Supabase
      
      if (!balanceError && duplicateBalances && duplicateBalances.length > 0) {
        this.recommendations.push({
          category: 'Data Quality',
          priority: 'MEDIUM',
          table: 'user_balances',
          issue: `${duplicateBalances.length} registros duplicados encontrados`,
          recommendation: 'Implementar constraint UNIQUE ou limpar dados duplicados'
        });
      }
      
      // Verificar snapshots órfãos (sem delegações correspondentes)
      const { data: orphanSnapshots, error: snapshotError } = await this.supabase
        .from('snapshots')
        .select(`
          id,
          stellar_address,
          staking_delegations!left(
            id
          )
        `)
        .is('staking_delegations.id', null)
        .limit(10);
      
      if (!snapshotError && orphanSnapshots && orphanSnapshots.length > 0) {
        this.recommendations.push({
          category: 'Data Quality',
          priority: 'LOW',
          table: 'snapshots',
          issue: `${orphanSnapshots.length} snapshots órfãos encontrados`,
          recommendation: 'Limpar snapshots sem delegações correspondentes'
        });
      }
      
    } catch (error) {
      console.log('ℹ️ Análise de duplicatas limitada (funções personalizadas não disponíveis)');
    }
  }

  /**
   * Analisa tamanho das tabelas
   */
  async analyzeTableSizes() {
    console.log('📏 Analisando tamanho das tabelas...');
    
    const tables = ['user_balances', 'snapshots', 'rewards', 'staking_delegations'];
    
    for (const table of tables) {
      try {
        const { count, error } = await this.supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`📊 ${table}: ${count} registros`);
          
          // Recomendações baseadas no tamanho
          if (count > 100000) {
            this.recommendations.push({
              category: 'Performance',
              priority: 'MEDIUM',
              table,
              issue: `Tabela grande: ${count} registros`,
              recommendation: 'Considerar particionamento ou arquivamento de dados antigos'
            });
          }
          
          if (count > 1000000) {
            this.recommendations.push({
              category: 'Performance',
              priority: 'HIGH',
              table,
              issue: `Tabela muito grande: ${count} registros`,
              recommendation: 'Implementar estratégia de arquivamento e particionamento urgente'
            });
          }
        }
      } catch (err) {
        console.error(`Erro ao analisar tamanho da tabela ${table}:`, err);
      }
    }
  }

  /**
   * Gera relatório de otimização
   */
  generateOptimizationReport() {
    console.log('\n📋 RELATÓRIO DE OTIMIZAÇÃO DO BANCO DE DADOS');
    console.log('=' .repeat(60));
    
    // Agrupar recomendações por categoria
    const categorizedRecommendations = this.recommendations.reduce((acc, rec) => {
      if (!acc[rec.category]) {
        acc[rec.category] = [];
      }
      acc[rec.category].push(rec);
      return acc;
    }, {});
    
    // Mostrar recomendações por categoria
    Object.keys(categorizedRecommendations).forEach(category => {
      console.log(`\n🔧 ${category.toUpperCase()}`);
      console.log('-'.repeat(40));
      
      categorizedRecommendations[category]
        .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority))
        .forEach((rec, index) => {
          const priorityIcon = this.getPriorityIcon(rec.priority);
          console.log(`${index + 1}. ${priorityIcon} ${rec.issue}`);
          console.log(`   💡 ${rec.recommendation}`);
          if (rec.table) console.log(`   📊 Tabela: ${rec.table}`);
          if (rec.executionTime) console.log(`   ⏱️ Tempo: ${rec.executionTime}ms`);
          console.log('');
        });
    });
    
    // Resumo
    console.log('\n📊 RESUMO');
    console.log('-'.repeat(20));
    console.log(`Total de recomendações: ${this.recommendations.length}`);
    
    const priorityCounts = this.recommendations.reduce((acc, rec) => {
      acc[rec.priority] = (acc[rec.priority] || 0) + 1;
      return acc;
    }, {});
    
    Object.keys(priorityCounts).forEach(priority => {
      const icon = this.getPriorityIcon(priority);
      console.log(`${icon} ${priority}: ${priorityCounts[priority]}`);
    });
    
    // Scripts SQL recomendados
    const sqlRecommendations = this.recommendations
      .filter(rec => rec.category === 'Indexes' && rec.recommendation.includes('CREATE INDEX'))
      .map(rec => rec.recommendation);
    
    if (sqlRecommendations.length > 0) {
      console.log('\n🔧 SCRIPTS SQL RECOMENDADOS');
      console.log('-'.repeat(30));
      sqlRecommendations.forEach((sql, index) => {
        console.log(`${index + 1}. ${sql}`);
      });
    }
    
    console.log('\n✅ Análise de otimização concluída!');
  }

  /**
   * Obtém peso da prioridade para ordenação
   */
  getPriorityWeight(priority) {
    const weights = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    return weights[priority] || 0;
  }

  /**
   * Obtém ícone da prioridade
   */
  getPriorityIcon(priority) {
    const icons = {
      'HIGH': '🔴',
      'MEDIUM': '🟡',
      'LOW': '🟢'
    };
    return icons[priority] || '⚪';
  }

  /**
   * Executa otimizações automáticas seguras
   */
  async runAutomaticOptimizations() {
    console.log('🤖 Executando otimizações automáticas...');
    
    // Por enquanto, apenas log das otimizações que seriam executadas
    // Em produção, seria necessário mais cuidado
    
    const safeOptimizations = this.recommendations.filter(rec => 
      rec.category === 'Indexes' && rec.priority === 'HIGH'
    );
    
    if (safeOptimizations.length > 0) {
      console.log('\n🔧 Otimizações seguras identificadas:');
      safeOptimizations.forEach((opt, index) => {
        console.log(`${index + 1}. ${opt.recommendation}`);
      });
      console.log('\n⚠️ Execute estes comandos manualmente no Supabase Dashboard');
    } else {
      console.log('✅ Nenhuma otimização automática segura identificada');
    }
  }

  /**
   * Salva relatório em arquivo
   */
  saveReport() {
    const fs = require('fs');
    const path = require('path');
    
    const report = {
      timestamp: new Date().toISOString(),
      recommendations: this.recommendations,
      summary: {
        total: this.recommendations.length,
        byPriority: this.recommendations.reduce((acc, rec) => {
          acc[rec.priority] = (acc[rec.priority] || 0) + 1;
          return acc;
        }, {}),
        byCategory: this.recommendations.reduce((acc, rec) => {
          acc[rec.category] = (acc[rec.category] || 0) + 1;
          return acc;
        }, {})
      }
    };
    
    const reportsDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const filename = `database-optimization-${Date.now()}.json`;
    const filepath = path.join(reportsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Relatório salvo em: ${filepath}`);
    
    return filepath;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const optimizer = new DatabaseOptimizer();
  
  optimizer.runOptimization()
    .then(() => {
      optimizer.saveReport();
      return optimizer.runAutomaticOptimizations();
    })
    .then(() => {
      console.log('\n🎉 Otimização concluída!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Erro durante otimização:', error);
      process.exit(1);
    });
}

module.exports = DatabaseOptimizer;