import { createContext, useState, useEffect } from 'react'
import axios from 'axios'
import { AuthStrategyManager } from '../services/auth/AuthStrategy.js'
import { TestStrategy } from '../services/auth/TestStrategy.js'
import { AlbedoStrategy } from '../services/auth/AlbedoStrategy.js'
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
    manager.registerStrategy(new AlbedoStrategy())
    return manager
  })

  const loadAvailableStrategies = async () => {
    try {
      const strategies = await strategyManager.getAvailableStrategies()
      setAvailableStrategies(strategies)
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
      setIsLoading(true)
      setError(null)

      const strategy = strategyManager.getStrategy(strategyName)
      if (!strategy) throw new Error(`Estratégia '${strategyName}' não encontrada`)

      const isAvailable = await strategy.isAvailable()
      if (!isAvailable) throw new Error(`${strategy.displayName} não está disponível no momento`)

      const authResult = await strategy.authenticate()

      // Tentar autenticação no backend (simpleAuth para teste)
      let backendResult = { user: {}, session: null }
      try {
        backendResult = await authenticateWithBackend(authResult, strategyName)
      } catch (e) {
        console.warn('[MULTI-AUTH] Backend verify falhou, seguindo com dados locais:', e?.message)
        // Fallback mock apenas para test
        if (strategyName === 'test') {
          backendResult = await mockApiService.mockAuthVerify(authResult)
        }
      }

      const userData = {
        ...authResult,
        ...backendResult.user,
        strategy: strategyName,
        ...(backendResult.session ? { sessionId: backendResult.session.id } : {})
      }

      setUser(userData)
      setIsAuthenticated(true)
      setCurrentStrategy(strategy)
      strategyManager.setCurrentStrategy(strategyName)
      saveAuthData(userData, strategyName)
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
    let lastError = null
    for (const strategyName of strategies) {
      try {
        const result = await authenticateWith(strategyName)
        return result
      } catch (error) {
        lastError = error
        if (error.message.includes('cancelada') || error.message.includes('rejected') || error.message.includes('denied')) {
          break
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    throw lastError || new Error('Nenhuma estratégia de autenticação funcionou')
  }

  const authenticateWithBackend = async (authResult, strategyName) => {
    const message = `Autenticação Stellar Stake House - ${Date.now()}`
    const payload = {
      publicKey: authResult.publicKey,
      message,
      provider: strategyName,
      metadata: authResult.metadata,
      simpleAuth: true
    }
    const { data } = await axios.post(`${API_URL}/api/auth/verify`, payload)
    if (!data?.success) {
      throw new Error(data?.error || 'Falha na autenticação do backend')
    }
    return data
  }

  const saveAuthData = (userData, strategyName) => {
    try {
      const authData = {
        publicKey: userData.publicKey,
        strategy: strategyName,
        timestamp: Date.now(),
        provider: strategyName,
        ...(userData.email && { email: userData.email }),
        ...(userData.sessionId && { sessionId: userData.sessionId })
      }
      localStorage.setItem('stellar_auth', JSON.stringify(authData))
      localStorage.setItem('preferred_auth_strategy', strategyName)
    } catch (error) {
      console.error('[MULTI-AUTH] Erro ao salvar dados de autenticação:', error)
    }
  }

  const disconnect = async () => {
    try {
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
