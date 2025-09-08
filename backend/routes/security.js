/**
 * Rotas para monitoramento de segurança
 */

const express = require('express');
const { securityLogger } = require('../config/logger');
const { sanitizeInput, handleValidationErrors } = require('../middleware/validation');
const { query } = require('express-validator');
const router = express.Router();

// Middleware de autenticação para rotas de segurança (apenas admins)
const requireAdmin = (req, res, next) => {
  // TODO: Implementar verificação de admin quando sistema de auth estiver completo
  // Por enquanto, apenas verificar se há um token válido
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    securityLogger.logFailedAuth(req, 'Token de acesso não fornecido para endpoint de segurança');
    return res.status(401).json({
      success: false,
      error: 'Token de acesso requerido'
    });
  }
  
  // TODO: Validar token JWT e verificar se é admin
  // Por enquanto, permitir acesso para desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    req.user = { id: 'admin', role: 'admin' };
    return next();
  }
  
  // Em produção, negar acesso até implementar auth completa
  securityLogger.logFailedAuth(req, 'Tentativa de acesso a endpoint de segurança sem autenticação adequada');
  return res.status(403).json({
    success: false,
    error: 'Acesso negado'
  });
};

/**
 * GET /api/security/logs/analysis
 * Retorna análise dos logs de segurança dos últimos dias
 */
router.get('/logs/analysis', 
  requireAdmin,
  sanitizeInput,
  [
    query('days')
      .optional()
      .isInt({ min: 1, max: 30 })
      .withMessage('Dias deve ser um número entre 1 e 30')
      .toInt()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const days = req.query.days || 7;
      
      securityLogger.logSecurityEvent(
        req, 
        'SECURITY_ANALYSIS_REQUEST', 
        `Análise de logs solicitada para ${days} dias`,
        { userId: req.user.id, days }
      );
      
      const analysis = securityLogger.analyzeLogs(days);
      
      res.json({
        success: true,
        data: {
          period: `${days} dias`,
          analysis,
          summary: {
            totalSuspiciousIPs: analysis.suspiciousIPs.length,
            totalFailedAuthAttempts: analysis.failedAuthAttempts.reduce((sum, [, count]) => sum + count, 0),
            totalRateLimitHits: analysis.rateLimitHits.reduce((sum, [, count]) => sum + count, 0),
            totalValidationErrors: analysis.validationErrors.reduce((sum, [, count]) => sum + count, 0)
          }
        }
      });
      
    } catch (error) {
      console.error('Erro ao analisar logs de segurança:', error);
      securityLogger.logSecurityEvent(
        req, 
        'SECURITY_ANALYSIS_ERROR', 
        'Erro ao processar análise de logs',
        { error: error.message, userId: req.user.id }
      );
      
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor ao analisar logs'
      });
    }
  }
);

/**
 * GET /api/security/status
 * Retorna status geral de segurança do sistema
 */
router.get('/status',
  requireAdmin,
  sanitizeInput,
  async (req, res) => {
    try {
      const analysis = securityLogger.analyzeLogs(1); // Último dia
      
      // Calcular métricas de segurança
      const securityMetrics = {
        threatLevel: 'LOW', // LOW, MEDIUM, HIGH, CRITICAL
        activeThreats: 0,
        recentIncidents: 0,
        systemHealth: 'HEALTHY'
      };
      
      // Determinar nível de ameaça baseado na análise
      const suspiciousActivity = analysis.suspiciousIPs.length;
      const failedAuths = analysis.failedAuthAttempts.reduce((sum, [, count]) => sum + count, 0);
      const rateLimitHits = analysis.rateLimitHits.reduce((sum, [, count]) => sum + count, 0);
      
      if (suspiciousActivity > 10 || failedAuths > 50) {
        securityMetrics.threatLevel = 'HIGH';
        securityMetrics.systemHealth = 'ALERT';
      } else if (suspiciousActivity > 5 || failedAuths > 20) {
        securityMetrics.threatLevel = 'MEDIUM';
        securityMetrics.systemHealth = 'WARNING';
      }
      
      securityMetrics.activeThreats = suspiciousActivity;
      securityMetrics.recentIncidents = failedAuths + rateLimitHits;
      
      // Verificar configurações de segurança
      const securityConfig = {
        httpsEnabled: process.env.NODE_ENV === 'production',
        rateLimitingActive: true,
        loggingEnabled: true,
        validationActive: true,
        corsConfigured: true
      };
      
      securityLogger.logSecurityEvent(
        req, 
        'SECURITY_STATUS_CHECK', 
        'Status de segurança consultado',
        { userId: req.user.id, threatLevel: securityMetrics.threatLevel }
      );
      
      res.json({
        success: true,
        data: {
          metrics: securityMetrics,
          config: securityConfig,
          lastUpdated: new Date().toISOString(),
          recommendations: generateSecurityRecommendations(securityMetrics, analysis)
        }
      });
      
    } catch (error) {
      console.error('Erro ao obter status de segurança:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

/**
 * POST /api/security/block-ip
 * Bloqueia um IP específico (funcionalidade futura)
 */
router.post('/block-ip',
  requireAdmin,
  sanitizeInput,
  [
    query('ip')
      .isIP()
      .withMessage('IP inválido')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { ip } = req.body;
      
      // TODO: Implementar bloqueio de IP real
      // Por enquanto, apenas log
      securityLogger.logSecurityEvent(
        req, 
        'IP_BLOCK_REQUEST', 
        `Solicitação de bloqueio de IP: ${ip}`,
        { userId: req.user.id, targetIP: ip }
      );
      
      res.json({
        success: true,
        message: `IP ${ip} marcado para bloqueio (funcionalidade em desenvolvimento)`,
        data: {
          ip,
          status: 'pending',
          blockedAt: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('Erro ao bloquear IP:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
);

/**
 * Gera recomendações de segurança baseadas na análise
 */
function generateSecurityRecommendations(metrics, analysis) {
  const recommendations = [];
  
  if (metrics.threatLevel === 'HIGH') {
    recommendations.push({
      priority: 'HIGH',
      action: 'Revisar logs de segurança imediatamente',
      description: 'Atividade suspeita detectada que requer atenção imediata'
    });
  }
  
  if (analysis.failedAuthAttempts.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      action: 'Monitorar tentativas de autenticação falhadas',
      description: 'IPs com múltiplas tentativas de login falhadas detectados'
    });
  }
  
  if (analysis.rateLimitHits.length > 0) {
    recommendations.push({
      priority: 'LOW',
      action: 'Revisar configurações de rate limiting',
      description: 'Alguns IPs estão atingindo limites de requisição frequentemente'
    });
  }
  
  if (process.env.NODE_ENV !== 'production') {
    recommendations.push({
      priority: 'INFO',
      action: 'Configurar ambiente de produção',
      description: 'Sistema rodando em modo de desenvolvimento'
    });
  }
  
  return recommendations;
}

module.exports = router;