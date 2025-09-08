import React, { useState } from 'react'
import { 
  X, 
  Zap, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Info,
  ArrowRight
} from 'lucide-react'

const StakingModal = ({ isOpen, onClose, tokens, onStake }) => {
  const [selectedToken, setSelectedToken] = useState('KALE')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const currentToken = tokens?.[selectedToken] || {}
  const userBalance = currentToken.walletBalance || 0

  const handleAmountChange = (e) => {
    const value = e.target.value
    // Permitir apenas números e ponto decimal
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value)
      setError('')
    }
  }

  const setMaxAmount = () => {
    setAmount(userBalance.toString())
    setError('')
  }

  const validateAmount = () => {
    const numAmount = parseFloat(amount)
    
    if (!amount || numAmount <= 0) {
      setError('Digite um valor válido')
      return false
    }
    
    if (numAmount > userBalance) {
      setError('Valor excede o saldo disponível')
      return false
    }
    
    if (numAmount < 1) {
      setError('Valor mínimo para staking é 1 KALE')
      return false
    }
    
    return true
  }

  const handleStake = async () => {
    if (!validateAmount()) return
    
    try {
      setIsLoading(true)
      setError('')
      
      // Simular delegação de staking
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Chamar função de callback
      await onStake(selectedToken, parseFloat(amount))
      
      setSuccess(true)
      
      // Fechar modal após sucesso
      setTimeout(() => {
        setSuccess(false)
        setAmount('')
        setSelectedToken('KALE')
        onClose()
      }, 2000)
      
    } catch (err) {
      setError(err.message || 'Erro ao processar staking')
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl border border-white/20 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Fazer Staking</h2>
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
              <h3 className="text-xl font-bold text-white mb-2">Delegação Realizada!</h3>
              <p className="text-gray-400">
                {formatNumber(parseFloat(amount))} {selectedToken} foram delegados com sucesso
              </p>
            </div>
          ) : (
            <>
              {/* Info sobre delegação */}
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-blue-200 font-medium mb-1">Delegação Segura na Rede Stellar</h4>
                    <p className="text-blue-200 text-sm mb-2">
                      Você está <strong>delegando</strong> seus tokens através de contratos inteligentes verificados. 
                      Seus tokens <strong>NUNCA saem da sua carteira</strong> - você mantém controle total dos seus ativos.
                    </p>
                    <p className="text-blue-300 text-xs">
                      ✓ Tokens permanecem na sua carteira • ✓ Pode cancelar a qualquer momento • ✓ Recompensas proporcionais via Reflector Oracle
                    </p>
                  </div>
                </div>
              </div>

              {/* Seletor de Token */}
              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Selecionar Token
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(tokens || {}).map(([symbol, tokenData]) => (
                    <button
                      key={symbol}
                      onClick={() => setSelectedToken(symbol)}
                      className={`p-4 rounded-xl border transition-all duration-200 ${
                        selectedToken === symbol
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
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
                    </button>
                  ))}
                </div>
              </div>

              {/* Saldo disponível */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-gray-300 text-sm font-medium">Saldo Disponível</label>
                  <span className="text-white font-semibold">{formatNumber(userBalance)} {selectedToken}</span>
                </div>
              </div>

              {/* Input de valor */}
              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Valor para Staking
                </label>
                <div className="relative">
                    <input
                      type="text"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="0.00"
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                      <span className="text-gray-400 text-sm">{selectedToken}</span>
                      <button
                        onClick={setMaxAmount}
                        className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                {error && (
                  <div className="flex items-center space-x-2 mt-2">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-red-400 text-sm">{error}</span>
                  </div>
                )}
              </div>

              {/* Informações de recompensa */}
              {amount && parseFloat(amount) > 0 && (
                <div className="bg-white/5 rounded-xl p-4 mb-6">
                  <h4 className="text-white font-medium mb-3">Estimativa de Recompensas</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">APY Atual:</span>
                      <span className="text-green-400 font-semibold">{formatNumber(currentToken.apy || 0, 1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Recompensa Diária Estimada:</span>
                      <span className="text-white font-semibold">
                        {formatNumber((parseFloat(amount) * (currentToken.apy || 0) / 100) / 365)} {selectedToken}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Recompensa Mensal Estimada:</span>
                      <span className="text-white font-semibold">
                        {formatNumber((parseFloat(amount) * (currentToken.apy || 0) / 100) / 12)} {selectedToken}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Valor Estimado Mensal:</span>
                      <span className="text-white font-semibold">
                        {formatCurrency(((parseFloat(amount) * (currentToken.apy || 0) / 100) / 12) * (currentToken.price || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Botão de ação */}
              <button
                onClick={handleStake}
                disabled={isLoading || !amount || parseFloat(amount) <= 0}
                className="w-full flex items-center justify-center space-x-3 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                    <span className="text-white font-semibold">Processando Delegação...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 text-white" />
                    <span className="text-white font-semibold">Delegar {amount ? formatNumber(parseFloat(amount)) : '0'} {selectedToken}</span>
                    <ArrowRight className="h-5 w-5 text-white" />
                  </>
                )}
              </button>

              {/* Disclaimer */}
              <div className="mt-4 text-center">
                <p className="text-gray-400 text-xs">
                  Ao confirmar, você está assinando um contrato de delegação. 
                  Seus tokens permanecem em sua carteira.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default StakingModal