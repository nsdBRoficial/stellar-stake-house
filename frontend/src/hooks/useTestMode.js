import { useMultiAuth } from './useMultiAuth.js'
import mockApiService from '../services/mockApi.js'

/**
 * Hook personalizado para gerenciar o modo de teste
 * @returns {object} Funções e estado do modo de teste
 */
export function useTestMode() {
  const { isTestMode, user, currentStrategy } = useMultiAuth()
  
  /**
   * Verifica se está em modo de teste
   * @returns {boolean}
   */
  const isInTestMode = () => {
    return isTestMode && isTestMode()
  }
  
  /**
   * Verifica se o usuário atual é um usuário de teste
   * @returns {boolean}
   */
  const isTestUser = () => {
    return user && user.strategy === 'test'
  }
  
  /**
   * Obtém dados mock do dashboard
   * @returns {object|null}
   */
  const getMockDashboardData = () => {
    if (!isInTestMode() || !currentStrategy) {
      return null
    }
    
    try {
      return currentStrategy.generateMockDashboardData()
    } catch (error) {
      console.error('[TEST-MODE] Erro ao obter dados mock do dashboard:', error)
      return null
    }
  }
  
  /**
   * Obtém dados mock de staking
   * @returns {object|null}
   */
  const getMockStakingData = () => {
    if (!isInTestMode() || !currentStrategy) {
      return null
    }
    
    try {
      return currentStrategy.generateMockStakingData()
    } catch (error) {
      console.error('[TEST-MODE] Erro ao obter dados mock de staking:', error)
      return null
    }
  }
  
  /**
   * Obtém dados mock de recompensas
   * @returns {object|null}
   */
  const getMockRewardsData = () => {
    if (!isInTestMode() || !currentStrategy) {
      return null
    }
    
    try {
      return currentStrategy.generateMockRewardsData()
    } catch (error) {
      console.error('[TEST-MODE] Erro ao obter dados mock de recompensas:', error)
      return null
    }
  }
  
  /**
   * Obtém dados mock do histórico
   * @returns {array|null}
   */
  const getMockHistoryData = () => {
    if (!isInTestMode() || !currentStrategy) {
      return null
    }
    
    try {
      return currentStrategy.generateMockHistoryData()
    } catch (error) {
      console.error('[TEST-MODE] Erro ao obter dados mock do histórico:', error)
      return null
    }
  }
  
  /**
   * Executa uma operação mock (stake, unstake, claim)
   * @param {string} operation - Tipo de operação
   * @param {object} params - Parâmetros da operação
   * @returns {Promise<object>}
   */
  const executeMockOperation = async (operation, params = {}) => {
    if (!isInTestMode()) {
      throw new Error('Operação mock só pode ser executada em modo de teste')
    }
    
    const { stellarAddress, amount } = params
    
    switch (operation) {
      case 'stake':
        return await mockApiService.mockStakeOperation(stellarAddress, amount)
      case 'unstake':
        return await mockApiService.mockUnstakeOperation(stellarAddress, amount)
      case 'claim':
        return await mockApiService.mockClaimRewards(stellarAddress)
      default:
        throw new Error(`Operação mock '${operation}' não suportada`)
    }
  }
  
  /**
   * Obtém informações de preço mock
   * @returns {Promise<object>}
   */
  const getMockPriceInfo = async () => {
    if (!isInTestMode()) {
      return null
    }
    
    return await mockApiService.mockPriceInfo()
  }
  
  /**
   * Obtém estatísticas da rede mock
   * @returns {Promise<object>}
   */
  const getMockNetworkStats = async () => {
    if (!isInTestMode()) {
      return null
    }
    
    return await mockApiService.mockNetworkStats()
  }
  
  /**
   * Simula uma chamada de API com dados mock
   * @param {string} endpoint - Endpoint da API
   * @param {object} params - Parâmetros da chamada
   * @returns {Promise<object>}
   */
  const mockApiCall = async (endpoint, params = {}) => {
    if (!isInTestMode()) {
      throw new Error('Chamada mock só pode ser executada em modo de teste')
    }
    
    console.log(`[TEST-MODE] Simulando chamada para ${endpoint}`, params)
    
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
    
    // Retornar dados mock baseados no endpoint
    switch (endpoint) {
      case '/api/dashboard':
        return getMockDashboardData()
      case '/api/staking/balance':
        return getMockStakingData()
      case '/api/rewards':
        return getMockRewardsData()
      case '/api/history':
        return getMockHistoryData()
      case '/api/price':
        return await getMockPriceInfo()
      case '/api/network/stats':
        return await getMockNetworkStats()
      default:
        return { success: true, message: `Mock response for ${endpoint}` }
    }
  }
  
  return {
    // Estado
    isInTestMode: isInTestMode(),
    isTestUser: isTestUser(),
    
    // Dados mock
    getMockDashboardData,
    getMockStakingData,
    getMockRewardsData,
    getMockHistoryData,
    
    // Operações mock
    executeMockOperation,
    getMockPriceInfo,
    getMockNetworkStats,
    mockApiCall,
    
    // Serviço mock (para uso avançado)
    mockApiService
  }
}

/**
 * Hook para verificar se deve usar dados mock ou reais
 * @param {string} dataType - Tipo de dados (dashboard, staking, rewards, etc.)
 * @returns {boolean}
 */
export function useShouldUseMockData(dataType) {
  const { isInTestMode } = useTestMode()
  
  // Em modo de teste, sempre usar dados mock
  if (isInTestMode) {
    return true
  }
  
  // Verificar se há configuração específica para o tipo de dados
  const mockConfig = localStorage.getItem('mock_data_config')
  if (mockConfig) {
    try {
      const config = JSON.parse(mockConfig)
      return config[dataType] === true
    } catch (error) {
      console.warn('[TEST-MODE] Erro ao ler configuração de mock:', error)
    }
  }
  
  return false
}