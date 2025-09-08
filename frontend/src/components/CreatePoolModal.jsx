import React, { useState } from 'react'
import { 
  X, 
  Plus, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Info,
  ArrowRight,
  Target,
  Calendar,
  DollarSign
} from 'lucide-react'

const CreatePoolModal = ({ isOpen, onClose, onCreatePool }) => {
  const [formData, setFormData] = useState({
    tokenSymbol: 'KALE',
    totalRewards: '',
    maxAPY: '',
    distributionDays: '',
    poolName: '',
    description: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const formatNumber = (value, decimals = 2) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const calculateDailyDistribution = () => {
    if (formData.totalRewards && formData.distributionDays) {
      return parseFloat(formData.totalRewards) / parseFloat(formData.distributionDays)
    }
    return 0
  }

  const validateForm = () => {
    if (!formData.poolName.trim()) {
      setError('Nome da pool é obrigatório')
      return false
    }
    
    if (!formData.totalRewards || parseFloat(formData.totalRewards) <= 0) {
      setError('Quantidade de recompensas deve ser maior que zero')
      return false
    }
    
    if (!formData.maxAPY || parseFloat(formData.maxAPY) <= 0 || parseFloat(formData.maxAPY) > 100) {
      setError('APY deve estar entre 0.1% e 100%')
      return false
    }
    
    if (!formData.distributionDays || parseFloat(formData.distributionDays) < 1) {
      setError('Período de distribuição deve ser de pelo menos 1 dia')
      return false
    }
    
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    try {
      setIsLoading(true)
      setError('')
      
      // Simular criação da pool
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const poolData = {
        ...formData,
        totalRewards: parseFloat(formData.totalRewards),
        maxAPY: parseFloat(formData.maxAPY),
        distributionDays: parseInt(formData.distributionDays),
        dailyDistribution: calculateDailyDistribution(),
        createdAt: new Date().toISOString(),
        status: 'active'
      }
      
      await onCreatePool(poolData)
      
      setSuccess(true)
      
      // Fechar modal após sucesso
      setTimeout(() => {
        setSuccess(false)
        setFormData({
          tokenSymbol: 'KALE',
          totalRewards: '',
          maxAPY: '',
          distributionDays: '',
          poolName: '',
          description: ''
        })
        onClose()
      }, 2000)
      
    } catch (error) {
      console.error('Erro ao criar pool:', error)
      setError('Erro ao criar pool. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900/95 backdrop-blur-lg rounded-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-2 rounded-xl">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Criar Pool de Recompensas</h2>
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
              <h3 className="text-xl font-bold text-white mb-2">Pool Criada com Sucesso!</h3>
              <p className="text-gray-400">
                Sua pool "{formData.poolName}" foi criada e está ativa
              </p>
            </div>
          ) : (
            <>
              {/* Info sobre pools */}
              <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-purple-200 font-medium mb-1">Como Funcionam as Pools</h4>
                    <p className="text-purple-200 text-sm mb-2">
                      Você define a quantidade total de tokens para recompensas e o período de distribuição. 
                      Os tokens são distribuídos diariamente de forma proporcional aos usuários que delegaram.
                    </p>
                    <p className="text-purple-300 text-xs">
                      ✓ Distribuição automática • ✓ Proporcional ao valor delegado • ✓ Contratos verificados na Stellar
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Pool Name */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Nome da Pool *
                  </label>
                  <input
                    type="text"
                    value={formData.poolName}
                    onChange={(e) => handleInputChange('poolName', e.target.value)}
                    placeholder="Ex: Pool KALE Rewards Q1 2024"
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Token Selection */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Token de Recompensa
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['KALE', 'XLM'].map((token) => (
                      <button
                        key={token}
                        onClick={() => handleInputChange('tokenSymbol', token)}
                        className={`p-4 rounded-xl border transition-all duration-200 ${
                          formData.tokenSymbol === token
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            token === 'KALE' 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                              : 'bg-gradient-to-r from-blue-500 to-cyan-600'
                          }`}>
                            <span className="text-white font-bold text-sm">{token}</span>
                          </div>
                          <div className="text-left">
                            <p className="text-white font-medium text-sm">
                              {token === 'KALE' ? 'Kale Token' : 'Stellar Lumens'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pool Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Rewards */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Total de Recompensas *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.totalRewards}
                        onChange={(e) => handleInputChange('totalRewards', e.target.value)}
                        placeholder="10000"
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                        {formData.tokenSymbol}
                      </span>
                    </div>
                  </div>

                  {/* Max APY */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      APY Máximo *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        max="100"
                        value={formData.maxAPY}
                        onChange={(e) => handleInputChange('maxAPY', e.target.value)}
                        placeholder="15.0"
                        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Distribution Days */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Período (dias) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.distributionDays}
                      onChange={(e) => handleInputChange('distributionDays', e.target.value)}
                      placeholder="30"
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Descrição (Opcional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descreva os objetivos e benefícios desta pool..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Calculation Preview */}
                {formData.totalRewards && formData.distributionDays && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                      <Target className="h-5 w-5 text-green-400" />
                      <span>Previsão de Distribuição</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Distribuição Diária:</p>
                        <p className="text-white font-semibold">
                          {formatNumber(calculateDailyDistribution())} {formData.tokenSymbol}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Duração Total:</p>
                        <p className="text-white font-semibold">
                          {formData.distributionDays} dias
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">APY Oferecido:</p>
                        <p className="text-green-400 font-semibold">
                          até {formData.maxAPY}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <span className="text-red-300 text-sm">{error}</span>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
                    isLoading
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 transform hover:scale-105'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Criando Pool...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      <span>Criar Pool de Recompensas</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                {/* Disclaimer */}
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-200 text-sm">
                        <strong>Importante:</strong> Certifique-se de ter os tokens necessários em sua carteira 
                        antes de criar a pool. Os tokens serão bloqueados durante o período de distribuição.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreatePoolModal