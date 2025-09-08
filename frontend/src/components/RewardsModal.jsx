import React, { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { 
  X, 
  Gift, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Info,
  ArrowRight,
  TrendingUp
} from 'lucide-react'

const RewardsModal = ({ isOpen, onClose, tokens, onClaim }) => {
  const { t } = useLanguage()
  const [selectedToken, setSelectedToken] = useState('KALE')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const currentToken = tokens?.[selectedToken] || {}
  const pendingRewards = currentToken.pendingRewards || 0
  const totalEarned = currentToken.totalRewardsEarned || 0

  const handleClaim = async () => {
    if (pendingRewards <= 0) {
      setError(t('staking.noRewardsAvailable'))
      return
    }
    
    try {
      setIsLoading(true)
      setError('')
      
      // Simular resgate de recompensas
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Chamar função de callback
      await onClaim(selectedToken, pendingRewards)
      
      setSuccess(true)
      
      // Fechar modal após sucesso
      setTimeout(() => {
        setSuccess(false)
        setSelectedToken('KALE')
        onClose()
      }, 2000)
      
    } catch (err) {
      setError(err.message || t('staking.errorProcessingClaim'))
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(value)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl border border-white/20 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-xl">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">{t('staking.claimRewards')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{t('staking.claimCompleted')}</h3>
              <p className="text-gray-400">
                {formatNumber(pendingRewards)} {selectedToken} {t('staking.claimedSuccessfully')}
              </p>
            </div>
          ) : (
            <>
              {/* Seletor de Token */}
              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  {t('staking.selectTokenClaim')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(tokens || {}).map(([symbol, tokenData]) => (
                    <button
                      key={symbol}
                      onClick={() => setSelectedToken(symbol)}
                      className={`p-4 rounded-xl border transition-all duration-200 ${
                        selectedToken === symbol
                          ? 'border-orange-500 bg-orange-500/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            symbol === 'KALE' 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                              : 'bg-gradient-to-r from-blue-500 to-cyan-600'
                          }`}>
                            <span className="text-white font-bold text-sm">{symbol}</span>
                          </div>
                          <div className="text-left">
                            <p className="text-white font-medium text-sm">{tokenData.name}</p>
                            <p className="text-gray-400 text-xs">{formatCurrency(tokenData.price)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-orange-400 font-semibold text-sm">
                            {formatNumber(tokenData.pendingRewards || 0)}
                          </p>
                          <p className="text-gray-400 text-xs">{t('staking.pending')}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Info sobre resgate */}
              <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-orange-200 font-medium mb-1">{t('staking.verifiedRewardsTitle')}</h4>
                    <p className="text-orange-200 text-sm mb-2">
                      {t('staking.verifiedRewardsDesc')}
                    </p>
                    <p className="text-orange-300 text-xs">
                      {t('staking.verifiedRewardsFeatures')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Resumo de recompensas */}
              <div className="bg-white/5 rounded-xl p-6 mb-6">
                <h3 className="text-white font-semibold text-lg mb-4 flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  <span>{t('staking.availableRewards')}</span>
                </h3>
                
                <div className="space-y-4">
                  {/* Recompensas Pendentes */}
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30">
                    <div>
                      <p className="text-orange-200 text-sm font-medium">{t('staking.pending')}</p>
                      <p className="text-white text-2xl font-bold">{formatNumber(pendingRewards)} {selectedToken}</p>
                      <p className="text-orange-200 text-xs">≈ {formatCurrency(pendingRewards * (currentToken.price || 0))}</p>
                    </div>
                    <Gift className="h-8 w-8 text-orange-400" />
                  </div>
                  
                  {/* Total Ganho */}
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-gray-400">{t('staking.totalEarned')}:</span>
                    <div className="text-right">
                      <span className="text-green-400 font-semibold">{formatNumber(totalEarned)} {selectedToken}</span>
                      <p className="text-gray-400 text-xs">≈ {formatCurrency(totalEarned * (currentToken.price || 0))}</p>
                    </div>
                  </div>
                  
                  {/* APY Atual */}
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-gray-400">{t('staking.currentApy')}:</span>
                    <span className="text-green-400 font-semibold">{formatNumber(currentToken.apy || 0, 1)}%</span>
                  </div>
                  
                  {/* Saldo Delegado */}
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-gray-400">{t('dashboard.delegated')}:</span>
                    <span className="text-white font-semibold">{formatNumber(currentToken.delegatedAmount || 0)} {selectedToken}</span>
                  </div>
                  
                  {/* Próxima Recompensa */}
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-400">Next Reward:</span>
                    <span className="text-white font-semibold">~24h</span>
                  </div>
                </div>
              </div>

              {/* Aviso se não há recompensas */}
              {pendingRewards <= 0 && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                    <div>
                      <h4 className="text-yellow-200 font-medium">{t('staking.noRewardsAvailable')}</h4>
                      <p className="text-yellow-200 text-sm">
                        You don't have any pending rewards to claim at the moment.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Erro */}
              {error && (
                <div className="flex items-center space-x-2 mb-4">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              {/* Botão de ação */}
              <button
                onClick={handleClaim}
                disabled={isLoading || pendingRewards <= 0}
                className="w-full flex items-center justify-center space-x-3 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                    <span className="text-white font-semibold">{t('staking.processingClaim')}</span>
                  </>
                ) : (
                  <>
                    <Gift className="h-5 w-5 text-white" />
                    <span className="text-white font-semibold">
                      {pendingRewards > 0 
                        ? `${t('staking.claimNow')} ${formatNumber(pendingRewards)} ${selectedToken}` 
                        : t('staking.noRewardsAvailable')
                      }
                    </span>
                    {pendingRewards > 0 && <ArrowRight className="h-5 w-5 text-white" />}
                  </>
                )}
              </button>

              {/* Disclaimer */}
              <div className="mt-4 text-center">
                <p className="text-gray-400 text-xs">
                  {t('staking.claimDisclaimer')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default RewardsModal