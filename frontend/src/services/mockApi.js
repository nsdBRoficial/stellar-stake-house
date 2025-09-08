/**
 * Serviço de API Mock para modo de teste
 * Simula todas as chamadas do backend com dados fictícios
 */

class MockApiService {
  constructor() {
    this.isTestMode = false
    this.testStrategy = null
  }

  /**
   * Ativa o modo de teste
   * @param {TestStrategy} testStrategy - Instância da estratégia de teste
   */
  enableTestMode(testStrategy) {
    this.isTestMode = true
    this.testStrategy = testStrategy
    console.log('[MOCK-API] Modo de teste ativado')
  }

  /**
   * Desativa o modo de teste
   */
  disableTestMode() {
    this.isTestMode = false
    this.testStrategy = null
    console.log('[MOCK-API] Modo de teste desativado')
  }

  /**
   * Verifica se está em modo de teste
   * @returns {boolean}
   */
  isInTestMode() {
    return this.isTestMode
  }

  /**
   * Simula delay de rede
   * @param {number} min - Delay mínimo em ms
   * @param {number} max - Delay máximo em ms
   */
  async simulateNetworkDelay(min = 300, max = 1000) {
    const delay = Math.random() * (max - min) + min
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Mock para autenticação
   * @param {object} authData - Dados de autenticação
   * @returns {Promise<object>}
   */
  async mockAuthVerify(authData) {
    console.log('[MOCK-API] Simulando verificação de autenticação...')
    await this.simulateNetworkDelay(500, 1500)
    
    return {
      success: true,
      user: {
        id: 'test_user_001',
        stellar_address: authData.publicKey,
        email: 'demo@stellarstakehouse.com',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        account_type: 'test'
      },
      session: {
        token: 'test_session_token_123',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    }
  }

  /**
   * Mock para dados do dashboard
   * @param {string} stellarAddress - Endereço Stellar
   * @returns {Promise<object>}
   */
  async mockDashboardData(stellarAddress) {
    console.log('[MOCK-API] Carregando dados do dashboard...')
    await this.simulateNetworkDelay()
    
    if (!this.testStrategy) {
      throw new Error('Estratégia de teste não configurada')
    }
    
    return this.testStrategy.generateMockDashboardData()
  }

  /**
   * Mock para saldo de staking
   * @param {string} stellarAddress - Endereço Stellar
   * @returns {Promise<object>}
   */
  async mockStakingBalance(stellarAddress) {
    console.log('[MOCK-API] Consultando saldo de staking...')
    await this.simulateNetworkDelay()
    
    if (!this.testStrategy) {
      throw new Error('Estratégia de teste não configurada')
    }
    
    const stakingData = this.testStrategy.generateMockStakingData()
    return {
      balance: stakingData.availableBalance,
      staked: stakingData.stakedBalance,
      pending_stake: stakingData.pendingStake,
      pending_unstake: stakingData.pendingUnstake
    }
  }

  /**
   * Mock para status de staking
   * @param {string} stellarAddress - Endereço Stellar
   * @returns {Promise<object>}
   */
  async mockStakingStatus(stellarAddress) {
    console.log('[MOCK-API] Consultando status de staking...')
    await this.simulateNetworkDelay()
    
    if (!this.testStrategy) {
      throw new Error('Estratégia de teste não configurada')
    }
    
    return this.testStrategy.generateMockStakingData()
  }

  /**
   * Mock para recompensas pendentes
   * @param {string} stellarAddress - Endereço Stellar
   * @returns {Promise<object>}
   */
  async mockPendingRewards(stellarAddress) {
    console.log('[MOCK-API] Consultando recompensas pendentes...')
    await this.simulateNetworkDelay()
    
    if (!this.testStrategy) {
      throw new Error('Estratégia de teste não configurada')
    }
    
    const rewardsData = this.testStrategy.generateMockRewardsData()
    return {
      pending: rewardsData.pendingRewards,
      claimable: rewardsData.claimableRewards,
      next_reward: {
        amount: rewardsData.nextRewardAmount,
        date: rewardsData.nextRewardDate
      }
    }
  }

  /**
   * Mock para histórico de transações
   * @param {string} stellarAddress - Endereço Stellar
   * @param {object} params - Parâmetros de paginação
   * @returns {Promise<object>}
   */
  async mockTransactionHistory(stellarAddress, params = {}) {
    console.log('[MOCK-API] Carregando histórico de transações...')
    await this.simulateNetworkDelay()
    
    if (!this.testStrategy) {
      throw new Error('Estratégia de teste não configurada')
    }
    
    const allTransactions = this.testStrategy.generateMockHistoryData()
    const page = params.page || 1
    const limit = params.limit || 10
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    
    return {
      transactions: allTransactions.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total: allTransactions.length,
        pages: Math.ceil(allTransactions.length / limit)
      }
    }
  }

  /**
   * Mock para operação de stake
   * @param {string} stellarAddress - Endereço Stellar
   * @param {number} amount - Quantidade a fazer stake
   * @returns {Promise<object>}
   */
  async mockStakeOperation(stellarAddress, amount) {
    console.log(`[MOCK-API] Simulando stake de ${amount} KALE...`)
    await this.simulateNetworkDelay(2000, 4000)
    
    // Simular possível falha (5% de chance)
    if (Math.random() < 0.05) {
      throw new Error('Falha simulada na operação de stake')
    }
    
    return {
      success: true,
      transaction_id: `test_stake_${Date.now()}`,
      amount,
      fee: 0.0001,
      estimated_completion: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      message: 'Operação de stake enviada com sucesso'
    }
  }

  /**
   * Mock para operação de unstake
   * @param {string} stellarAddress - Endereço Stellar
   * @param {number} amount - Quantidade a fazer unstake
   * @returns {Promise<object>}
   */
  async mockUnstakeOperation(stellarAddress, amount) {
    console.log(`[MOCK-API] Simulando unstake de ${amount} KALE...`)
    await this.simulateNetworkDelay(2000, 4000)
    
    // Simular possível falha (5% de chance)
    if (Math.random() < 0.05) {
      throw new Error('Falha simulada na operação de unstake')
    }
    
    return {
      success: true,
      transaction_id: `test_unstake_${Date.now()}`,
      amount,
      fee: 0.0001,
      unlock_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      message: 'Operação de unstake enviada com sucesso'
    }
  }

  /**
   * Mock para claim de recompensas
   * @param {string} stellarAddress - Endereço Stellar
   * @returns {Promise<object>}
   */
  async mockClaimRewards(stellarAddress) {
    console.log('[MOCK-API] Simulando claim de recompensas...')
    await this.simulateNetworkDelay(1500, 3000)
    
    // Simular possível falha (3% de chance)
    if (Math.random() < 0.03) {
      throw new Error('Falha simulada no claim de recompensas')
    }
    
    const claimedAmount = Math.random() * 50 + 10 // Entre 10 e 60
    
    return {
      success: true,
      transaction_id: `test_claim_${Date.now()}`,
      amount: parseFloat(claimedAmount.toFixed(2)),
      fee: 0.0001,
      message: 'Recompensas resgatadas com sucesso'
    }
  }

  /**
   * Mock para informações de preço
   * @returns {Promise<object>}
   */
  async mockPriceInfo() {
    console.log('[MOCK-API] Consultando informações de preço...')
    await this.simulateNetworkDelay(200, 500)
    
    // Simular flutuação de preço
    const basePrice = 0.0234
    const variation = (Math.random() - 0.5) * 0.002 // ±0.001
    const currentPrice = basePrice + variation
    
    return {
      kale_price_usd: parseFloat(currentPrice.toFixed(6)),
      kale_price_xlm: parseFloat((currentPrice * 8.5).toFixed(6)),
      change_24h: parseFloat(((Math.random() - 0.5) * 10).toFixed(2)), // ±5%
      volume_24h: Math.floor(Math.random() * 1000000) + 500000,
      market_cap: Math.floor(Math.random() * 10000000) + 50000000
    }
  }

  /**
   * Mock para estatísticas da rede
   * @returns {Promise<object>}
   */
  async mockNetworkStats() {
    console.log('[MOCK-API] Consultando estatísticas da rede...')
    await this.simulateNetworkDelay(300, 700)
    
    return {
      total_staked: Math.floor(Math.random() * 10000000) + 50000000,
      total_stakers: Math.floor(Math.random() * 10000) + 5000,
      current_apy: parseFloat((Math.random() * 5 + 10).toFixed(1)), // 10-15%
      next_snapshot: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      network_health: 'healthy'
    }
  }
}

// Instância singleton
const mockApiService = new MockApiService()

export default mockApiService