const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const StellarSdk = require('stellar-sdk');
const {
  validateStellarAddress,
  validatePagination,
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

// Aplicar middlewares de segurança em todas as rotas
router.use(securityLoggerMiddleware);
router.use(sanitizeInput);

/**
 * @route GET /api/rewards/pending/:address
 * @desc Obtém as recompensas pendentes de um usuário
 * @access Public
 */
router.get('/pending/:address', validateStellarAddress, async (req, res) => {
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

    // Buscar recompensas pendentes do usuário
    const { data: pendingRewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (rewardsError) {
      console.error('Erro ao buscar recompensas:', rewardsError);
      return res.status(500).json({ error: 'Erro ao buscar recompensas' });
    }

    // Calcular o total de recompensas pendentes
    const totalPending = pendingRewards.reduce((sum, reward) => {
      return sum + parseFloat(reward.amount);
    }, 0);

    // Buscar recompensas já resgatadas para calcular o total ganho
    const { data: claimedRewards, error: claimedError } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'claimed');

    const totalEarned = claimedRewards ? claimedRewards.reduce((sum, reward) => {
      return sum + parseFloat(reward.amount);
    }, 0) : 0;

    // Obter cotação do token KALE (simulado para o MVP)
    const kalePrice = await getKalePrice();

    return res.status(200).json({
      pending_rewards: totalPending.toString(),
      total_earned: totalEarned.toString(),
      pending_rewards_count: pendingRewards.length,
      token_code: STAKING_TOKEN_CODE,
      token_price_brl: kalePrice.brl,
      token_price_usd: kalePrice.usd,
      pending_rewards_brl: (totalPending * kalePrice.brl).toFixed(2),
      pending_rewards_usd: (totalPending * kalePrice.usd).toFixed(2)
    });
  } catch (error) {
    console.error('Erro ao obter recompensas pendentes:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @route POST /api/rewards/claim
 * @desc Processa o resgate de recompensas
 * @access Private
 */
router.post('/claim', validateStellarAddressBody, async (req, res) => {
  try {
    const { stellar_address } = req.body;

    if (!stellar_address) {
      return res.status(400).json({ error: 'Endereço Stellar não fornecido' });
    }

    // Para o MVP, vamos processar o resgate sem verificação de transação
    // Em produção, seria necessário verificar uma transação real na blockchain
    const tx_hash = `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Buscar o usuário pelo endereço Stellar
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('stellar_address', stellar_address)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Buscar recompensas pendentes do usuário
    const { data: pendingRewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    if (rewardsError) {
      console.error('Erro ao buscar recompensas:', rewardsError);
      return res.status(500).json({ error: 'Erro ao buscar recompensas' });
    }

    // Calcular o total de recompensas pendentes
    const totalPending = pendingRewards.reduce((sum, reward) => {
      return sum + parseFloat(reward.amount);
    }, 0);

    if (totalPending <= 0) {
      return res.status(400).json({ error: 'Não há recompensas pendentes para resgate' });
    }

    // Atualizar o status das recompensas para 'claimed'
    const rewardIds = pendingRewards.map(reward => reward.id);
    const { error: updateError } = await supabase
      .from('rewards')
      .update({ 
        status: 'claimed', 
        claimed_at: new Date(),
        tx_hash: tx_hash 
      })
      .in('id', rewardIds);

    if (updateError) {
      console.error('Erro ao atualizar recompensas:', updateError);
      return res.status(500).json({ error: 'Erro ao processar resgate' });
    }

    // Registrar o resgate no histórico
    const { error: historyError } = await supabase
      .from('history')
      .insert([
        {
          user_id: user.id,
          type: 'reward_claim',
          amount: totalPending.toString(),
          tx_hash: tx_hash,
          created_at: new Date()
        }
      ]);

    if (historyError) {
      console.error('Erro ao registrar histórico:', historyError);
      // Não retornar erro, pois o resgate já foi processado
    }

    return res.status(200).json({
      success: true,
      message: 'Recompensas resgatadas com sucesso',
      amount: totalPending.toString(),
      token_code: STAKING_TOKEN_CODE,
      tx_hash: tx_hash
    });
  } catch (error) {
    console.error('Erro ao processar resgate de recompensas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * Obtém a cotação atual do token KALE
 * Nota: Para o MVP, estamos usando valores simulados
 */
async function getKalePrice() {
  // Em uma implementação real, isso consultaria um oráculo de preços como o Reflector Oracle
  // Por enquanto, retornamos valores simulados
  return {
    brl: 2.50,  // R$ 2,50 por KALE
    usd: 0.50   // US$ 0,50 por KALE
  };
}

module.exports = router;