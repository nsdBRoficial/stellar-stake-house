const { body, param, query, validationResult } = require('express-validator');
const { securityLogger } = require('../config/logger');

/**
 * Middleware para tratar erros de validação
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Log do erro de validação
    const firstError = errors.array()[0];
    securityLogger.logValidationError(
      req, 
      firstError.path || firstError.param, 
      firstError.value, 
      firstError.msg,
      { allErrors: errors.array() }
    );
    
    return res.status(400).json({
      error: 'Dados de entrada inválidos',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Validações para endereços Stellar
 */
const validateStellarAddress = [
  param('address')
    .isLength({ min: 56, max: 56 })
    .matches(/^G[A-Z2-7]{55}$/)
    .withMessage('Endereço Stellar inválido'),
  handleValidationErrors
];

const validateStellarAddressBody = [
  body('stellar_address')
    .isLength({ min: 56, max: 56 })
    .matches(/^G[A-Z2-7]{55}$/)
    .withMessage('Endereço Stellar inválido'),
  handleValidationErrors
];

/**
 * Validações para valores monetários
 */
const validateAmount = [
  body('amount')
    .isFloat({ min: 0.0000001, max: 999999999 })
    .withMessage('Valor deve ser um número positivo válido'),
  handleValidationErrors
];

/**
 * Validações para paginação
 */
const validatePagination = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser entre 1 e 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset deve ser um número não negativo'),
  handleValidationErrors
];

/**
 * Validações para filtros de histórico
 */
const validateHistoryFilters = [
  query('type')
    .optional()
    .isIn(['delegation', 'reward_claim', 'all'])
    .withMessage('Tipo deve ser: delegation, reward_claim ou all'),
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Data de início deve estar no formato ISO8601'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('Data de fim deve estar no formato ISO8601'),
  handleValidationErrors
];

/**
 * Validação para delegação de staking
 */
const validateStakingDelegation = [
  body('stellar_address')
    .isLength({ min: 56, max: 56 })
    .matches(/^G[A-Z2-7]{55}$/)
    .withMessage('Endereço Stellar inválido'),
  body('amount')
    .isFloat({ min: 0.0000001, max: 999999999 })
    .withMessage('Valor deve ser um número positivo válido'),
  body('validator_address')
    .optional()
    .isLength({ min: 56, max: 56 })
    .matches(/^G[A-Z2-7]{55}$/)
    .withMessage('Endereço do validador inválido'),
  handleValidationErrors
];

/**
 * Validações para criação de pools
 */
const validatePoolCreation = [
  body('poolName')
    .isLength({ min: 3, max: 100 })
    .withMessage('Nome da pool deve ter entre 3 e 100 caracteres'),
  body('tokenSymbol')
    .isIn(['KALE', 'XLM'])
    .withMessage('Token deve ser KALE ou XLM'),
  body('totalRewards')
    .isFloat({ min: 1000, max: 1000000000 })
    .withMessage('Total de recompensas deve estar entre 1.000 e 1.000.000.000'),
  body('maxAPY')
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('APY deve estar entre 0.1% e 100%'),
  body('distributionDays')
    .isInt({ min: 1, max: 365 })
    .withMessage('Período de distribuição deve estar entre 1 e 365 dias'),
  body('ownerAddress')
    .isLength({ min: 56, max: 56 })
    .matches(/^G[A-Z2-7]{55}$/)
    .withMessage('Endereço do dono inválido'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres'),
  handleValidationErrors
];

/**
 * Validações para delegação em pools
 */
const validatePoolDelegation = [
  body('userAddress')
    .isLength({ min: 56, max: 56 })
    .matches(/^G[A-Z2-7]{55}$/)
    .withMessage('Endereço do usuário inválido'),
  body('amount')
    .isFloat({ min: 1, max: 999999999 })
    .withMessage('Valor deve ser um número positivo válido (mínimo 1)'),
  handleValidationErrors
]

/**
 * Sanitização de entrada para prevenir XSS
 */
const sanitizeInput = (req, res, next) => {
  // Função para sanitizar strings
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
      .replace(/[<>"'&]/g, (match) => {
        const entities = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[match];
      })
      .trim();
  };

  // Sanitizar recursivamente o objeto
  const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitizar body, query e params
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Middleware de logging de segurança
 */
const securityLoggerMiddleware = (req, res, next) => {
  // Log apenas para endpoints sensíveis
  if (req.originalUrl.includes('/api/auth') || 
      req.originalUrl.includes('/api/rewards') || 
      req.originalUrl.includes('/api/snapshots')) {
    securityLogger.logApiAccess(req, req.originalUrl);
  }
  
  next();
};

module.exports = {
  handleValidationErrors,
  validateStellarAddress,
  validateStellarAddressBody,
  validateAmount,
  validatePagination,
  validateHistoryFilters,
  validateStakingDelegation,
  validatePoolCreation,
  validatePoolDelegation,
  sanitizeInput,
  securityLogger: securityLoggerMiddleware
};