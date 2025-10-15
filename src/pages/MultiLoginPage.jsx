import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMultiAuth, useAuthStrategies } from '../hooks/useMultiAuth.js'
import { useLanguage } from '../contexts/LanguageContext'
import { 
  Mail, 
  Loader2, 
  AlertCircle, 
  ArrowRight,
  Zap,
  Wallet
} from 'lucide-react'
import logo from '../assets/logo.svg'

const MultiLoginPage = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { 
    isAuthenticated, 
    isLoading, 
    error, 
    authenticateWith,
    authenticateWithFallback, 
    getPreferredStrategy,
    loginWithEmailPassword,
    loginWithGoogle,
    signUpWithGoogle,
  } = useMultiAuth()
  
  const { available: availableStrategies, hasTest } = useAuthStrategies()
  
  const [isConnecting, setIsConnecting] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [preferredStrategy, setPreferredStrategy] = useState(null)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const preferred = getPreferredStrategy()
    setPreferredStrategy(preferred)
  }, [])

  const handleEmailPasswordLogin = async () => {
    try {
      setIsConnecting(true)
      await loginWithEmailPassword(email, password)
      navigate('/dashboard')
    } catch (error) {
      console.error('Erro no login email/senha:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleQuickAuth = async (strategy) => {
    try {
      setIsConnecting(true)
      await authenticateWith(strategy.name)
    } catch (error) {
      console.error('Erro na autenticação rápida:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleEmergencyAuth = async () => {
    try {
      setIsConnecting(true)
      const preferred = getPreferredStrategy()
      await authenticateWithFallback(preferred)
    } catch (error) {
      console.error('Erro na autenticação de emergência:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">{t('auth.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-400 to-purple-500 p-3 rounded-2xl">
              <img src={logo} alt={t('header.title')} className="h-10 w-10" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('header.title')}
          </h1>
          <p className="text-gray-400">
            {t('auth.chooseAuthMethod')}
          </p>
        </div>

        {/* Test/Demo Mode */}
        {hasTest && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-xl">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{t('auth.testModeDemo')}</h3>
                    <p className="text-orange-200 text-sm">{t('auth.mvp')}</p>
                  </div>
                </div>
              </div>
              <p className="text-orange-200 text-sm mb-4">
                {t('auth.testModeDescription')}
              </p>
              <button
                onClick={() => handleQuickAuth({ name: 'test' })}
                disabled={isConnecting}
                className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                    <span className="text-white font-medium">{t('auth.loading')}</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 text-white" />
                    <span className="text-white font-medium">{t('auth.enterTestMode')}</span>
                    <ArrowRight className="h-5 w-5 text-white" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Login Web2 */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h2 className="text-white font-semibold text-lg mb-4">Login Web2</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={handleEmailPasswordLogin}
              disabled={isConnecting}
              className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  <span className="text-white font-medium">Conectando...</span>
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5 text-white" />
                  <span className="text-white font-medium">Entrar com e-mail e senha</span>
                </>
              )}
            </button>
            <div className="flex items-center justify-center">
              <span className="text-gray-400 text-sm">ou</span>
            </div>
            <button
              onClick={loginWithGoogle}
              disabled={isConnecting}
              className="w-full flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              <Wallet className="h-5 w-5 text-white" />
              <span className="text-white font-medium">Entrar com Google</span>
              <ArrowRight className="h-5 w-5 text-white" />
            </button>
            <button
              onClick={signUpWithGoogle}
              disabled={isConnecting}
              className="w-full flex items-center justify-center space-x-3 p-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-xl transition-all duration-200 border border-white/20"
            >
              <span className="text-white text-sm">Cadastrar-se (Google obrigatório)</span>
            </button>
            {error && (
              <div className="mt-3 flex items-center space-x-2 text-red-300 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Emergency Mode (fallback) */}
        {availableStrategies.length > 0 && (
          <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h2 className="text-white font-semibold text-lg mb-4">{t('auth.emergencyTitle') || 'Emergency Mode'}</h2>
            <p className="text-gray-300 text-sm mb-4">{t('auth.emergencyDescription') || 'Modo que testa todos os métodos automaticamente.'}</p>
            <button
              onClick={handleEmergencyAuth}
              disabled={isConnecting}
              className="w-full flex items-center justify-center space-x-3 p-4 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-xl transition-all duration-200 border border-white/20"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  <span className="text-white font-medium">{t('auth.loading')}</span>
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 text-white" />
                  <span className="text-white font-medium">{t('auth.emergencyMode') || 'Emergency Mode'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MultiLoginPage