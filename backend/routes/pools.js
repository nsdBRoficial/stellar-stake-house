const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const StellarSdk = require('stellar-sdk');
const {
  validateStellarAddress,
  validatePoolCreation,
  validatePoolDelegation,
  sanitizeInput,
  securityLogger
} = require('../middleware/validation');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração da Stellar Network
const server = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const stellarServer = new StellarSdk.Horizon.Server(server);

// Configurações dos contratos
const POOL_REWARDS_CONTRACT_ID = process.env.POOL_REWARDS_CONTRACT_ID;
const STELLAR_NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';

// Aplicar middlewares de segurança em todas as rotas
router.use(securityLogger);
router.use(sanitizeInput);

/**
 * @route POST /api/pools/create
 * @desc Cria uma nova pool de recompensas
 * @access Private (requer autenticação)
 */
router.post('/create', validatePoolCreation, async (req, res) => {
  try {
    const {
      poolName,
      tokenSymbol,
      totalRewards,
      maxAPY,
      distributionDays,
      description,
      ownerAddress
    } = req.body;

    // Validações básicas
    if (!poolName || !tokenSymbol || !totalRewards || !maxAPY || !distributionDays || !ownerAddress) {
      return res.status(400).json({
        error: 'Todos os campos obrigatórios devem ser preenchidos',
        required: ['poolName', 'tokenSymbol', 'totalRewards', 'maxAPY', 'distributionDays', 'ownerAddress']
      });
    }

    // Validar limites
    if (totalRewards < 1000 || totalRewards > 1000000000) {
      return res.status(400).json({
        error: 'Total de recompensas deve estar entre 1.000 e 1.000.000.000'
      });
    }

    if (maxAPY < 0.1 || maxAPY > 100) {
      return res.status(400).json({
        error: 'APY deve estar entre 0.1% e 100%'
      });
    }

    if (distributionDays < 1 || distributionDays > 365) {
      return res.status(400).json({
        error: 'Período de distribuição deve estar entre 1 e 365 dias'
      });
    }

    // Calcular distribuição diária
    const dailyDistribution = Math.floor(totalRewards / distributionDays);
    const apyBasicPoints = Math.floor(maxAPY * 100); // Converter para pontos base

    // Verificar se o usuário tem saldo suficiente
    try {
      const account = await stellarServer.loadAccount(ownerAddress);
      const balances = account.balances;
      
      let hasEnoughBalance = false;
      for (const balance of balances) {
        if ((tokenSymbol === 'XLM' && balance.asset_type === 'native') ||
            (balance.asset_code === tokenSymbol)) {
          const availableBalance = parseFloat(balance.balance);
          if (availableBalance >= totalRewards) {
            hasEnoughBalance = true;
            break;
          }
        }
      }

      if (!hasEnoughBalance) {
        return res.status(400).json({
          error: `Saldo insuficiente de ${tokenSymbol}. Necessário: ${totalRewards}`
        });
      }
    } catch (stellarError) {
      console.error('Erro ao verificar saldo Stellar:', stellarError);
      return res.status(400).json({
        error: 'Erro ao verificar saldo na rede Stellar'
      });
    }

    // Salvar pool no banco de dados
    const { data: poolData, error: dbError } = await supabase
      .from('pools')
      .insert({
        pool_name: poolName,
        token_symbol: tokenSymbol,
        total_rewards: totalRewards,
        max_apy: maxAPY,
        distribution_days: distributionDays,
        daily_distribution: dailyDistribution,
        description: description || null,
        owner_address: ownerAddress,
        distributed_amount: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + (distributionDays * 24 * 60 * 60 * 1000)).toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Erro ao salvar pool no banco:', dbError);
      return res.status(500).json({
        error: 'Erro interno do servidor ao criar pool'
      });
    }

    // Log da criação da pool
    console.log(`[POOLS] Pool criada: ${poolName} por ${ownerAddress}`);

    // Retornar dados da pool criada
    res.status(201).json({
      success: true,
      message: 'Pool criada com sucesso',
      pool: {
        id: poolData.id,
        poolName: poolData.pool_name,
        tokenSymbol: poolData.token_symbol,
        totalRewards: poolData.total_rewards,
        maxAPY: poolData.max_apy,
        distributionDays: poolData.distribution_days,
        dailyDistribution: poolData.daily_distribution,
        distributedAmount: poolData.distributed_amount,
        isActive: poolData.is_active,
        createdAt: poolData.created_at,
        startTime: poolData.start_time,
        endTime: poolData.end_time
      }
    });

  } catch (error) {
    console.error('Erro ao criar pool:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /api/pools/active
 * @desc Obtém todas as pools ativas
 * @access Public
 */
router.get('/active', async (req, res) => {
  try {
    const { data: pools, error } = await supabase
      .from('pools')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pools ativas:', error);
      return res.status(500).json({
        error: 'Erro ao buscar pools ativas'
      });
    }

    // Formatar dados das pools
    const formattedPools = pools.map(pool => ({
      id: pool.id,
      poolName: pool.pool_name,
      tokenSymbol: pool.token_symbol,
      totalRewards: pool.total_rewards,
      maxAPY: pool.max_apy,
      distributionDays: pool.distribution_days,
      dailyDistribution: pool.daily_distribution,
      distributedAmount: pool.distributed_amount,
      ownerAddress: pool.owner_address,
      isActive: pool.is_active,
      createdAt: pool.created_at,
      startTime: pool.start_time,
      endTime: pool.end_time,
      description: pool.description,
      // Calcular progresso
      progress: Math.min((pool.distributed_amount / pool.total_rewards) * 100, 100),
      // Calcular dias restantes
      daysRemaining: Math.max(0, Math.ceil((new Date(pool.end_time) - new Date()) / (1000 * 60 * 60 * 24)))
    }));

    res.json({
      success: true,
      pools: formattedPools,
      total: formattedPools.length
    });

  } catch (error) {
    console.error('Erro ao buscar pools ativas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /api/pools/owner/:address
 * @desc Obtém todas as pools de um dono específico
 * @access Public
 */
router.get('/owner/:address', validateStellarAddress, async (req, res) => {
  try {
    const { address } = req.params;

    const { data: pools, error } = await supabase
      .from('pools')
      .select('*')
      .eq('owner_address', address)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pools do dono:', error);
      return res.status(500).json({
        error: 'Erro ao buscar pools do dono'
      });
    }

    // Formatar dados das pools
    const formattedPools = pools.map(pool => ({
      id: pool.id,
      poolName: pool.pool_name,
      tokenSymbol: pool.token_symbol,
      totalRewards: pool.total_rewards,
      maxAPY: pool.max_apy,
      distributionDays: pool.distribution_days,
      dailyDistribution: pool.daily_distribution,
      distributedAmount: pool.distributed_amount,
      isActive: pool.is_active,
      createdAt: pool.created_at,
      startTime: pool.start_time,
      endTime: pool.end_time,
      description: pool.description,
      progress: Math.min((pool.distributed_amount / pool.total_rewards) * 100, 100),
      daysRemaining: Math.max(0, Math.ceil((new Date(pool.end_time) - new Date()) / (1000 * 60 * 60 * 24)))
    }));

    res.json({
      success: true,
      pools: formattedPools,
      total: formattedPools.length
    });

  } catch (error) {
    console.error('Erro ao buscar pools do dono:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /api/pools/:id
 * @desc Obtém detalhes de uma pool específica
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        error: 'ID da pool inválido'
      });
    }

    const { data: pool, error } = await supabase
      .from('pools')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !pool) {
      return res.status(404).json({
        error: 'Pool não encontrada'
      });
    }

    // Buscar delegações para esta pool
    const { data: delegations, error: delegationsError } = await supabase
      .from('pool_delegations')
      .select('*')
      .eq('pool_id', id);

    if (delegationsError) {
      console.error('Erro ao buscar delegações:', delegationsError);
    }

    // Calcular estatísticas
    const totalDelegated = delegations?.reduce((sum, delegation) => sum + delegation.amount, 0) || 0;
    const totalDelegators = delegations?.length || 0;

    const formattedPool = {
      id: pool.id,
      poolName: pool.pool_name,
      tokenSymbol: pool.token_symbol,
      totalRewards: pool.total_rewards,
      maxAPY: pool.max_apy,
      distributionDays: pool.distribution_days,
      dailyDistribution: pool.daily_distribution,
      distributedAmount: pool.distributed_amount,
      ownerAddress: pool.owner_address,
      isActive: pool.is_active,
      createdAt: pool.created_at,
      startTime: pool.start_time,
      endTime: pool.end_time,
      description: pool.description,
      progress: Math.min((pool.distributed_amount / pool.total_rewards) * 100, 100),
      daysRemaining: Math.max(0, Math.ceil((new Date(pool.end_time) - new Date()) / (1000 * 60 * 60 * 24))),
      // Estatísticas adicionais
      totalDelegated,
      totalDelegators,
      delegations: delegations || []
    };

    res.json({
      success: true,
      pool: formattedPool
    });

  } catch (error) {
    console.error('Erro ao buscar pool:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /api/pools/:id/delegate
 * @desc Delega tokens para uma pool específica
 * @access Private (requer autenticação)
 */
router.post('/:id/delegate', validatePoolDelegation, async (req, res) => {
  try {
    const { id } = req.params;
    const { userAddress, amount } = req.body;

    if (!userAddress || !amount || amount <= 0) {
      return res.status(400).json({
        error: 'Endereço do usuário e quantidade são obrigatórios'
      });
    }

    // Verificar se a pool existe e está ativa
    const { data: pool, error: poolError } = await supabase
      .from('pools')
      .select('*')
      .eq('id', id)
      .single();

    if (poolError || !pool) {
      return res.status(404).json({
        error: 'Pool não encontrada'
      });
    }

    if (!pool.is_active) {
      return res.status(400).json({
        error: 'Pool não está ativa'
      });
    }

    // Verificar se a pool não expirou
    if (new Date() > new Date(pool.end_time)) {
      return res.status(400).json({
        error: 'Pool já expirou'
      });
    }

    // Verificar se o usuário tem saldo suficiente
    try {
      const account = await stellarServer.loadAccount(userAddress);
      const balances = account.balances;
      
      let hasEnoughBalance = false;
      for (const balance of balances) {
        if ((pool.token_symbol === 'XLM' && balance.asset_type === 'native') ||
            (balance.asset_code === pool.token_symbol)) {
          const availableBalance = parseFloat(balance.balance);
          if (availableBalance >= amount) {
            hasEnoughBalance = true;
            break;
          }
        }
      }

      if (!hasEnoughBalance) {
        return res.status(400).json({
          error: `Saldo insuficiente de ${pool.token_symbol}. Necessário: ${amount}`
        });
      }
    } catch (stellarError) {
      console.error('Erro ao verificar saldo Stellar:', stellarError);
      return res.status(400).json({
        error: 'Erro ao verificar saldo na rede Stellar'
      });
    }

    // Verificar se já existe uma delegação do usuário para esta pool
    const { data: existingDelegation, error: delegationError } = await supabase
      .from('pool_delegations')
      .select('*')
      .eq('pool_id', id)
      .eq('user_address', userAddress)
      .single();

    let delegationData;

    if (existingDelegation) {
      // Atualizar delegação existente
      const { data: updatedDelegation, error: updateError } = await supabase
        .from('pool_delegations')
        .update({
          amount: existingDelegation.amount + amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDelegation.id)
        .select()
        .single();

      if (updateError) {
        console.error('Erro ao atualizar delegação:', updateError);
        return res.status(500).json({
          error: 'Erro ao atualizar delegação'
        });
      }

      delegationData = updatedDelegation;
    } else {
      // Criar nova delegação
      const { data: newDelegation, error: createError } = await supabase
        .from('pool_delegations')
        .insert({
          pool_id: id,
          user_address: userAddress,
          amount: amount,
          timestamp: new Date().toISOString(),
          last_claim: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Erro ao criar delegação:', createError);
        return res.status(500).json({
          error: 'Erro ao criar delegação'
        });
      }

      delegationData = newDelegation;
    }

    // Log da delegação
    console.log(`[POOLS] Delegação: ${amount} ${pool.token_symbol} para pool ${id} por ${userAddress}`);

    res.json({
      success: true,
      message: 'Delegação realizada com sucesso',
      delegation: {
        id: delegationData.id,
        poolId: delegationData.pool_id,
        userAddress: delegationData.user_address,
        amount: delegationData.amount,
        timestamp: delegationData.timestamp,
        lastClaim: delegationData.last_claim
      }
    });

  } catch (error) {
    console.error('Erro ao delegar para pool:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /api/pools/:id/toggle-status
 * @desc Alterna o status de uma pool (ativa/inativa)
 * @access Private (apenas dono da pool)
 */
router.post('/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { ownerAddress } = req.body;

    if (!ownerAddress) {
      return res.status(400).json({
        error: 'Endereço do dono é obrigatório'
      });
    }

    // Verificar se a pool existe e se o usuário é o dono
    const { data: pool, error: poolError } = await supabase
      .from('pools')
      .select('*')
      .eq('id', id)
      .single();

    if (poolError || !pool) {
      return res.status(404).json({
        error: 'Pool não encontrada'
      });
    }

    if (pool.owner_address !== ownerAddress) {
      return res.status(403).json({
        error: 'Apenas o dono da pool pode alterar seu status'
      });
    }

    // Alternar status
    const newStatus = !pool.is_active;

    const { data: updatedPool, error: updateError } = await supabase
      .from('pools')
      .update({
        is_active: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar status da pool:', updateError);
      return res.status(500).json({
        error: 'Erro ao atualizar status da pool'
      });
    }

    // Log da alteração de status
    console.log(`[POOLS] Status da pool ${id} alterado para ${newStatus ? 'ativa' : 'inativa'} por ${ownerAddress}`);

    res.json({
      success: true,
      message: `Pool ${newStatus ? 'ativada' : 'desativada'} com sucesso`,
      pool: {
        id: updatedPool.id,
        isActive: updatedPool.is_active
      }
    });

  } catch (error) {
    console.error('Erro ao alterar status da pool:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /api/pools/user/:address/delegations
 * @desc Obtém todas as delegações de um usuário
 * @access Public
 */
router.get('/user/:address/delegations', validateStellarAddress, async (req, res) => {
  try {
    const { address } = req.params;

    const { data: delegations, error } = await supabase
      .from('pool_delegations')
      .select(`
        *,
        pools (
          id,
          pool_name,
          token_symbol,
          max_apy,
          is_active,
          end_time
        )
      `)
      .eq('user_address', address)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Erro ao buscar delegações do usuário:', error);
      return res.status(500).json({
        error: 'Erro ao buscar delegações do usuário'
      });
    }

    // Formatar dados das delegações
    const formattedDelegations = delegations.map(delegation => ({
      id: delegation.id,
      poolId: delegation.pool_id,
      amount: delegation.amount,
      timestamp: delegation.timestamp,
      lastClaim: delegation.last_claim,
      pool: {
        id: delegation.pools.id,
        name: delegation.pools.pool_name,
        tokenSymbol: delegation.pools.token_symbol,
        maxAPY: delegation.pools.max_apy,
        isActive: delegation.pools.is_active,
        endTime: delegation.pools.end_time
      }
    }));

    res.json({
      success: true,
      delegations: formattedDelegations,
      total: formattedDelegations.length
    });

  } catch (error) {
    console.error('Erro ao buscar delegações do usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;