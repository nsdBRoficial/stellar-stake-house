import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Clock
} from 'lucide-react'

const PoolAnalytics = ({ poolId, poolData }) => {
  const [analytics, setAnalytics] = useState({
    totalValueLocked: 0,
    totalDelegators: 0,
    averageAPY: 0,
    totalRewardsDistributed: 0,
    dailyVolume: 0,
    growthRate: 0,
    topDelegators: [],
    rewardsHistory: [],
    delegationTrends: []
  })
  const [timeframe, setTimeframe] = useState('7d') // 24h, 7d, 30d, 90d
  const [loading, setLoading] = useState(true)

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

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${formatNumber(value, 1)}%`
  }

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        
        // Simular dados de analytics (substituir por chamadas reais à API)
        const mockAnalytics = {
          totalValueLocked: 2500000,
          totalDelegators: 156,
          averageAPY: 12.5,
          totalRewardsDistributed: 125000,
          dailyVolume: 45000,
          growthRate: 15.3,
          topDelegators: [
            { address: 'GXXX...XXXX', amount: 150000, percentage: 6.0 },
            { address: 'GYYY...YYYY', amount: 125000, percentage: 5.0 },
            { address: 'GZZZ...ZZZZ', amount: 100000, percentage: 4.0 },
            { address: 'GAAA...AAAA', amount: 85000, percentage: 3.4 },
            { address: 'GBBB...BBBB', amount: 75000, percentage: 3.0 }
          ],
          rewardsHistory: [
            { date: '2024-01-15', amount: 5000 },
            { date: '2024-01-16', amount: 5200 },
            { date: '2024-01-17', amount: 4800 },
            { date: '2024-01-18', amount: 5500 },
            { date: '2024-01-19', amount: 5300 },
            { date: '2024-01-20', amount: 5700 },
            { date: '2024-01-21', amount: 6000 }
          ],
          delegationTrends: [
            { date: '2024-01-15', delegations: 145, volume: 2200000 },
            { date: '2024-01-16', delegations: 148, volume: 2250000 },
            { date: '2024-01-17', delegations: 151, volume: 2300000 },
            { date: '2024-01-18', delegations: 153, volume: 2400000 },
            { date: '2024-01-19', delegations: 155, volume: 2450000 },
            { date: '2024-01-20', delegations: 156, volume: 2500000 },
            { date: '2024-01-21', delegations: 158, volume: 2550000 }
          ]
        }
        
        setAnalytics(mockAnalytics)
      } catch (error) {
        console.error('Erro ao buscar analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    if (poolId) {
      fetchAnalytics()
    }
  }, [poolId, timeframe])

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-white/10 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-white/10 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white flex items-center space-x-2">
          <BarChart3 className="h-7 w-7 text-blue-400" />
          <span>Analytics da Pool</span>
        </h3>
        
        {/* Timeframe Selector */}
        <div className="flex space-x-1 bg-white/5 rounded-xl p-1">
          {['24h', '7d', '30d', '90d'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                timeframe === period
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Value Locked */}
        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-500 p-3 rounded-xl">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-green-400">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-sm font-semibold">{formatPercentage(analytics.growthRate)}</span>
            </div>
          </div>
          <div>
            <p className="text-blue-200 text-sm font-medium">Total Value Locked</p>
            <p className="text-white text-2xl font-bold">
              {formatNumber(analytics.totalValueLocked)} {poolData?.tokenSymbol || 'KALE'}
            </p>
            <p className="text-blue-300 text-xs mt-1">
              ≈ {formatCurrency(analytics.totalValueLocked * 0.25)}
            </p>
          </div>
        </div>

        {/* Total Delegators */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-500 p-3 rounded-xl">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-green-400">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-sm font-semibold">+12</span>
            </div>
          </div>
          <div>
            <p className="text-purple-200 text-sm font-medium">Total de Delegadores</p>
            <p className="text-white text-2xl font-bold">{analytics.totalDelegators}</p>
            <p className="text-purple-300 text-xs mt-1">Últimos 7 dias</p>
          </div>
        </div>

        {/* Average APY */}
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-500 p-3 rounded-xl">
              <Percent className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-green-400">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-sm font-semibold">+0.3%</span>
            </div>
          </div>
          <div>
            <p className="text-green-200 text-sm font-medium">APY Médio</p>
            <p className="text-white text-2xl font-bold">{formatNumber(analytics.averageAPY, 1)}%</p>
            <p className="text-green-300 text-xs mt-1">Baseado em 30 dias</p>
          </div>
        </div>

        {/* Total Rewards Distributed */}
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-500 p-3 rounded-xl">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div className="flex items-center space-x-1 text-green-400">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-sm font-semibold">+5.2%</span>
            </div>
          </div>
          <div>
            <p className="text-orange-200 text-sm font-medium">Recompensas Distribuídas</p>
            <p className="text-white text-2xl font-bold">
              {formatNumber(analytics.totalRewardsDistributed)} {poolData?.tokenSymbol || 'KALE'}
            </p>
            <p className="text-orange-300 text-xs mt-1">Total acumulado</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rewards History Chart */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h4 className="text-white font-semibold text-lg mb-4 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <span>Histórico de Recompensas</span>
          </h4>
          
          <div className="space-y-3">
            {analytics.rewardsHistory.slice(-5).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-500 p-2 rounded-lg">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {new Date(item.date).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-gray-400 text-sm">Distribuição diária</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-semibold">
                    +{formatNumber(item.amount)} {poolData?.tokenSymbol || 'KALE'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    ≈ {formatCurrency(item.amount * 0.25)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Delegators */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h4 className="text-white font-semibold text-lg mb-4 flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-400" />
            <span>Top Delegadores</span>
          </h4>
          
          <div className="space-y-3">
            {analytics.topDelegators.map((delegator, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-500 p-2 rounded-lg">
                    <span className="text-white font-bold text-sm">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium font-mono text-sm">
                      {delegator.address}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {formatNumber(delegator.percentage, 1)}% do total
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-purple-400 font-semibold">
                    {formatNumber(delegator.amount)} {poolData?.tokenSymbol || 'KALE'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    ≈ {formatCurrency(delegator.amount * 0.25)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delegation Trends */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h4 className="text-white font-semibold text-lg mb-4 flex items-center space-x-2">
          <Activity className="h-5 w-5 text-blue-400" />
          <span>Tendências de Delegação</span>
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/30">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <span className="text-blue-200 font-medium">Volume Diário</span>
            </div>
            <p className="text-white text-xl font-bold">
              {formatNumber(analytics.dailyVolume)} {poolData?.tokenSymbol || 'KALE'}
            </p>
            <p className="text-blue-300 text-sm">Últimas 24h</p>
          </div>
          
          <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <span className="text-green-200 font-medium">Crescimento</span>
            </div>
            <p className="text-white text-xl font-bold">
              {formatPercentage(analytics.growthRate)}
            </p>
            <p className="text-green-300 text-sm">Últimos 7 dias</p>
          </div>
          
          <div className="bg-purple-500/20 rounded-xl p-4 border border-purple-500/30">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-5 w-5 text-purple-400" />
              <span className="text-purple-200 font-medium">Novos Delegadores</span>
            </div>
            <p className="text-white text-xl font-bold">+12</p>
            <p className="text-purple-300 text-sm">Esta semana</p>
          </div>
        </div>
        
        {/* Simple trend visualization */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Progresso semanal</span>
            <span>{formatNumber(analytics.totalValueLocked)} {poolData?.tokenSymbol || 'KALE'}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000"
              style={{ width: '75%' }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>Meta: 3M {poolData?.tokenSymbol || 'KALE'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PoolAnalytics