/**
 * Sistema de logging de segurança
 */

const fs = require('fs');
const path = require('path');

class SecurityLogger {
  constructor() {
    this.logDir = path.join(__dirname, '..', 'logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatLogEntry(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...metadata,
      environment: process.env.NODE_ENV || 'development'
    };
    return JSON.stringify(logEntry) + '\n';
  }

  writeToFile(filename, content) {
    const filePath = path.join(this.logDir, filename);
    fs.appendFileSync(filePath, content);
  }

  log(level, message, metadata = {}) {
    const logEntry = this.formatLogEntry(level, message, metadata);
    
    // Log para console em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${level.toUpperCase()}] ${message}`, metadata);
    }
    
    // Log para arquivo
    const today = new Date().toISOString().split('T')[0];
    this.writeToFile(`security-${today}.log`, logEntry);
  }

  // Métodos específicos para diferentes tipos de eventos de segurança
  logSuspiciousActivity(req, reason, details = {}) {
    this.log('SECURITY_ALERT', `Atividade suspeita detectada: ${reason}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      headers: req.headers,
      body: req.body,
      reason,
      ...details
    });
  }

  logFailedAuth(req, reason, details = {}) {
    this.log('AUTH_FAILURE', `Falha de autenticação: ${reason}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      reason,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  logRateLimitHit(req, limitType, details = {}) {
    this.log('RATE_LIMIT', `Rate limit atingido: ${limitType}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      limitType,
      ...details
    });
  }

  logValidationError(req, field, value, reason, details = {}) {
    this.log('VALIDATION_ERROR', `Erro de validação: ${field}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      field,
      value: typeof value === 'string' ? value.substring(0, 100) : value, // Limitar tamanho
      reason,
      ...details
    });
  }

  logSecurityEvent(req, eventType, description, details = {}) {
    this.log('SECURITY_EVENT', `${eventType}: ${description}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      eventType,
      description,
      ...details
    });
  }

  logApiAccess(req, endpoint, userId = null, details = {}) {
    this.log('API_ACCESS', `Acesso à API: ${endpoint}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      endpoint,
      userId,
      responseTime: details.responseTime,
      statusCode: details.statusCode,
      ...details
    });
  }

  // Método para análise de logs (útil para detectar padrões)
  analyzeLogs(days = 7) {
    const analysis = {
      suspiciousIPs: new Map(),
      failedAuthAttempts: new Map(),
      rateLimitHits: new Map(),
      validationErrors: new Map()
    };

    // Ler logs dos últimos N dias
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `security-${dateStr}.log`);
      
      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
          try {
            const entry = JSON.parse(line);
            
            switch (entry.level) {
              case 'SECURITY_ALERT':
                const ip = entry.ip;
                analysis.suspiciousIPs.set(ip, (analysis.suspiciousIPs.get(ip) || 0) + 1);
                break;
              case 'AUTH_FAILURE':
                const authIP = entry.ip;
                analysis.failedAuthAttempts.set(authIP, (analysis.failedAuthAttempts.get(authIP) || 0) + 1);
                break;
              case 'RATE_LIMIT':
                const rateLimitIP = entry.ip;
                analysis.rateLimitHits.set(rateLimitIP, (analysis.rateLimitHits.get(rateLimitIP) || 0) + 1);
                break;
              case 'VALIDATION_ERROR':
                const field = entry.field;
                analysis.validationErrors.set(field, (analysis.validationErrors.get(field) || 0) + 1);
                break;
            }
          } catch (e) {
            // Ignorar linhas malformadas
          }
        });
      }
    }

    return {
      suspiciousIPs: Array.from(analysis.suspiciousIPs.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      failedAuthAttempts: Array.from(analysis.failedAuthAttempts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      rateLimitHits: Array.from(analysis.rateLimitHits.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      validationErrors: Array.from(analysis.validationErrors.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    };
  }
}

// Instância singleton
const securityLogger = new SecurityLogger();

// Middleware para logging automático de requisições
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Interceptar o final da resposta
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Log apenas para endpoints sensíveis ou erros
    if (req.originalUrl.includes('/api/') && (res.statusCode >= 400 || responseTime > 1000)) {
      securityLogger.logApiAccess(req, req.originalUrl, req.user?.id, {
        responseTime,
        statusCode: res.statusCode
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  securityLogger,
  requestLogger
};