import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import axios from 'axios'

const RewardsPage = () => {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [rewardsData, setRewardsData] = useState({
    pendingRewards: 0,
    totalEarned: 0,
    lastClaimDate: null,
    rewardHistory: [],
    kalePrice: 0
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchRewardsData = async () => {
      try {
        setLoading(true)
        
        // Obter recompensas pendentes e histórico
        const rewardsResponse = await axios.get(`/api/rewards/pending/${currentUser.stellar_address}`)
        
        // Obter histórico de recompensas (filtrado por tipo reward_claim)
        const historyResponse = await axios.get(`/api/history/${currentUser.stellar_address}?type=reward_claim`)
        
        setRewardsData({
          pendingRewards: parseFloat(rewardsResponse.data.pending_rewards || 0),
          totalEarned: parseFloat(rewardsResponse.data.total_earned || 0),
          lastClaimDate: rewardsResponse.data.last_claim_date || null,
          rewardHistory: historyResponse.data.transactions || [],
          kalePrice: parseFloat(rewardsResponse.data.token_price_brl || 0)
        })
      } catch (error) {
        console.error('Erro ao carregar dados de recompensas:', error)
        setError('Falha ao carregar dados de recompensas. Tente novamente mais tarde.')
      } finally {
        setLoading(false)
      }
    }

    if (currentUser) {
      fetchRewardsData()
    }
  }, [currentUser])

  const handleClaimRewards = async () => {
    if (rewardsData.pendingRewards <= 0) {
      setError('Você não tem recompensas pendentes para resgatar.')
      return
    }
    
    try {
      setClaiming(true)
      setError('')
      setSuccess('')
      
      // Enviar solicitação de resgate para o backend
      const response = await axios.post('/api/rewards/claim', {
        stellar_address: currentUser.stellar_address
      })
      
      if (response.data.success) {
        setSuccess('Recompensas resgatadas com sucesso! Os tokens foram enviados para sua carteira.')
        
        // Atualizar dados após resgate bem-sucedido
        const rewardsResponse = await axios.get(`/api/rewards/pending/${currentUser.stellar_address}`)
        const historyResponse = await axios.get(`/api/history/${currentUser.stellar_address}?type=reward_claim`)
        
        setRewardsData(prev => ({
          ...prev,
          pendingRewards: parseFloat(rewardsResponse.data.pending_rewards || 0),
          totalEarned: parseFloat(rewardsResponse.data.total_earned || 0),
          lastClaimDate: rewardsResponse.data.last_claim_date || null,
          rewardHistory: historyResponse.data.transactions || []
        }))
      } else {
        setError(response.data.message || 'Falha ao processar resgate. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro ao processar resgate:', error)
      setError('Erro ao processar resgate. Verifique sua conexão e tente novamente.')
    } finally {
      setClaiming(false)
    }
  }

  const formatCurrency = (value, decimals = 2) => {
    return parseFloat(value).toFixed(decimals)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stellar"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Recompensas de Staking</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Resumo de Recompensas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Suas Recompensas</h2>
          
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
          
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recompensas Pendentes</h3>
              <div className="flex items-baseline mb-2">
                <p className="text-3xl font-bold text-stellar">
                  {formatCurrency(rewardsData.pendingRewards, 4)}
                </p>
                <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  KALE
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                ≈ ${formatCurrency(rewardsData.pendingRewards * rewardsData.kalePrice, 2)}
              </p>
              
              <button
                onClick={handleClaimRewards}
                className="w-full px-4 py-3 bg-stellar hover:bg-stellar-dark text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stellar transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={claiming || rewardsData.pendingRewards <= 0}
              >
                {claiming ? 'Processando...' : 'Resgatar Recompensas'}
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Total de Recompensas Ganhas</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(rewardsData.totalEarned, 4)} KALE
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Valor Total em USD</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${formatCurrency(rewardsData.totalEarned * rewardsData.kalePrice, 2)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Último Resgate</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDate(rewardsData.lastClaimDate)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Preço Atual do KALE</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${formatCurrency(rewardsData.kalePrice, 4)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Histórico de Recompensas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Histórico de Recompensas</h2>
          
          {rewardsData.rewardHistory.length > 0 ? (
            <div className="space-y-4">
              {rewardsData.rewardHistory.map((reward, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Resgate de Recompensa
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(reward.timestamp)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(reward.amount, 4)} KALE
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ≈ ${formatCurrency(reward.amount * (reward.price || rewardsData.kalePrice), 2)}
                      </p>
                    </div>
                  </div>
                  
                  {reward.transaction_id && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ID da Transação: 
                        <a 
                          href={`https://stellar.expert/explorer/public/tx/${reward.transaction_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 text-stellar hover:underline"
                        >
                          {reward.transaction_id.slice(0, 8)}...{reward.transaction_id.slice(-8)}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Nenhum histórico de resgate de recompensas</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Resgate suas recompensas pendentes para ver o histórico aqui
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Informações sobre Recompensas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Como Funcionam as Recompensas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-stellar text-3xl mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Snapshots Diários</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Nosso sistema tira snapshots diários do seu saldo delegado para calcular suas recompensas com precisão.
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-stellar text-3xl mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Cálculo de Recompensas</h3>
            <p className="text-gray-600 dark:text-gray-400">
              As recompensas são calculadas com base na sua participação no pool de staking e na taxa anual de recompensa.
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-stellar text-3xl mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Resgate Flexível</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Você pode resgatar suas recompensas a qualquer momento, sem períodos de bloqueio ou penalidades.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RewardsPage