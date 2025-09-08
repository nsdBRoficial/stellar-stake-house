import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMultiAuth, useAuthStrategies } from '../hooks/useMultiAuth.js'
import { useLanguage } from '../contexts/LanguageContext'
import { 
  Wallet, 
  Mail, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Star,
  Rocket,
  Shield,
  ArrowRight,
  ExternalLink,
  Fingerprint,
  Zap
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
    getPreferredStrategy 
  } = useMultiAuth()
  
  const { available: availableStrategies, hasFreighter, hasAlbedo, hasPasskey, hasTest } = useAuthStrategies()
  
  const [selectedStrategy, setSelectedStrategy] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [email, setEmail] = useState('')
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [preferredStrategy, setPreferredStrategy] = useState(null)

  // Redirecionar se já autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  // Carregar estratégia preferida
  useEffect(() => {
    const preferred = getPreferredStrategy()
    setPreferredStrategy(preferred)
  }, [])

  // Mapear ícones para estratégias
  const getStrategyIcon = (strategyName) => {
    switch (strategyName) {
      case 'freighter':
        return <Rocket className="h-6 w-6" />
      case 'albedo':
        return <Star className="h-6 w-6" />
      case 'passkey':
        return <Fingerprint className="h-6 w-6" />
      case 'test':
        return <Zap className="h-6 w-6" />
      default:
        return <Wallet className="h-6 w-6" />
    }
  }

  // Mapear descrições para estratégias
  const getStrategyDescription = (strategyName) => {
    switch (strategyName) {
      case 'freighter':
        return 'Extensão de carteira Stellar mais popular'
      case 'albedo':
        return 'Carteira web segura e confiável'
      case 'passkey':
        return 'Autenticação moderna com biometria'
      case 'test':
        return 'Modo demo com dados fictícios para testes'
      default:
        return 'Método de autenticação'
    }
  }

  // Mapear cores para estratégias
  const getStrategyColor = (strategyName) => {
    switch (strategyName) {
      case 'freighter':
        return 'from-blue-500 to-indigo-600'
      case 'albedo':
        return 'from-purple-500 to-pink-600'
      case 'passkey':
        return 'from-green-500 to-emerald-600'
      case 'test':
        return 'from-orange-500 to-red-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  // Lidar com seleção de estratégia
  const handleStrategySelect = (strategy) => {
    setSelectedStrategy(strategy)
    setShowEmailInput(strategy.name === 'passkey')
    setEmail('')
  }

  // Lidar com autenticação
  const handleAuthenticate = async () => {
    if (!selectedStrategy) return

    try {
      setIsConnecting(true)
      
      const options = {}
      if (selectedStrategy.name === 'passkey') {
        if (!email) {
          throw new Error(t('auth.emailRequired'))
        }
        options.email = email
      }

      await authenticateWith(selectedStrategy.name, options)
      // Redirecionamento será feito pelo useEffect
    } catch (error) {
      console.error('Erro na autenticação:', error)
      // O erro será mostrado pelo contexto
    } finally {
      setIsConnecting(false)
    }
  }

  // Lidar com autenticação rápida (estratégia preferida)
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

  // Lidar com autenticação de emergência (tenta todos os métodos)
  const handleEmergencyAuth = async () => {
    try {
      setIsConnecting(true)
      
      const preferred = getPreferredStrategy()
      await authenticateWithFallback(preferred, { email })
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

        {/* Modo de Teste/Demo */}
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

        {/* Métodos Disponíveis */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h2 className="text-white font-semibold text-lg mb-4">{t('auth.availableMethods')}</h2>
          
          <div className="space-y-3">
            {availableStrategies
              .filter(s => s.name !== 'test')
              .map((strategy) => (
                <button
                  key={strategy.name}
                  onClick={() => handleQuickAuth(strategy)}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 border border-white/10 hover:border-purple-500/50 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${getStrategyColor(strategy.name)}`}>
                      {getStrategyIcon(strategy.name)}
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">{strategy.displayName}</p>
                      <p className="text-gray-400 text-sm">{getStrategyDescription(strategy.name)}</p>
                    </div>
                  </div>
                  {isConnecting ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                  )}
                </button>
              ))
            }
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="mt-6 bg-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-red-500/30">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-200 font-medium">{t('auth.authenticationError')}</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
            
            {/* Botão de Emergência */}
            <div className="mt-4 pt-4 border-t border-red-500/30">
              <p className="text-red-200 text-sm mb-3">
                {t('auth.connectionTrouble')}
              </p>
              <button
                onClick={handleEmergencyAuth}
                disabled={isConnecting}
                className="w-full px-4 py-2 bg-red-600/50 hover:bg-red-600/70 disabled:opacity-50 rounded-lg transition-colors text-red-100 font-medium"
              >
                {isConnecting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('auth.trying')}</span>
                  </div>
                ) : (
                  t('auth.emergencyMode')
                )}
              </button>
            </div>
          </div>
        )}

        {/* Links de Ajuda */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm mb-4">
            {t('auth.noWallet')}
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="https://freighter.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span className="text-sm">{t('auth.getFreighter')}</span>
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href="https://albedo.link/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <span className="text-sm">{t('auth.getAlbedo')}</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-6 text-gray-500">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm">{t('auth.secure')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Rocket className="h-4 w-4" />
              <span className="text-sm">{t('auth.fast')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <span className="text-sm">{t('auth.stellar')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MultiLoginPage