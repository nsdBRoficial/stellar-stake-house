require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const StellarSdk = require('stellar-sdk');
const { validateSecurityConfig, getEnvironmentConfig } = require('./config/security');
const { requestLogger } = require('./config/logger');

// Validar configurações de segurança
validateSecurityConfig();

// Obter configurações baseadas no ambiente
const config = getEnvironmentConfig();

// Inicialização do Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de segurança
app.use(helmet(config.helmet));

// Configuração de CORS
app.use(cors(config.cors));

// Rate limiting
const generalLimiter = rateLimit(config.rateLimiting.general);
const authLimiter = rateLimit(config.rateLimiting.auth);
const apiLimiter = rateLimit(config.rateLimiting.api);

app.use(generalLimiter);
app.use(requestLogger); // Logging de segurança
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração da Stellar Network
const stellarNetwork = process.env.STELLAR_NETWORK || 'TESTNET';
const server = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const stellarServer = new StellarSdk.Horizon.Server(server);

// Configurar a rede Stellar
if (stellarNetwork === 'TESTNET') {
  StellarSdk.Networks.TESTNET;
} else {
  StellarSdk.Networks.PUBLIC;
}

// Rotas da API
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/auth/passkey', authLimiter, require('./routes/passkey'));
app.use('/api/staking', require('./routes/staking'));
app.use('/api/rewards', apiLimiter, require('./routes/rewards'));
app.use('/api/history', require('./routes/history'));
app.use('/api/snapshots', apiLimiter, require('./routes/snapshots'));
app.use('/api/security', apiLimiter, require('./routes/security'));
app.use('/api/pools', apiLimiter, require('./routes/pools'));

// Rota de status
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', timestamp: new Date() });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  
  // Não expor detalhes do erro em produção
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
  
  return res.status(500).json({
    error: 'Erro interno do servidor',
    details: err.message
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada'
  });
});

// Importar serviço de snapshots
const { takeSnapshot } = require('./services/snapshotService');

// Scheduler para snapshots automáticos (padrão: todo dia à meia-noite)
const snapshotCron = process.env.SNAPSHOT_INTERVAL_CRON || '0 0 * * *';
cron.schedule(snapshotCron, async () => {
  try {
    console.log('Executando snapshot automático...');
    const result = await takeSnapshot();
    console.log(`Snapshot automático concluído: ${result.snapshot_count} snapshots criados`);
  } catch (error) {
    console.error('Erro ao executar snapshot automático:', error);
  }
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Rede Stellar: ${stellarNetwork}`);
});

module.exports = app;