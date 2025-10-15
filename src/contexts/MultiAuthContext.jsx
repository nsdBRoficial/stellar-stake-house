import { createContext, useState, useEffect } from 'react'
import axios from 'axios'
import { AuthStrategyManager } from '../services/auth/AuthStrategy.js'
import { TestStrategy } from '../services/auth/TestStrategy.js'
import mockApiService from '../services/mockApi.js'
import getSupabaseClient from '../services/supabaseClient.js'

const MultiAuthContext = createContext()

function MultiAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [availableStrategies, setAvailableStrategies] = useState([])
  const [currentStrategy, setCurrentStrategy] = useState(null)
  const supabase = getSupabaseClient()

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

  const [strategyManager] = useState(() => {
    const manager = new AuthStrategyManager()
    manager.registerStrategy(new TestStrategy())
    return manager
  })

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

  const loginWithEmailPassword = async (email, password) => {
    try {
      setIsLoading(true)
      setError(null)

      if (!email || !password) {
        throw new Error('Informe e-mail e senha.')
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError

      const sessionUser = data.user
      const userData = {
        id: sessionUser?.id,
        email: sessionUser?.email,
        provider: 'email',
        strategy: 'web2-email',
      }

      setUser(userData)
      setIsAuthenticated(true)
      setCurrentStrategy(null)
      saveAuthData(userData, 'web2-email')
      return userData
    } catch (err) {
      console.error('[MULTI-AUTH] Erro no login email/senha:', err)
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      if (authError) throw authError

      return data
    } catch (err) {
      console.error('[MULTI-AUTH] Erro no login Google:', err)
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const signUpWithGoogle = async () => {
    return loginWithGoogle()
  }

  const authenticateWith = async (strategyName) => {
    try {
      console.log(`[MULTI-AUTH] Iniciando autenticação com ${strategyName}...`)
      setIsLoading(true)
      setError(null)

      const strategy = strategyManager.getStrategy(strategyName)
      if (!strategy) throw new Error(`Estratégia '${strategyName}' não encontrada`)

      const isAvailable = await strategy.isAvailable()
      if (!isAvailable) throw new Error(`${strategy.displayName} não está disponível no momento`)

      const authResult = await strategy.authenticate()

      let backendResult
      if (strategyName === 'test') {
        console.log('[MULTI-AUTH] Usando autenticação mock para modo de teste')
        backendResult = await mockApiService.mockAuthVerify(authResult)
      } else {
        backendResult = { user: {} }
      }

      const userData = {
        ...authResult,
        ...backendResult.user,
        strategy: strategyName
      }

      setUser(userData)
      setIsAuthenticated(true)
      setCurrentStrategy(strategy)
      strategyManager.setCurrentStrategy(strategyName)
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

  const authenticateWithFallback = async (preferredStrategy) => {
    const strategies = availableStrategies.map(s => s.name)
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
        const result = await authenticateWith(strategyName)
        console.log(`[MULTI-AUTH] Sucesso com estratégia: ${strategyName}`)
        return result
      } catch (error) {
        console.log(`[MULTI-AUTH] Falha com ${strategyName}:`, error.message)
        lastError = error
        if (error.message.includes('cancelada') || error.message.includes('rejected') || error.message.includes('denied')) {
          console.log(`[MULTI-AUTH] Usuário cancelou, parando fallback`)
          break
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    console.error(`[MULTI-AUTH] Todas as estratégias falharam`)
    throw lastError || new Error('Nenhuma estratégia de autenticação funcionou')
  }

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

  const saveAuthData = (userData, strategyName) => {
    try {
      const authData = {
        publicKey: userData.publicKey,
        strategy: strategyName,
        timestamp: Date.now(),
        provider: strategyName,
        ...(userData.email && { email: userData.email })
      }
      localStorage.setItem('stellar_auth', JSON.stringify(authData))
      localStorage.setItem('preferred_auth_strategy', strategyName)
      console.log('[MULTI-AUTH] Dados de autenticação salvos')
    } catch (error) {
      console.error('[MULTI-AUTH] Erro ao salvar dados de autenticação:', error)
    }
  }

  const disconnect = async () => {
    try {
      console.log('[MULTI-AUTH] Desconectando usuário...')
      if (currentStrategy) {
        await currentStrategy.disconnect()
      }
      try {
        await supabase.auth.signOut()
      } catch (e) {
        console.warn('[MULTI-AUTH] Falha ao encerrar sessão Supabase:', e?.message)
      }
      setUser(null)
      setIsAuthenticated(false)
      setError(null)
      setCurrentStrategy(null)
      localStorage.removeItem('stellar_auth')
      localStorage.removeItem('preferred_auth_strategy')
      console.log('[MULTI-AUTH] Usuário desconectado')
    } catch (error) {
      console.error('[MULTI-AUTH] Erro ao desconectar:', error)
    }
  }

  const getPreferredStrategy = () => {
    try {
      return localStorage.getItem('preferred_auth_strategy') || null
    } catch {
      return null
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const sessionUser = data?.session?.user
        if (sessionUser) {
          const userData = {
            id: sessionUser.id,
            email: sessionUser.email,
            provider: (sessionUser.app_metadata?.provider) || 'email',
            strategy: sessionUser.app_metadata?.provider === 'google' ? 'web2-google' : 'web2-email'
          }
          setUser(userData)
          setIsAuthenticated(true)
          saveAuthData(userData, userData.strategy)
        }
      } catch (e) {
        console.warn('[MULTI-AUTH] Sem sessão Supabase ativa:', e?.message)
      } finally {
        setIsLoading(false)
      }
    })()
    loadAvailableStrategies()
  }, [])

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    authenticateWith,
    authenticateWithFallback,
    getPreferredStrategy,
    availableStrategies,
    currentStrategy,
    disconnect,
    loginWithEmailPassword,
    loginWithGoogle,
    signUpWithGoogle
  }

  return (
    <MultiAuthContext.Provider value={value}>
      {children}
    </MultiAuthContext.Provider>
  )
}

export { MultiAuthContext, MultiAuthProvider }
export default MultiAuthProvider