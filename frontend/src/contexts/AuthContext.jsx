import { createContext, useContext, useState, useEffect } from 'react'
import * as StellarSdk from 'stellar-sdk'
import axios from 'axios'

// Importação direta da API do Freighter
import { isConnected, getPublicKey, signTransaction } from '@stellar/freighter-api'

const AuthContext = createContext()

// Componente provedor do contexto de autenticação
function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

  // Verificar se o Freighter está instalado
  const isFreighterInstalled = async () => {
    try {
      console.log('[AUTH DEBUG] Verificando se Freighter está instalado...')
      // Tentar usar a API do Freighter diretamente
      const connected = await isConnected()
      console.log('[AUTH DEBUG] Freighter conectado:', connected)
      return true
    } catch (error) {
      console.error('[AUTH DEBUG] Erro ao verificar Freighter:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      return false
    }
  }

  // Conectar com Freighter
  const connectFreighter = async () => {
    try {
      console.log('[AUTH DEBUG] Iniciando processo de conexão com Freighter...')
      setIsLoading(true)
      setError(null)

      // Verificar se Freighter está instalado
      console.log('[AUTH DEBUG] Verificando instalação do Freighter...')
      const freighterInstalled = await isFreighterInstalled()
      console.log('[AUTH DEBUG] Freighter instalado:', freighterInstalled)
      
      if (!freighterInstalled) {
        throw new Error('Freighter wallet não está instalado. Por favor, instale a extensão Freighter.')
      }

      // Obter chave pública do Freighter
      console.log('[AUTH DEBUG] Solicitando chave pública do Freighter...')
      const publicKey = await getPublicKey()
      console.log('[AUTH DEBUG] Chave pública obtida:', publicKey ? 'Sim' : 'Não')
      
      if (!publicKey) {
        throw new Error('Não foi possível obter a chave pública. Verifique se o Freighter está desbloqueado.')
      }

      // Criar mensagem para autenticação
      const message = `Autenticação Stellar Stake House - ${Date.now()}`

      try {
        // Autenticação simples com chave pública
        console.log('[AUTH DEBUG] Enviando requisição de autenticação para:', `${API_URL}/api/auth/verify`)
        console.log('[AUTH DEBUG] Dados da requisição:', { publicKey: publicKey.substring(0, 10) + '...', message, simpleAuth: true })
        
        const response = await axios.post(`${API_URL}/api/auth/verify`, {
          publicKey,
          message,
          simpleAuth: true
        })
        
        console.log('[AUTH DEBUG] Resposta do backend:', response.status, response.data)

        if (response.data.success) {
          const userData = {
            publicKey,
            address: publicKey,
            ...response.data.user
          }
          
          console.log('[AUTH DEBUG] Autenticação bem-sucedida, definindo usuário...')
          setUser(userData)
          setIsAuthenticated(true)
          
          // Salvar no localStorage
          localStorage.setItem('stellar_auth', JSON.stringify({
            publicKey,
            timestamp: Date.now()
          }))
          
          console.log('[AUTH DEBUG] Dados salvos no localStorage')
          return userData
        } else {
          throw new Error(response.data.message || 'Falha na autenticação')
        }
      } catch (authError) {
        console.error('[AUTH DEBUG] Erro na autenticação:', {
          message: authError.message,
          response: authError.response?.data,
          status: authError.response?.status,
          stack: authError.stack
        })
        throw new Error(authError.response?.data?.message || authError.message || 'Erro na autenticação')
      }
    } catch (error) {
      console.error('[AUTH DEBUG] Erro geral na autenticação:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      })
      setError(error.message)
      throw error
    } finally {
      console.log('[AUTH DEBUG] Finalizando processo de autenticação')
      setIsLoading(false)
    }
  }

  // Desconectar
  const disconnect = () => {
    setUser(null)
    setIsAuthenticated(false)
    setError(null)
    localStorage.removeItem('stellar_auth')
  }

  // Verificar autenticação salva
  const checkSavedAuth = async () => {
    try {
      const savedAuth = localStorage.getItem('stellar_auth')
      if (savedAuth) {
        const { publicKey, timestamp } = JSON.parse(savedAuth)
        
        // Verificar se a autenticação não expirou (24 horas)
        const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000
        if (isExpired) {
          localStorage.removeItem('stellar_auth')
          return
        }

        // Verificar se ainda está conectado ao Freighter
        try {
          const currentPublicKey = await getPublicKey()
          if (currentPublicKey === publicKey) {
            const userData = {
              publicKey,
              address: publicKey
            }
            
            setUser(userData)
            setIsAuthenticated(true)
          } else {
            localStorage.removeItem('stellar_auth')
          }
        } catch (error) {
          localStorage.removeItem('stellar_auth')
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação salva:', error)
      localStorage.removeItem('stellar_auth')
    } finally {
      setIsLoading(false)
    }
  }

  // Verificar autenticação ao carregar
  useEffect(() => {
    checkSavedAuth()
  }, [])

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    connectFreighter,
    disconnect,
    isFreighterInstalled
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Exportações do contexto e provider
export { AuthContext, AuthProvider }