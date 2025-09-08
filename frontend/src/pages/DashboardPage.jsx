import { useState, useEffect } from 'react'
import { useMultiAuth } from '../hooks/useMultiAuth.js'
import { useLanguage } from '../contexts/LanguageContext'
import { 
  TrendingUp, 
  Wallet, 
  Gift, 
  History, 
  Star, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  Percent,
  Clock,
  Shield,
  Zap,
  RefreshCw,
  ExternalLink,
  Database,
  CheckCircle,
  AlertCircle,
  Building2,
  Plus,
  Settings,
  Users,
  Calendar,
  Target
} from 'lucide-react'
import axios from 'axios'
import StakingModal from '../components/StakingModal'
import RewardsModal from '../components/RewardsModal'
import CreatePoolModal from '../components/CreatePoolModal'
import PoolAnalytics from '../components/PoolAnalytics'

const DashboardPage = () => {
  const { user } = useMultiAuth()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showStakingModal, setShowStakingModal] = useState(false)
  const [showRewardsModal, setShowRewardsModal] = useState(false)
  const [activeTab, setActiveTab] = useState('portfolio') // portfolio, projects
  const [isProjectOwner, setIsProjectOwner] = useState(false)
  const [showCreatePoolModal, setShowCreatePoolModal] = useState(false)
  const [selectedPoolForAnalytics, setSelectedPoolForAnalytics] = useState(null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [dashboardData, setDashboardData] = useState({
    tokens: {
      KALE: {
        walletBalance: 0,
        delegatedAmount: 0,
        pendingRewards: 0,
        totalRewardsEarned: 0,
        price: 0,
        apy: 0,
        estimatedDailyReward: 0,
        contractAddress: 'KALE_CONTRACT_ADDRESS',
        symbol: 'KALE',
        name: 'Kale Token',
        decimals: 7
      },
      XLM: {
        walletBalance: 0,
        delegatedAmount: 0,
        pendingRewards: 0,
        totalRewardsEarned: 0,
        price: 0,
        apy: 0,
        estimatedDailyReward: 0,
        contractAddress: 'XLM_NATIVE',
        symbol: 'XLM',
        name: 'Stellar Lumens',
        decimals: 7
      }
    },
    recentTransactions: []
  })

  const calculateDailyReward = (stakedAmount, apy) => {
    if (!stakedAmount || !apy) return 0
    return (stakedAmount * (apy / 100)) / 365
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Obter saldo de KALE
      const balanceResponse = await axios.get(`/api/staking/balance/${user.publicKey}`)
       
       // Obter informações de staking
       const stakingResponse = await axios.get(`/api/staking/status/${user.publicKey}`)
       
       // Obter recompensas pendentes
       const rewardsResponse = await axios.get(`/api/rewards/pending/${user.publicKey}`)
       
       // Obter transações recentes
       const historyResponse = await axios.get(`/api/history/${user.publicKey}?limit=5`)
      
      setDashboardData({
        kaleBalance: parseFloat(balanceResponse.data.balance || 0),
        stakedAmount: parseFloat(stakingResponse.data.total_delegated || 0),
        pendingRewards: parseFloat(rewardsResponse.data.pending_rewards || 0),
        totalRewardsEarned: parseFloat(rewardsResponse.data.total_earned || 0),
        kalePrice: parseFloat(rewardsResponse.data.token_price_brl || 0),
        rewardRate: parseFloat(stakingResponse.data.current_apy || 0),
        estimatedDailyReward: calculateDailyReward(
          parseFloat(stakingResponse.data.total_delegated || 0),
          parseFloat(stakingResponse.data.current_apy || 0)
        ),
        recentTransactions: historyResponse.data.transactions || []
      })
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
      // Em caso de erro, usar dados mock se disponível
       if (user?.strategy === 'test') {
         setDashboardData({
           tokens: {
             KALE: {
               walletBalance: 15000.50,
               delegatedAmount: 10000.00,
               pendingRewards: 125.75,
               totalRewardsEarned: 2450.30,
               price: 0.85,
               apy: 12.5,
               estimatedDailyReward: 3.42,
               contractAddress: 'KALE_CONTRACT_ADDRESS',
               symbol: 'KALE',
               name: 'Kale Token',
               decimals: 7
             },
             XLM: {
               walletBalance: 8500.25,
               delegatedAmount: 5000.00,
               pendingRewards: 45.30,
               totalRewardsEarned: 890.15,
               price: 2.45,
               apy: 8.2,
               estimatedDailyReward: 1.12,
               contractAddress: 'XLM_NATIVE',
               symbol: 'XLM',
               name: 'Stellar Lumens',
               decimals: 7
             }
           },
           recentTransactions: [
             {
               id: '1',
               type: 'stake',
               token: 'KALE',
               amount: 5000,
               date: new Date().toISOString(),
               status: 'completed'
             },
             {
               id: '2',
               type: 'reward',
               token: 'KALE',
               amount: 125.75,
               date: new Date(Date.now() - 86400000).toISOString(),
               status: 'completed'
             },
             {
               id: '3',
               type: 'stake',
               token: 'XLM',
               amount: 2500,
               date: new Date(Date.now() - 172800000).toISOString(),
               status: 'completed'
             }
           ]
         })
       }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user?.publicKey) {
      fetchDashboardData()
    }
  }, [user])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
  }

  const handleStaking = async (tokenSymbol, amount) => {
    try {
      // Simular transação de staking
      const newTransaction = {
        id: Date.now().toString(),
        type: 'stake',
        token: tokenSymbol,
        amount: amount,
        date: new Date().toISOString(),
        status: 'completed'
      }

      // Atualizar dados do dashboard
      setDashboardData(prev => ({
        ...prev,
        tokens: {
          ...prev.tokens,
          [tokenSymbol]: {
            ...prev.tokens[tokenSymbol],
            walletBalance: prev.tokens[tokenSymbol].walletBalance - amount,
            delegatedAmount: prev.tokens[tokenSymbol].delegatedAmount + amount,
            estimatedDailyReward: calculateDailyReward(
              prev.tokens[tokenSymbol].delegatedAmount + amount, 
              prev.tokens[tokenSymbol].apy
            )
          }
        },
        recentTransactions: [newTransaction, ...prev.recentTransactions.slice(0, 4)]
      }))

      console.log(`[STAKING] Delegação de ${amount} ${tokenSymbol} realizada com sucesso`)
    } catch (error) {
      console.error('Erro no staking:', error)
      throw error
    }
  }

  const handleRewardsClaim = async (tokenSymbol, amount) => {
    try {
      // Simular transação de resgate
      const newTransaction = {
        id: Date.now().toString(),
        type: 'reward',
        token: tokenSymbol,
        amount: amount,
        date: new Date().toISOString(),
        status: 'completed'
      }

      // Atualizar dados do dashboard
      setDashboardData(prev => ({
        ...prev,
        tokens: {
          ...prev.tokens,
          [tokenSymbol]: {
            ...prev.tokens[tokenSymbol],
            walletBalance: prev.tokens[tokenSymbol].walletBalance + amount,
            pendingRewards: 0,
            totalRewardsEarned: prev.tokens[tokenSymbol].totalRewardsEarned + amount
          }
        },
        recentTransactions: [newTransaction, ...prev.recentTransactions.slice(0, 4)]
      }))

      console.log(`[REWARDS] Resgate de ${amount} ${tokenSymbol} realizado com sucesso`)
    } catch (error) {
      console.error('Erro no resgate:', error)
      throw error
    }
  }

  const handleCreatePool = async (poolData) => {
    try {
      // Simular criação da pool
      console.log('[POOL] Criando nova pool:', poolData)
      
      // Aqui seria feita a chamada para a API para criar a pool
      // e interagir com os contratos inteligentes Stellar
      
      // Simular delay de criação
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log(`[POOL] Pool "${poolData.poolName}" criada com sucesso`)
      
      // Atualizar estado para mostrar que o usuário agora tem pools
      // Em uma implementação real, isso viria da API
      
    } catch (error) {
      console.error('Erro ao criar pool:', error)
      throw error
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatNumber = (value, decimals = 2) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)
  }

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">{t('dashboard.loadingDashboard')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {t('dashboard.delegationPanel')}
            </h1>
            <p className="text-gray-400">
              {t('dashboard.multiTokenMarketplace')} • {formatAddress(user?.publicKey)}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {t('dashboard.delegateSecurely')}
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-xl transition-all duration-200 border border-white/20"
          >
            <RefreshCw className={`h-4 w-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-white text-sm font-medium">
              {refreshing ? t('dashboard.updating') : t('dashboard.update')}
            </span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white/5 backdrop-blur-sm rounded-2xl p-2 border border-white/10">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'portfolio'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Wallet className="h-5 w-5" />
              <span className="font-medium">{t('dashboard.myPortfolio')}</span>
            </button>
            
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                activeTab === 'projects'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Building2 className="h-5 w-5" />
              <span className="font-medium">{t('dashboard.myProjects')}</span>
              {isProjectOwner && (
                <span className="bg-green-400 text-green-900 text-xs px-2 py-1 rounded-full font-semibold">
                  {t('dashboard.owner')}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'portfolio' && (
          <>
            {/* Multi-Token Portfolio */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
            <Wallet className="h-7 w-7 text-blue-400" />
            <span>{t('dashboard.multiTokenPortfolio')}</span>
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(dashboardData.tokens).map(([tokenSymbol, tokenData]) => (
              <div key={tokenSymbol} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                {/* Token Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-xl ${
                      tokenSymbol === 'KALE' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-600'
                    }`}>
                      <span className="text-white font-bold text-lg">{tokenSymbol}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">{tokenData.name}</h3>
                      <p className="text-gray-400 text-sm">{formatCurrency(tokenData.price)} {t('dashboard.per')} {tokenSymbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-semibold">APY {formatNumber(tokenData.apy, 1)}%</p>
                    <p className="text-gray-400 text-sm">~{formatNumber(tokenData.estimatedDailyReward)} {tokenSymbol}/{t('dashboard.day')}</p>
                  </div>
                </div>

                {/* Saldos */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Saldo na Carteira */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Wallet className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-400 text-sm font-medium">{t('dashboard.inWallet')}</span>
                    </div>
                    <p className="text-white text-xl font-bold">{formatNumber(tokenData.walletBalance)}</p>
                    <p className="text-gray-400 text-xs">≈ {formatCurrency(tokenData.walletBalance * tokenData.price)}</p>
                  </div>

                  {/* Saldo Delegado */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="h-4 w-4 text-green-400" />
                      <span className="text-gray-400 text-sm font-medium">{t('dashboard.delegated')}</span>
                    </div>
                    <p className="text-white text-xl font-bold">{formatNumber(tokenData.delegatedAmount)}</p>
                    <p className="text-gray-400 text-xs">≈ {formatCurrency(tokenData.delegatedAmount * tokenData.price)}</p>
                  </div>
                </div>

                {/* Recompensas */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Recompensas Pendentes */}
                  <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-orange-500/30">
                    <div className="flex items-center space-x-2 mb-2">
                      <Gift className="h-4 w-4 text-orange-400" />
                      <span className="text-orange-200 text-sm font-medium">{t('dashboard.pending')}</span>
                    </div>
                    <p className="text-white text-lg font-bold">{formatNumber(tokenData.pendingRewards)}</p>
                    <p className="text-orange-200 text-xs">≈ {formatCurrency(tokenData.pendingRewards * tokenData.price)}</p>
                  </div>

                  {/* Total Ganho */}
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span className="text-green-200 text-sm font-medium">{t('dashboard.totalEarned')}</span>
                    </div>
                    <p className="text-white text-lg font-bold">{formatNumber(tokenData.totalRewardsEarned)}</p>
                    <p className="text-green-200 text-xs">≈ {formatCurrency(tokenData.totalRewardsEarned * tokenData.price)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delegação vs Transferência - Seção Educativa */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{t('dashboard.secureTokenDelegation')}</h2>
                  <p className="text-green-200 text-sm">{t('dashboard.tokensStayInWallet')}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                <h3 className="text-green-200 font-semibold mb-2 flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>{t('dashboard.delegationWhatWeDo')}</span>
                </h3>
                <ul className="text-green-100 text-sm space-y-1">
                  <li>• {t('dashboard.tokensAlwaysRemainInWallet')}</li>
                <li>• {t('dashboard.signDelegationContract')}</li>
                <li>• {t('dashboard.cancelAnytime')}</li>
                <li>• {t('dashboard.receiveProportionalRewards')}</li>
                <li>• {t('dashboard.maintainControlDuringDelegation')}</li>
                </ul>
              </div>
              <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                <h3 className="text-red-200 font-semibold mb-2 flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>{t('dashboard.transferWhatWeDont')}</span>
                </h3>
                <ul className="text-red-100 text-sm space-y-1">
                  <li>• {t('dashboard.tokensLeaveWallet')}</li>
                  <li>• {t('dashboard.loseTemporaryControl')}</li>
                  <li>• {t('dashboard.riskOfAssetLoss')}</li>
                  <li>• {t('dashboard.dependenceOnThirdParties')}</li>
                  <li>• {t('dashboard.complexWithdrawalProcess')}</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
              <p className="text-blue-200 text-sm leading-relaxed mb-3">
                <strong>{t('dashboard.howMarketplaceWorks')}</strong> {t('dashboard.marketplaceDescription')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                  <h4 className="text-green-200 font-semibold text-sm mb-1">{t('dashboard.forUsers')}</h4>
                  <p className="text-green-300 text-xs">{t('dashboard.delegateKaleXlm')}</p>
                </div>
                <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                  <h4 className="text-purple-200 font-semibold text-sm mb-1">{t('dashboard.forProjects')}</h4>
                  <p className="text-purple-300 text-xs">{t('dashboard.registerTokens')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reflector Oracle Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{t('dashboard.reflectorIntegration')}</h2>
                  <p className="text-blue-200 text-sm">{t('dashboard.decentralizedOracle')}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <a
                  href="https://reflector.network/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600/50 hover:bg-blue-600/70 rounded-lg transition-colors"
                >
                  <span className="text-blue-100 text-sm">{t('dashboard.website')}</span>
                  <ExternalLink className="h-4 w-4 text-blue-100" />
                </a>
                <a
                  href="https://reflector.network/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-3 py-2 bg-purple-600/50 hover:bg-purple-600/70 rounded-lg transition-colors"
                >
                  <span className="text-purple-100 text-sm">{t('dashboard.documentation')}</span>
                  <ExternalLink className="h-4 w-4 text-purple-100" />
                </a>
                <a
                  href="https://discord.gg/reflector"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-3 py-2 bg-indigo-600/50 hover:bg-indigo-600/70 rounded-lg transition-colors"
                >
                  <span className="text-indigo-100 text-sm">{t('dashboard.discord')}</span>
                  <ExternalLink className="h-4 w-4 text-indigo-100" />
                </a>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-blue-200 text-sm leading-relaxed">
                <strong>Reflector Oracle</strong> {t('dashboard.reflectorDescription')}
              </p>
              <p className="text-blue-200 text-sm leading-relaxed">
                <strong>{t('dashboard.importanceForPlatform')}</strong> {t('dashboard.platformImportance')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                  <h4 className="text-blue-200 font-semibold text-sm mb-1">{t('dashboard.pushBased')}</h4>
                  <p className="text-blue-300 text-xs">{t('dashboard.pushBasedDesc')}</p>
                </div>
                <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                  <h4 className="text-purple-200 font-semibold text-sm mb-1">{t('dashboard.daoGovernance')}</h4>
                  <p className="text-purple-300 text-xs">{t('dashboard.daoGovernanceDesc')}</p>
                </div>
                <div className="bg-indigo-500/10 rounded-lg p-3 border border-indigo-500/20">
                  <h4 className="text-indigo-200 font-semibold text-sm mb-1">{t('dashboard.stellarNative')}</h4>
                  <p className="text-indigo-300 text-xs">{t('dashboard.stellarNativeDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações de Staking */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <Star className="h-6 w-6 text-yellow-400" />
                <span>Informações de Staking</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-gray-400">Taxa de Performance Atual</span>
                    <span className="text-white font-semibold">{formatNumber(dashboardData.rewardRate, 1)}%</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-gray-400">Preço Atual do KALE</span>
                    <span className="text-white font-semibold">{formatCurrency(dashboardData.kalePrice)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-gray-400">Máximo de Carteira</span>
                    <span className="text-white font-semibold">{formatNumber(dashboardData.kaleBalance + dashboardData.stakedAmount)}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-gray-400">Recompensa Estimada Diária</span>
                    <span className="text-green-400 font-semibold">{formatNumber(dashboardData.estimatedDailyReward)} KALE</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-gray-400">Total de Recompensas</span>
                    <span className="text-green-400 font-semibold">{formatNumber(dashboardData.totalRewardsEarned)} KALE</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-gray-400">Endereço da Carteira</span>
                    <span className="text-white font-semibold">{formatAddress(user?.publicKey)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transações Recentes */}
          <div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <History className="h-6 w-6 text-blue-400" />
                <span>Transações Recentes</span>
              </h2>
              
              <div className="space-y-4">
                {dashboardData.recentTransactions.length > 0 ? (
                  dashboardData.recentTransactions.map((transaction, index) => (
                    <div key={transaction.id || index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          transaction.type === 'stake' 
                            ? 'bg-green-500/20 text-green-400' 
                            : transaction.type === 'reward'
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {transaction.type === 'stake' ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : transaction.type === 'reward' ? (
                            <Gift className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {transaction.type === 'stake' ? 'Staking' : 
                             transaction.type === 'reward' ? 'Recompensa' : 'Transação'}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${
                          transaction.type === 'stake' ? 'text-green-400' : 'text-orange-400'
                        }`}>
                          {transaction.type === 'stake' ? '+' : ''}{formatNumber(transaction.amount)}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {transaction.status === 'completed' ? 'Concluída' : 'Pendente'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Nenhuma transação recente</p>
                  </div>
                )}
              </div>
              
              {dashboardData.recentTransactions.length > 0 && (
                <div className="mt-6">
                  <button className="w-full py-2 text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium">
                    Ver Todas as Transações
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => setShowStakingModal(true)}
            className="group relative p-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-center space-x-3">
              <Zap className="h-6 w-6 text-white" />
              <span className="text-white font-semibold text-lg">{t('dashboard.makeStaking')}</span>
            </div>
            <p className="text-blue-100 text-sm mt-2">{t('dashboard.delegateKaleTokens')}</p>
          </button>
          
          <button 
            onClick={() => setShowRewardsModal(true)}
            className="group relative p-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-center space-x-3">
              <Gift className="h-6 w-6 text-white" />
              <span className="text-white font-semibold text-lg">{t('dashboard.claimRewards')}</span>
            </div>
            <p className="text-green-100 text-sm mt-2">{t('dashboard.collectRewards')}</p>
            {Object.values(dashboardData.tokens).some(token => token.pendingRewards > 0) && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                !
              </div>
            )}
          </button>
          
          <button 
            onClick={() => window.location.href = '/history'}
            className="group relative p-6 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-center space-x-3">
              <History className="h-6 w-6 text-white" />
              <span className="text-white font-semibold text-lg">{t('dashboard.viewHistory')}</span>
            </div>
            <p className="text-orange-100 text-sm mt-2">{t('dashboard.trackTransactions')}</p>
          </button>
        </div>
          </>
        )}

        {/* Projects Tab Content */}
        {activeTab === 'projects' && (
          <>
            {/* Projects Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
                    <Building2 className="h-7 w-7 text-purple-400" />
                    <span>{t('dashboard.manageProjects')}</span>
                  </h2>
                  <p className="text-gray-400">
                    {t('dashboard.createManagePools')}
                  </p>
                </div>
                
                <button
                  onClick={() => setShowCreatePoolModal(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Plus className="h-5 w-5 text-white" />
                  <span className="text-white font-semibold">{t('dashboard.createPool')}</span>
                </button>
              </div>
            </div>

            {/* Project Owner Status */}
            {!isProjectOwner ? (
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 mb-8">
                <div className="text-center">
                  <Building2 className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-4">{t('dashboard.becomeProjectOwner')}</h3>
                  <p className="text-purple-200 mb-6 max-w-2xl mx-auto">
                    {t('dashboard.registerProject')}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/5 rounded-xl p-4">
                      <Target className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                      <h4 className="text-white font-semibold mb-1">{t('dashboard.defineRewards')}</h4>
                      <p className="text-purple-200 text-sm">{t('dashboard.defineRewardsDesc')}</p>
                    </div>
                    
                    <div className="bg-white/5 rounded-xl p-4">
                      <Calendar className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                      <h4 className="text-white font-semibold mb-1">{t('dashboard.controlDeadlines')}</h4>
                      <p className="text-purple-200 text-sm">{t('dashboard.controlDeadlinesDesc')}</p>
                    </div>
                    
                    <div className="bg-white/5 rounded-xl p-4">
                      <Users className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                      <h4 className="text-white font-semibold mb-1">{t('dashboard.attractDelegators')}</h4>
                      <p className="text-purple-200 text-sm">{t('dashboard.attractDelegatorsDesc')}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setIsProjectOwner(true)}
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold rounded-2xl transition-all duration-200 transform hover:scale-105"
                  >
                    Registrar como Projeto
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Active Pools */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <Target className="h-6 w-6 text-green-400" />
                    <span>Pools Ativas</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pool Example */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl">
                            <span className="text-white font-bold">KALE</span>
                          </div>
                          <div>
                            <h4 className="text-white font-semibold">Pool KALE #1</h4>
                            <p className="text-gray-400 text-sm">Criada há 5 dias</p>
                          </div>
                        </div>
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                          Ativa
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-gray-400 text-sm">Total de Recompensas</p>
                          <p className="text-white font-bold text-lg">10,000 KALE</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">APY Máximo</p>
                          <p className="text-green-400 font-bold text-lg">15.0%</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Distribuído</p>
                          <p className="text-white font-bold text-lg">3,500 KALE</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Dias Restantes</p>
                          <p className="text-orange-400 font-bold text-lg">5 dias</p>
                        </div>
                      </div>
                      
                      <div className="bg-white/5 rounded-xl p-3 mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-400 text-sm">{t('dashboard.progress')}</span>
                          <span className="text-white text-sm font-semibold">35%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full" style={{width: '35%'}}></div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                          <Settings className="h-4 w-4 inline mr-2" />
                          {t('dashboard.manage')}
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedPoolForAnalytics({
                              id: 1,
                              poolName: 'Pool KALE #1',
                              tokenSymbol: 'KALE',
                              totalRewards: 10000,
                              maxAPY: 15.0,
                              distributionDays: 30
                            })
                            setShowAnalytics(true)
                          }}
                          className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                          {t('dashboard.viewAnalytics')}
                        </button>
                      </div>
                    </div>
                    
                    {/* Empty State */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 border-dashed">
                      <div className="text-center py-8">
                        <Plus className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                        <h4 className="text-white font-semibold mb-2">{t('dashboard.createPool')}</h4>
                        <p className="text-gray-400 text-sm mb-4">
                          {t('dashboard.configureNewPool')}
                        </p>
                        <button
                          onClick={() => setShowCreatePoolModal(true)}
                          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        >
                          {t('dashboard.createPool')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Analytics Section */}
                {showAnalytics && selectedPoolForAnalytics && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                        <span>Analytics - {selectedPoolForAnalytics.poolName}</span>
                      </h3>
                      <button
                        onClick={() => {
                          setShowAnalytics(false)
                          setSelectedPoolForAnalytics(null)
                        }}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        {t('dashboard.closeAnalytics')}
                      </button>
                    </div>
                    
                    <PoolAnalytics 
                      poolId={selectedPoolForAnalytics.id}
                      poolData={selectedPoolForAnalytics}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Disclaimers Legais e de Segurança */}
        <div className="mt-12 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold text-lg mb-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <span>{t('dashboard.importantInformation')}</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-gray-300 font-medium text-sm">{t('dashboard.securityAndControl')}</h4>
              <ul className="text-gray-400 text-xs space-y-1">
                <li>• {t('dashboard.tokensAlwaysRemainInWallet')}</li>
                <li>• {t('dashboard.maintainControlDuringDelegation')}</li>
                <li>• {t('dashboard.cancelAnytime')}</li>
                <li>• {t('dashboard.verifiedContracts')}</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-gray-300 font-medium text-sm">{t('dashboard.risksAndResponsibilities')}</h4>
              <ul className="text-gray-400 text-xs space-y-1">
                <li>• {t('dashboard.defiRisks')}</li>
                <li>• {t('dashboard.rewardsVary')}</li>
                <li>• {t('dashboard.keepWalletSecure')}</li>
                <li>• {t('dashboard.demoVersion')}</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-gray-500 text-xs text-center">
              <strong>{t('dashboard.legalDisclaimer')}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <StakingModal
        isOpen={showStakingModal}
        onClose={() => setShowStakingModal(false)}
        tokens={dashboardData.tokens}
        onStake={handleStaking}
      />

      <RewardsModal
        isOpen={showRewardsModal}
        onClose={() => setShowRewardsModal(false)}
        tokens={dashboardData.tokens}
        onClaim={handleRewardsClaim}
      />

      <CreatePoolModal
        isOpen={showCreatePoolModal}
        onClose={() => setShowCreatePoolModal(false)}
        onCreatePool={handleCreatePool}
      />
    </div>
  )
}

export default DashboardPage