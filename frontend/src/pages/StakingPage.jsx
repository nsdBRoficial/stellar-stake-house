import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import axios from 'axios'

const StakingPage = () => {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [stakingData, setStakingData] = useState({
    kaleBalance: 0,
    stakedAmount: 0,
    rewardRate: 0,
    kalePrice: 0
  })
  const [stakingAmount, setStakingAmount] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchStakingData = async () => {
      try {
        setLoading(true)
        
        // Obter saldo de KALE
        const balanceResponse = await axios.get(`/api/staking/balance/${currentUser.stellar_address}`)
        
        // Obter informações de staking
        const stakingResponse = await axios.get(`/api/staking/status/${currentUser.stellar_address}`)
        
        // Obter preço do KALE (simulado no backend)
        const priceResponse = await axios.get(`/api/rewards/pending/${currentUser.stellar_address}`) // Contém o preço do KALE
        
        setStakingData({
          kaleBalance: parseFloat(balanceResponse.data.balance || 0),
          stakedAmount: parseFloat(stakingResponse.data.total_delegated || 0),
          rewardRate: parseFloat(stakingResponse.data.current_apy || 0),
          kalePrice: parseFloat(priceResponse.data.token_price_brl || 0)
        })
      } catch (error) {
        console.error('Erro ao carregar dados de staking:', error)
        setError('Falha ao carregar dados de staking. Tente novamente mais tarde.')
      } finally {
        setLoading(false)
      }
    }

    if (currentUser) {
      fetchStakingData()
    }
  }, [currentUser])

  const handleStakingSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    // Validações básicas
    const amount = parseFloat(stakingAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Por favor, insira um valor válido maior que zero.')
      return
    }
    
    if (amount > stakingData.kaleBalance) {
      setError('Saldo insuficiente para fazer staking deste valor.')
      return
    }
    
    try {
      setSubmitting(true)
      
      // Enviar solicitação de staking para o backend
      const response = await axios.post('/api/staking/delegate', {
        amount: amount
      })
      
      if (response.data.success) {
        setSuccess('Staking realizado com sucesso! Seus tokens foram delegados.')
        setStakingAmount('')
        
        // Atualizar dados após staking bem-sucedido
        const balanceResponse = await axios.get(`/api/staking/balance/${currentUser.stellar_address}`)
        const stakingResponse = await axios.get(`/api/staking/status/${currentUser.stellar_address}`)
        
        setStakingData(prev => ({
          ...prev,
          kaleBalance: parseFloat(balanceResponse.data.balance || 0),
          stakedAmount: parseFloat(stakingResponse.data.total_delegated || 0)
        }))
      } else {
        setError(response.data.message || 'Falha ao processar staking. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro ao processar staking:', error)
      setError('Erro ao processar staking. Verifique sua conexão e tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMaxAmount = () => {
    setStakingAmount(stakingData.kaleBalance.toString())
  }

  const formatCurrency = (value, decimals = 2) => {
    return parseFloat(value).toFixed(decimals)
  }

  const calculateEstimatedRewards = (amount) => {
    const parsedAmount = parseFloat(amount) || 0
    const dailyReward = (parsedAmount * stakingData.rewardRate) / 365
    const monthlyReward = dailyReward * 30
    const yearlyReward = parsedAmount * stakingData.rewardRate
    
    return {
      daily: dailyReward,
      monthly: monthlyReward,
      yearly: yearlyReward
    }
  }

  const estimatedRewards = calculateEstimatedRewards(stakingAmount)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stellar"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staking de KALE</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário de Staking */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Delegar Tokens para Staking</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 rounded">
              {success}
            </div>
          )}
          
          <form onSubmit={handleStakingSubmit}>
            <div className="mb-6">
              <label htmlFor="stakingAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantidade de KALE para Staking
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="stakingAmount"
                  value={stakingAmount}
                  onChange={(e) => setStakingAmount(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-stellar focus:border-stellar dark:bg-gray-700 dark:text-white"
                  placeholder="0.0000"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs font-medium text-stellar hover:text-stellar-dark"
                  disabled={submitting}
                >
                  MAX
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Saldo disponível: {formatCurrency(stakingData.kaleBalance, 4)} KALE
              </p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recompensas Estimadas</h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Diária</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(estimatedRewards.daily, 4)} KALE
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ≈ ${formatCurrency(estimatedRewards.daily * stakingData.kalePrice, 2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Mensal</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(estimatedRewards.monthly, 4)} KALE
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ≈ ${formatCurrency(estimatedRewards.monthly * stakingData.kalePrice, 2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Anual</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(estimatedRewards.yearly, 4)} KALE
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ≈ ${formatCurrency(estimatedRewards.yearly * stakingData.kalePrice, 2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full px-4 py-3 bg-stellar hover:bg-stellar-dark text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stellar transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting || !stakingAmount}
            >
              {submitting ? 'Processando...' : 'Delegar para Staking'}
            </button>
          </form>
        </div>
        
        {/* Informações de Staking */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Informações de Staking</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Seu Staking Atual</h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Total em Staking</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(stakingData.stakedAmount, 4)} KALE
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-700 dark:text-gray-300">Valor em USD</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${formatCurrency(stakingData.stakedAmount * stakingData.kalePrice, 2)}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Taxa de Recompensa</h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">APR Atual</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {(stakingData.rewardRate * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Como Funciona</h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Delegação Flexível</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Seus tokens KALE permanecem em sua carteira durante todo o processo de staking.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Recompensas Diárias</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    As recompensas são calculadas diariamente com base no seu saldo delegado.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Sem Período de Bloqueio</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Você pode cancelar seu staking a qualquer momento sem penalidades.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StakingPage