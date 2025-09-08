const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const StellarSdk = require('stellar-sdk');
const {
  validateStellarAddress,
  validateStakingDelegation,
  sanitizeInput,
  securityLoggerMiddleware
} = require('../middleware/validation');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração da Stellar Network
const server = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const stellarServer = new StellarSdk.Horizon.Server(server);

// Configurações do token de staking
const STAKING_TOKEN_CODE = process.env.STAKING_TOKEN_CODE || 'KALE';
const STAKING_TOKEN_ISSUER = process.env.STAKING_TOKEN_ISSUER;
const STAKING_POOL_ADDRESS = process.env.STAKING_POOL_ADDRESS;

// Aplicar middlewares de segurança em todas as rotas
router.use(securityLoggerMiddleware);
router.use(sanitizeInput);

/**
 * @route GET /api/staking/balance/:address
 * @desc Obtém o saldo de tokens KALE de um endereço
 * @access Public
 */
router.get('/balance/:address', validateStellarAddress, async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ error: 'Endereço não fornecido' });
    }

    // Buscar o saldo do token KALE na carteira do usuário
    const account = await stellarServer.loadAccount(address);
    const balances = account.balances;

    let kaleBalance = '0';

    for (const balance of balances) {
      if (balance.asset_type !== 'native' && 
          balance.asset_code === STAKING_TOKEN_CODE && 
          balance.asset_issuer === STAKING_TOKEN_ISSUER) {
        kaleBalance = balance.balance;
        break;
      }
    }

    return res.status(200).json({ balance: kaleBalance });
  } catch (error) {
    console.error('Erro ao obter saldo:', error);
    
    // Verificar se é um erro de conta não encontrada
    if (error instanceof StellarSdk.NotFoundError) {
      return res.status(404).json({ error: 'Conta Stellar não encontrada' });
    }
    
    return res.status(500).json({ error: 'Erro ao obter saldo' });
  }
});

/**
 * @route POST /api/staking/delegate
 * @desc Registra uma delegação de tokens para staking
 * @access Private
 */
router.post('/delegate', validateStakingDelegation, async (req, res) => {
  try {
    const { stellar_address, amount, tx_hash } = req.body;

    if (!stellar_address || !amount || !tx_hash) {
      return res.status(400).json({ error: 'Dados incompletos para delegação' });
    }

    // Verificar se a transação existe na blockchain
    try {
      const transaction = await stellarServer.transactions().transaction(tx_hash).call();
      
      if (!transaction) {
        return res.status(400).json({ error: 'Transação não encontrada' });
      }
      
      // Aqui poderia ter uma verificação mais detalhada da transação
      // para garantir que é uma autorização válida para o pool de staking
    } catch (error) {
      console.error('Erro ao verificar transação:', error);
      return res.status(400).json({ error: 'Transação inválida ou não encontrada' });
    }

    // Buscar o usuário pelo endereço Stellar
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('stellar_address', stellar_address)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Registrar a delegação no banco de dados
    const { data: delegation, error: delegationError } = await supabase
      .from('delegations')
      .insert([
        {
          user_id: user.id,
          amount: amount,
          tx_hash: tx_hash,
          status: 'active',
          created_at: new Date()
        }
      ])
      .select()
      .single();

    if (delegationError) {
      console.error('Erro ao registrar delegação:', delegationError);
      return res.status(500).json({ error: 'Erro ao registrar delegação' });
    }

    return res.status(201).json({
      message: 'Delegação registrada com sucesso',
      delegation: {
        id: delegation.id,
        amount: delegation.amount,
        status: delegation.status,
        created_at: delegation.created_at
      }
    });
  } catch (error) {
    console.error('Erro ao processar delegação:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @route GET /api/staking/status/:address
 * @desc Obtém o status de staking de um endereço
 * @access Public
 */
router.get('/status/:address', validateStellarAddress, async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ error: 'Endereço não fornecido' });
    }

    // Buscar o usuário pelo endereço Stellar
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('stellar_address', address)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Buscar delegações ativas do usuário
    const { data: delegations, error: delegationsError } = await supabase
      .from('delegations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (delegationsError) {
      console.error('Erro ao buscar delegações:', delegationsError);
      return res.status(500).json({ error: 'Erro ao buscar delegações' });
    }

    // Calcular o total delegado
    const totalDelegated = delegations.reduce((sum, delegation) => {
      return sum + parseFloat(delegation.amount);
    }, 0);

    // Buscar o último snapshot para este usuário
    const { data: lastSnapshot, error: snapshotError } = await supabase
      .from('snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Obter o APY atual do pool de staking
    const currentAPY = process.env.REWARD_RATE || 0.05; // 5% como padrão

    // Calcular a próxima data de snapshot
    const nextSnapshotDate = calculateNextSnapshotDate();

    return res.status(200).json({
      status: delegations.length > 0 ? 'active' : 'inactive',
      total_delegated: totalDelegated.toString(),
      delegations_count: delegations.length,
      last_snapshot: lastSnapshot ? lastSnapshot.created_at : null,
      next_snapshot: nextSnapshotDate,
      current_apy: currentAPY
    });
  } catch (error) {
    console.error('Erro ao obter status de staking:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Calcula a data do próximo snapshot com base na configuração CRON
 */
function calculateNextSnapshotDate() {
  // Implementação simplificada - assumindo snapshot diário à meia-noite
  const now = new Date();
  const nextSnapshot = new Date(now);
  nextSnapshot.setHours(24, 0, 0, 0); // Próxima meia-noite
  return nextSnapshot;
}

module.exports = router;