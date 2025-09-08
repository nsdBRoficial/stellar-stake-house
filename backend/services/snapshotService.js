const { createClient } = require('@supabase/supabase-js');
const StellarSdk = require('stellar-sdk');

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

/**
 * Realiza um snapshot dos saldos de todos os usuários com delegações ativas
 */
async function takeSnapshot() {
  try {
    console.log('Iniciando snapshot de saldos...');
    
    // Buscar todas as delegações ativas
    const { data: activeDelegations, error: delegationsError } = await supabase
      .from('staking_delegations')
      .select('*, users!inner(*)')
      .eq('status', 'active');

    if (delegationsError) {
      throw new Error(`Erro ao buscar delegações ativas: ${delegationsError.message}`);
    }

    console.log(`Encontradas ${activeDelegations.length} delegações ativas`);

    // Agrupar delegações por usuário
    const userDelegations = {};
    for (const delegation of activeDelegations) {
      const userId = delegation.user_id;
      const stellarAddress = delegation.users.stellar_address;
      
      if (!userDelegations[userId]) {
        userDelegations[userId] = {
          user_id: userId,
          stellar_address: stellarAddress,
          delegations: []
        };
      }
      
      userDelegations[userId].delegations.push(delegation);
    }

    // Criar snapshots para cada usuário
    const snapshots = [];
    const snapshotDate = new Date();
    
    for (const userId in userDelegations) {
      const { stellar_address, delegations } = userDelegations[userId];
      
      // Calcular o total delegado
      const totalDelegated = delegations.reduce((sum, delegation) => {
        return sum + parseFloat(delegation.amount);
      }, 0);
      
      // Verificar o saldo atual na blockchain
      let actualBalance = 0;
      try {
        const account = await stellarServer.loadAccount(stellar_address);
        const balances = account.balances;
        
        for (const balance of balances) {
          if (balance.asset_type !== 'native' && 
              balance.asset_code === STAKING_TOKEN_CODE && 
              balance.asset_issuer === STAKING_TOKEN_ISSUER) {
            actualBalance = parseFloat(balance.balance);
            break;
          }
        }
      } catch (error) {
        console.error(`Erro ao verificar saldo de ${stellar_address}:`, error);
        // Continuar com o próximo usuário
        continue;
      }
      
      // Criar o snapshot
      snapshots.push({
        user_id: userId,
        delegated_amount: totalDelegated.toString(),
        actual_balance: actualBalance.toString(),
        created_at: snapshotDate
      });
    }
    
    // Inserir snapshots no banco de dados
    if (snapshots.length > 0) {
      const { error: insertError } = await supabase
        .from('snapshots')
        .insert(snapshots);

      if (insertError) {
        throw new Error(`Erro ao inserir snapshots: ${insertError.message}`);
      }
      
      console.log(`${snapshots.length} snapshots criados com sucesso`);
      
      // Calcular recompensas com base nos snapshots
      await calculateRewards(snapshots, snapshotDate);
    } else {
      console.log('Nenhum snapshot criado - não há delegações ativas');
    }
    
    return {
      success: true,
      snapshot_count: snapshots.length,
      snapshot_date: snapshotDate
    };
  } catch (error) {
    console.error('Erro ao realizar snapshot:', error);
    throw error;
  }
}

/**
 * Calcula as recompensas com base nos snapshots
 */
async function calculateRewards(snapshots, snapshotDate) {
  try {
    console.log('Calculando recompensas com base nos snapshots...');
    
    // Obter a taxa de recompensa (APY)
    const rewardRate = parseFloat(process.env.REWARD_RATE || 0.05); // 5% como padrão
    
    // Calcular a taxa diária (APY / 365)
    const dailyRate = rewardRate / 365;
    
    // Preparar as recompensas para inserção
    const rewards = [];
    
    for (const snapshot of snapshots) {
      // Calcular a recompensa diária com base no saldo delegado
      const delegatedAmount = parseFloat(snapshot.delegated_amount);
      const dailyReward = delegatedAmount * dailyRate;
      
      // Só criar recompensa se for maior que zero
      if (dailyReward > 0) {
        rewards.push({
          user_id: snapshot.user_id,
          amount: dailyReward.toFixed(7), // 7 casas decimais para tokens Stellar
          snapshot_id: null, // Será preenchido após a inserção do snapshot
          status: 'pending',
          created_at: snapshotDate
        });
      }
    }
    
    // Inserir recompensas no banco de dados
    if (rewards.length > 0) {
      const { error: insertError } = await supabase
        .from('rewards')
        .insert(rewards);

      if (insertError) {
        throw new Error(`Erro ao inserir recompensas: ${insertError.message}`);
      }
      
      console.log(`${rewards.length} recompensas calculadas e registradas com sucesso`);
    } else {
      console.log('Nenhuma recompensa calculada');
    }
    
    return {
      success: true,
      rewards_count: rewards.length
    };
  } catch (error) {
    console.error('Erro ao calcular recompensas:', error);
    throw error;
  }
}

module.exports = {
  takeSnapshot,
  calculateRewards
};