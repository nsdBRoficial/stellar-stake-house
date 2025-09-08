import { AuthStrategy } from './AuthStrategy.js'

/**
 * Estratégia de autenticação para modo de teste/demo
 * Permite acesso sem autenticação real usando dados fictícios
 */
export class TestStrategy extends AuthStrategy {
  constructor() {
    super('test', 'Modo Teste/Demo', '🧪')
  }

  /**
   * Sempre disponível para testes
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    console.log('[TEST] Modo de teste sempre disponível')
    return true
  }

  /**
   * Simula autenticação com dados fictícios
   * @returns {Promise<{publicKey: string, address: string, metadata: object}>}
   */
  async authenticate() {
    try {
      console.log('[TEST] Iniciando autenticação de teste...')
      
      // Simular delay de autenticação real
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Gerar chave pública fictícia mas válida para Stellar
      const testPublicKey = 'GBTESTDEMOUSERFORSTELLARSTAKEHOUSE234567890ABCDEFGH'
      
      console.log('[TEST] Autenticação de teste bem-sucedida')
      
      return {
        publicKey: testPublicKey,
        address: testPublicKey,
        metadata: {
          provider: 'test',
          timestamp: Date.now(),
          isTestMode: true,
          testUser: {
            name: 'Usuário Demo',
            email: 'demo@stellarstakehouse.com',
            accountType: 'test'
          }
        }
      }
    } catch (error) {
      console.error('[TEST] Erro na autenticação de teste:', error)
      throw new Error(`Erro no modo de teste: ${error.message}`)
    }
  }

  /**
   * Simula desconexão
   * @returns {Promise<void>}
   */
  async disconnect() {
    console.log('[TEST] Desconectando do modo de teste...')
    return Promise.resolve()
  }

  /**
   * Verifica sessão de teste
   * @returns {Promise<object|null>}
   */
  async checkSession() {
    try {
      // Verificar se há dados de teste salvos
      const savedAuth = localStorage.getItem('stellar_auth')
      if (!savedAuth) {
        return null
      }

      const authData = JSON.parse(savedAuth)
      if (authData.provider === 'test' && authData.publicKey) {
        // Verificar se a sessão de teste ainda é válida (1 hora)
        const isExpired = Date.now() - authData.timestamp > 60 * 60 * 1000
        if (!isExpired) {
          return {
            publicKey: authData.publicKey,
            address: authData.publicKey,
            provider: 'test',
            isTestMode: true
          }
        }
      }
      return null
    } catch (error) {
      console.log('[TEST] Erro ao verificar sessão de teste:', error.message)
      return null
    }
  }

  /**
   * Simula assinatura de transação
   * @param {string} transaction - Transação XDR
   * @param {object} options - Opções de assinatura
   * @returns {Promise<string>}
   */
  async signTransaction(transaction, options = {}) {
    try {
      console.log('[TEST] Simulando assinatura de transação...')
      
      // Simular delay de assinatura
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Retornar transação "assinada" fictícia
      const signedTransaction = `${transaction}_SIGNED_BY_TEST_USER`
      
      console.log('[TEST] Transação assinada com sucesso (simulação)')
      return signedTransaction
    } catch (error) {
      console.error('[TEST] Erro ao simular assinatura:', error)
      throw new Error(`Erro na assinatura de teste: ${error.message}`)
    }
  }

  /**
   * Gera dados fictícios para o dashboard
   * @returns {object}
   */
  generateMockDashboardData() {
    return {
      kaleBalance: 15750.50,
      stakedAmount: 8500.25,
      pendingRewards: 125.75,
      totalRewardsEarned: 2340.80,
      kalePrice: 0.0234,
      rewardRate: 12.5, // APY
      estimatedDailyReward: 2.85,
      recentTransactions: [
        {
          id: 'test_tx_001',
          type: 'stake',
          amount: 1000,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          hash: 'test_hash_001'
        },
        {
          id: 'test_tx_002',
          type: 'reward',
          amount: 25.50,
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'completed',
          hash: 'test_hash_002'
        },
        {
          id: 'test_tx_003',
          type: 'unstake',
          amount: 500,
          date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          hash: 'test_hash_003'
        }
      ]
    }
  }

  /**
   * Gera dados fictícios para histórico
   * @returns {array}
   */
  generateMockHistoryData() {
    const transactions = []
    const types = ['stake', 'unstake', 'reward', 'transfer']
    const statuses = ['completed', 'pending', 'failed']
    
    for (let i = 0; i < 25; i++) {
      const type = types[Math.floor(Math.random() * types.length)]
      const status = i < 20 ? 'completed' : statuses[Math.floor(Math.random() * statuses.length)]
      const amount = Math.random() * 1000 + 10
      const daysAgo = Math.floor(Math.random() * 30)
      
      transactions.push({
        id: `test_tx_${String(i + 1).padStart(3, '0')}`,
        type,
        amount: parseFloat(amount.toFixed(2)),
        date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        status,
        hash: `test_hash_${String(i + 1).padStart(3, '0')}`,
        fee: parseFloat((Math.random() * 0.1).toFixed(4))
      })
    }
    
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  /**
   * Gera dados fictícios para staking
   * @returns {object}
   */
  generateMockStakingData() {
    return {
      availableBalance: 7250.25,
      stakedBalance: 8500.25,
      pendingStake: 0,
      pendingUnstake: 500,
      minimumStake: 100,
      maximumStake: 50000,
      currentAPY: 12.5,
      lockPeriod: 7, // dias
      nextRewardDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      stakingPools: [
        {
          id: 'pool_001',
          name: 'Pool Principal',
          apy: 12.5,
          totalStaked: 1250000,
          userStaked: 8500.25,
          minStake: 100
        },
        {
          id: 'pool_002',
          name: 'Pool Premium',
          apy: 15.0,
          totalStaked: 750000,
          userStaked: 0,
          minStake: 1000
        }
      ]
    }
  }

  /**
   * Gera dados fictícios para recompensas
   * @returns {object}
   */
  generateMockRewardsData() {
    return {
      totalEarned: 2340.80,
      pendingRewards: 125.75,
      claimableRewards: 98.50,
      nextRewardAmount: 2.85,
      nextRewardDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      rewardHistory: [
        {
          id: 'reward_001',
          amount: 25.50,
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'claimed',
          pool: 'Pool Principal'
        },
        {
          id: 'reward_002',
          amount: 24.75,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'claimed',
          pool: 'Pool Principal'
        },
        {
          id: 'reward_003',
          amount: 26.10,
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'claimed',
          pool: 'Pool Principal'
        }
      ]
    }
  }
}