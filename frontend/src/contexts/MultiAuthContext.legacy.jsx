import { createContext, useState, useEffect } from 'react'
import axios from 'axios'
import { AuthStrategyManager } from '../services/auth/AuthStrategy.js'
import { FreighterStrategy } from '../services/auth/FreighterStrategy.js'
import { AlbedoStrategy } from '../services/auth/AlbedoStrategy.js'
import { PasskeyStrategy } from '../services/auth/PasskeyStrategy.js'
import { TestStrategy } from '../services/auth/TestStrategy.js'
import mockApiService from '../services/mockApi.js'

const MultiAuthContext = createContext()

/**
 * Provedor de contexto para autenticação multi-modal
 */
function MultiAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [availableStrategies, setAvailableStrategies] = useState([])
  const [currentStrategy, setCurrentStrategy] = useState(null)
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'
  
  // Inicializar gerenciador de estratégias
  const [strategyManager] = useState(() => {
    const manager = new AuthStrategyManager()
    
    // Registrar todas as estratégias disponíveis
    manager.registerStrategy(new FreighterStrategy())
    manager.registerStrategy(new AlbedoStrategy())
    manager.registerStrategy(new PasskeyStrategy())
    manager.registerStrategy(new TestStrategy())
    
    return manager
  })

  /**
   * Carrega estratégias disponíveis
   */
  const loadAvailableStrategies = async () => {
    try {
      console.log('[MULTI-AUTH] Carregando estratégias disponíveis...')
      const strategies = await strategyManager.getAvailableStrategies()
      setAvailableStrategies(strategies)
      console.log('[MULTI-AUTH] Estratégias disponíveis:', strategies.map(s => s.name))
    } catch (error) {
      console.error('[MULTI-AUTH] Erro ao carregar estratégias:', error)
    }
  }

  /**
   * Autentica usando uma estratégia específica
   * @param {string} strategyName - Nome da estratégia
   * @param {object} options - Opções específicas da estratégia
   */
  const authenticateWith = async (strategyName, options = {}) => {
    try {
      console.log(`[MULTI-AUTH] Iniciando autenticação com ${strategyName}...`)
      setIsLoading(true)
      setError(null)

      const strategy = strategyManager.getStrategy(strategyName)
      if (!strategy) {
        throw new Error(`Estratégia '${strategyName}' não encontrada`)
      }

      // Verificar se a estratégia está disponível
      const isAvailable = await strategy.isAvailable()
      if (!isAvailable) {
        throw new Error(`${strategy.displayName} não está disponível no momento`)
      }

      // Realizar autenticação
      let authResult
      if (strategyName === 'passkey' && options.email) {
        authResult = await strategy.authenticate(options.email)
      } else {
        authResult = await strategy.authenticate()
      }

      // Validar resultado
      if (!authResult.publicKey) {
        throw new Error('Resultado de autenticação inválido')
      }

      // Configurar modo de teste se necessário
      if (strategyName === 'test') {
        mockApiService.enableTestMode(strategy)
        console.log('[MULTI-AUTH] Modo de teste ativado')
      } else {
        mockApiService.disableTestMode()
      }
      
      // Autenticar no backend (ou simular se for teste)
      let backendResult
      if (strategyName === 'test') {
        console.log('[MULTI-AUTH] Usando autenticação mock para modo de teste')
        backendResult = await mockApiService.mockAuthVerify(authResult)
      } else {
        console.log('[MULTI-AUTH] Usando autenticação real do backend')
        backendResult = await authenticateWithBackend(authResult, strategyName)
      }
      
      // Configurar estado da aplicação
      const userData = {
        ...authResult,
        ...backendResult.user,
        strategy: strategyName
      }
      
      setUser(userData)
      setIsAuthenticated(true)
      setCurrentStrategy(strategy)
      strategyManager.setCurrentStrategy(strategyName)
      
      // Salvar preferência e dados de sessão
      saveAuthData(userData, strategyName)
      
      console.log(`[MULTI-AUTH] Autenticação com ${strategyName} bem-sucedida`)
      return userData
      
    } catch (error) {
      console.error(`[MULTI-AUTH] Erro na autenticação com ${strategyName}:`, error)
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Tenta autenticação com fallback automático
   * @param {string} preferredStrategy - Estratégia preferida
   * @param {object} options - Opções de autenticação
   */
  const authenticateWithFallback = async (preferredStrategy, options = {}) => {
    const strategies = availableStrategies.map(s => s.name)
    
    // Colocar estratégia preferida no início
    if (preferredStrategy && strategies.includes(preferredStrategy)) {
      const index = strategies.indexOf(preferredStrategy)
      strategies.splice(index, 1)
      strategies.unshift(preferredStrategy)
    }
    
    console.log(`[MULTI-AUTH] Tentando autenticação com fallback. Ordem:`, strategies)
    
    let lastError = null
    
    for (const strategyName of strategies) {
      try {
        console.log(`[MULTI-AUTH] Tentando estratégia: ${strategyName}`)
        const result = await authenticateWith(strategyName, options)
        console.log(`[MULTI-AUTH] Sucesso com estratégia: ${strategyName}`)
        return result
      } catch (error) {
        console.log(`[MULTI-AUTH] Falha com ${strategyName}:`, error.message)
        lastError = error
        
        // Se o usuário cancelou, não tentar outras estratégias
        if (error.message.includes('cancelada') || 
            error.message.includes('rejected') ||
            error.message.includes('denied')) {
          console.log(`[MULTI-AUTH] Usuário cancelou, parando fallback`)
          break
        }
        
        // Aguardar um pouco antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    console.error(`[MULTI-AUTH] Todas as estratégias falharam`)
    throw lastError || new Error('Nenhuma estratégia de autenticação funcionou')
  }

  /**
   * Autentica no backend
   * @param {object} authResult - Resultado da autenticação da estratégia
   * @param {string} strategyName - Nome da estratégia utilizada
   */
  const authenticateWithBackend = async (authResult, strategyName) => {
    try {
      console.log('[MULTI-AUTH] Autenticando no backend...')
      
      const response = await axios.post(`${API_URL}/api/auth/verify`, {
        publicKey: authResult.publicKey,
        message: `Autenticação Stellar Stake House - ${Date.now()}`,
        provider: strategyName,
        metadata: authResult.metadata,
        simpleAuth: true
      })

      if (!response.data.success) {
        throw new Error(response.data.message || 'Falha na autenticação do backend')
      }

      console.log('[MULTI-AUTH] Autenticação no backend bem-sucedida')
      return response.data
      
    } catch (error) {
      console.error('[MULTI-AUTH] Erro na autenticação do backend:', error)
      throw new Error(error.response?.data?.message || error.message || 'Erro na autenticação do backend')
    }
  }

  /**
   * Salva dados de autenticação
   * @param {object} userData - Dados do usuário
   * @param {string} strategyName - Nome da estratégia
   */
  const saveAuthData = (userData, strategyName) => {
    try {
      const authData = {
        publicKey: userData.publicKey,
        strategy: strategyName,
        timestamp: Date.now(),
        provider: strategyName,
        ...(userData.metadata?.email && { email: userData.metadata.email })
      }
      
      localStorage.setItem('stellar_auth', JSON.stringify(authData))
      localStorage.setItem('preferred_auth_strategy', strategyName)
      
      console.log('[MULTI-AUTH] Dados de autenticação salvos')
    } catch (error) {
      console.error('[MULTI-AUTH] Erro ao salvar dados de autenticação:', error)
    }
  }

  /**
   * Desconecta o usuário
   */
  const disconnect = async () => {
    try {
      console.log('[MULTI-AUTH] Desconectando usuário...')
      
      // Desconectar da estratégia atual
      if (currentStrategy) {
        await currentStrategy.disconnect()
      }
      
      // Desativar modo de teste se estiver ativo
      if (mockApiService.isInTestMode()) {
        mockApiService.disableTestMode()
        console.log('[MULTI-AUTH] Modo de teste desativado')
      }
      
      // Limpar estado da aplicação
      setUser(null)
      setIsAuthenticated(false)
      setCurrentStrategy(null)
      setError(null)
      strategyManager.setCurrentStrategy(null)
      
      // Limpar dados salvos
      localStorage.removeItem('stellar_auth')
      localStorage.removeItem('preferred_auth_strategy')
      
      console.log('[MULTI-AUTH] Desconexão concluída')
    } catch (error) {
      console.error('[MULTI-AUTH] Erro na desconexão:', error)
    }
  }

  /**
   * Verifica autenticação salva
   */
  const checkSavedAuth = async () => {
    try {
      console.log('[MULTI-AUTH] Verificando autenticação salva...')
      
      const savedAuth = localStorage.getItem('stellar_auth')
      if (!savedAuth) {
        console.log('[MULTI-AUTH] Nenhuma autenticação salva encontrada')
        return
      }

      const authData = JSON.parse(savedAuth)
      
      // Verificar se não expirou (24 horas)
      const isExpired = Date.now() - authData.timestamp > 24 * 60 * 60 * 1000
      if (isExpired) {
        console.log('[MULTI-AUTH] Autenticação salva expirou')
        localStorage.removeItem('stellar_auth')
        return
      }

      // Verificar se a estratégia ainda está disponível
      const strategy = strategyManager.getStrategy(authData.strategy)
      if (!strategy) {
        console.log('[MULTI-AUTH] Estratégia salva não está mais disponível')
        localStorage.removeItem('stellar_auth')
        return
      }

      // Verificar sessão na estratégia
      const sessionData = await strategy.checkSession()
      if (sessionData && sessionData.publicKey === authData.publicKey) {
        console.log('[MULTI-AUTH] Restaurando sessão salva')
        
        const userData = {
          publicKey: authData.publicKey,
          address: authData.publicKey,
          strategy: authData.strategy,
          ...(authData.email && { email: authData.email })
        }
        
        setUser(userData)
        setIsAuthenticated(true)
        setCurrentStrategy(strategy)
        strategyManager.setCurrentStrategy(authData.strategy)
      } else {
        console.log('[MULTI-AUTH] Sessão salva não é mais válida')
        localStorage.removeItem('stellar_auth')
      }
      
    } catch (error) {
      console.error('[MULTI-AUTH] Erro ao verificar autenticação salva:', error)
      localStorage.removeItem('stellar_auth')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Obtém a estratégia preferida do usuário
   */
  const getPreferredStrategy = () => {
    return localStorage.getItem('preferred_auth_strategy')
  }

  /**
   * Assina uma transação usando a estratégia atual
   * @param {string} transaction - Transação XDR
   * @param {object} options - Opções de assinatura
   */
  const signTransaction = async (transaction, options = {}) => {
    if (!currentStrategy) {
      throw new Error('Nenhuma estratégia de autenticação ativa')
    }

    if (typeof currentStrategy.signTransaction !== 'function') {
      throw new Error('Estratégia atual não suporta assinatura de transações')
    }

    return await currentStrategy.signTransaction(transaction, options)
  }

  // Carregar estratégias disponíveis na inicialização
  useEffect(() => {
    const initialize = async () => {
      await loadAvailableStrategies()
      await checkSavedAuth()
    }
    
    initialize()
  }, [])

  const value = {
    // Estado
    user,
    isAuthenticated,
    isLoading,
    error,
    availableStrategies,
    currentStrategy,
    
    // Métodos
    authenticateWith,
    authenticateWithFallback,
    disconnect,
    signTransaction,
    getPreferredStrategy,
    loadAvailableStrategies,
    
    // Modo de teste
    isTestMode: () => mockApiService.isInTestMode(),
    
    // Gerenciador de estratégias (para uso avançado)
    strategyManager
  }

  return (
    <MultiAuthContext.Provider value={value}>
      {children}
    </MultiAuthContext.Provider>
  )
}

export { MultiAuthContext, MultiAuthProvider }
export default MultiAuthProvider