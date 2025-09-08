/**
 * Configurações de segurança centralizadas
 */

const securityConfig = {
  // Configurações de CORS
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL || 'https://yourdomain.com'
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  // Configurações de Rate Limiting
  rateLimiting: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // máximo 100 requests por IP
      message: {
        error: 'Muitas requisições deste IP, tente novamente em 15 minutos.',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // máximo 5 tentativas de login por IP
      message: {
        error: 'Muitas tentativas de autenticação, tente novamente em 15 minutos.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false
    },
    api: {
      windowMs: 1 * 60 * 1000, // 1 minuto
      max: 30, // máximo 30 requests por minuto para APIs sensíveis
      message: {
        error: 'Muitas requisições para esta API, tente novamente em 1 minuto.',
        code: 'API_RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false
    }
  },

  // Configurações do Helmet (Content Security Policy)
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'", 
          "https://horizon-testnet.stellar.org", 
          "https://horizon.stellar.org",
          process.env.SUPABASE_URL
        ],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false // Necessário para algumas integrações
  },

  // Configurações de validação
  validation: {
    stellarAddress: {
      pattern: /^G[A-Z2-7]{55}$/,
      length: { min: 56, max: 56 }
    },
    amount: {
      min: 0.0000001,
      max: 999999999
    },
    pagination: {
      limit: { min: 1, max: 100, default: 10 },
      offset: { min: 0, default: 0 }
    }
  },

  // Configurações de logging de segurança
  logging: {
    enabled: true,
    logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    logSuspiciousActivity: true,
    logFailedAuth: true,
    logRateLimitHits: true
  },

  // Configurações de sessão e JWT
  session: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiration: '24h',
    refreshTokenExpiration: '7d'
  },

  // Configurações de sanitização
  sanitization: {
    enabled: true,
    stripHtml: true,
    escapeHtml: true,
    trimWhitespace: true
  },

  // Configurações específicas para produção
  production: {
    hideErrorDetails: true,
    enableHttpsRedirect: true,
    enableHSTS: true,
    enableXSSProtection: true,
    enableNoSniff: true,
    enableFrameguard: true
  }
};

/**
 * Valida se todas as configurações de segurança necessárias estão presentes
 */
function validateSecurityConfig() {
  const requiredEnvVars = [
    'JWT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_KEY'
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Variáveis de ambiente de segurança obrigatórias não encontradas: ${missing.join(', ')}`);
  }

  // Validar força do JWT_SECRET
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('AVISO: JWT_SECRET deve ter pelo menos 32 caracteres para maior segurança');
  }

  // Validar configurações de produção
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.FRONTEND_URL) {
      console.warn('AVISO: FRONTEND_URL não definida para produção');
    }
    
    if (process.env.JWT_SECRET === 'stellar_stake_house_jwt_secret_development_2024') {
      throw new Error('ERRO: JWT_SECRET de desenvolvimento não deve ser usado em produção');
    }
  }

  console.log('✅ Configurações de segurança validadas com sucesso');
}

/**
 * Obtém configurações específicas baseadas no ambiente
 */
function getEnvironmentConfig() {
  const baseConfig = { ...securityConfig };
  
  if (process.env.NODE_ENV === 'production') {
    // Configurações mais restritivas para produção
    baseConfig.rateLimiting.general.max = 50;
    baseConfig.rateLimiting.auth.max = 3;
    baseConfig.rateLimiting.api.max = 20;
  } else if (process.env.NODE_ENV === 'development') {
    // Configurações mais permissivas para desenvolvimento
    baseConfig.rateLimiting.general.max = 1000;
    baseConfig.rateLimiting.auth.max = 50;
    baseConfig.rateLimiting.api.max = 100;
  }
  
  return baseConfig;
}

module.exports = {
  securityConfig,
  validateSecurityConfig,
  getEnvironmentConfig
};