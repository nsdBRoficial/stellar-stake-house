import React, { useState, useEffect } from 'react'
import { useMultiAuth } from '../hooks/useMultiAuth.js'
import { 
  History, 
  ArrowUpRight, 
  ArrowDownRight,
  Gift,
  Zap,
  Calendar,
  Filter,
  Download,
  Search,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

const HistoryPage = () => {
  const { user } = useMultiAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, stake, reward, unstake
  const [tokenFilter, setTokenFilter] = useState('all') // all, KALE, XLM
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date') // date, amount, type
  const [sortOrder, setSortOrder] = useState('desc') // asc, desc

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        
        // Simular dados de histórico para modo teste
        if (user?.strategy === 'test') {
          const mockTransactions = [
            {
              id: '1',
              type: 'stake',
              token: 'KALE',
              amount: 5000,
              date: new Date('2024-01-15T10:30:00').toISOString(),
              status: 'completed',
              txHash: '0x1234...abcd',
              fee: 0.1
            },
            {
              id: '2',
              type: 'reward',
              token: 'KALE',
              amount: 125.75,
              date: new Date('2024-01-14T08:15:00').toISOString(),
              status: 'completed',
              txHash: '0x5678...efgh',
              fee: 0.05
            },
            {
              id: '3',
              type: 'stake',
              token: 'XLM',
              amount: 2500,
              date: new Date('2024-01-12T14:20:00').toISOString(),
              status: 'completed',
              txHash: '0x9abc...ijkl',
              fee: 0.1
            },
            {
              id: '4',
              type: 'reward',
              token: 'XLM',
              amount: 45.30,
              date: new Date('2024-01-10T09:45:00').toISOString(),
              status: 'completed',
              txHash: '0xdef0...mnop',
              fee: 0.05
            },
            {
              id: '5',
              type: 'stake',
              token: 'KALE',
              amount: 3000,
              date: new Date('2024-01-08T16:10:00').toISOString(),
              status: 'completed',
              txHash: '0x1357...qrst',
              fee: 0.1
            },
            {
              id: '6',
              type: 'reward',
              token: 'KALE',
              amount: 89.32,
              date: new Date('2024-01-07T09:45:00').toISOString(),
              status: 'completed',
              txHash: '0xabc1...mnop',
              fee: 0.05
            },
            {
              id: '7',
              type: 'unstake',
              token: 'XLM',
              amount: 1000,
              date: new Date('2024-01-05T16:10:00').toISOString(),
              status: 'completed',
              txHash: '0x1357...qrst',
              fee: 0.1
            },
            {
              id: '8',
              type: 'stake',
              token: 'XLM',
              amount: 1500,
              date: new Date('2024-01-03T12:00:00').toISOString(),
              status: 'completed',
              txHash: '0x2468...uvwx',
              fee: 0.1
            },
            {
              id: '9',
              type: 'reward',
              token: 'XLM',
              amount: 28.15,
              date: new Date('2024-01-01T15:30:00').toISOString(),
              status: 'completed',
              txHash: '0x9876...zyxw',
              fee: 0.05
            }
          ]
          setTransactions(mockTransactions)
        }
      } catch (error) {
        console.error('Erro ao carregar histórico:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user?.publicKey) {
      fetchTransactions()
    }
  }, [user])

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'stake':
        return <ArrowUpRight className="h-5 w-5 text-green-400" />
      case 'unstake':
        return <ArrowDownRight className="h-5 w-5 text-red-400" />
      case 'reward':
        return <Gift className="h-5 w-5 text-orange-400" />
      default:
        return <Zap className="h-5 w-5 text-blue-400" />
    }
  }

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'stake':
        return 'Staking'
      case 'unstake':
        return 'Unstaking'
      case 'reward':
        return 'Recompensa'
      default:
        return 'Transação'
    }
  }

  const getTransactionColor = (type) => {
    switch (type) {
      case 'stake':
        return 'text-green-400'
      case 'unstake':
        return 'text-red-400'
      case 'reward':
        return 'text-orange-400'
      default:
        return 'text-blue-400'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(value)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredTransactions = transactions
    .filter(tx => {
      if (filter !== 'all' && tx.type !== filter) return false
      if (tokenFilter !== 'all' && tx.token !== tokenFilter) return false
      if (searchTerm && !tx.txHash.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'amount':
          aValue = a.amount
          bValue = b.amount
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        default:
          aValue = new Date(a.date)
          bValue = new Date(b.date)
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando histórico...</p>
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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center space-x-3">
              <History className="h-8 w-8 text-blue-400" />
              <span>Histórico Multi-Token</span>
            </h1>
            <p className="text-gray-400">
              Histórico completo de delegações KALE e XLM com recompensas verificadas
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Todas as transações são registradas na rede Stellar com transparência total
            </p>
          </div>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 border border-white/20">
            <Download className="h-4 w-4 text-white" />
            <span className="text-white text-sm font-medium">Exportar CSV</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Filter by Type */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Tipo</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todos</option>
                <option value="stake">Staking</option>
                <option value="unstake">Unstaking</option>
                <option value="reward">Recompensas</option>
              </select>
            </div>

            {/* Filter by Token */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Token</label>
              <select
                value={tokenFilter}
                onChange={(e) => setTokenFilter(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todos</option>
                <option value="KALE">KALE</option>
                <option value="XLM">XLM</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Hash da transação..."
                  className="w-full bg-white/5 border border-white/20 rounded-xl pl-10 pr-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="date">Data</option>
                <option value="amount">Valor</option>
                <option value="type">Tipo</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Ordem</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="desc">Mais recente</option>
                <option value="asc">Mais antigo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-white/10">
              {filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white/10 p-3 rounded-xl">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                         <div className="flex items-center space-x-2">
                           <h3 className="text-white font-semibold">{getTransactionLabel(transaction.type)}</h3>
                           <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                             transaction.token === 'KALE' 
                               ? 'bg-green-500/20 text-green-400'
                               : 'bg-blue-500/20 text-blue-400'
                           }`}>
                             {transaction.token}
                           </span>
                           {getStatusIcon(transaction.status)}
                         </div>
                         <p className="text-gray-400 text-sm">{formatDate(transaction.date)}</p>
                         <p className="text-gray-500 text-xs font-mono">{transaction.txHash}</p>
                       </div>
                    </div>
                    
                    <div className="text-right">
                       <p className={`text-lg font-bold ${getTransactionColor(transaction.type)}`}>
                         {transaction.type === 'stake' ? '+' : transaction.type === 'unstake' ? '-' : '+'}
                         {formatNumber(transaction.amount)} {transaction.token}
                       </p>
                       <p className="text-gray-400 text-sm">Taxa: {formatNumber(transaction.fee)} {transaction.token}</p>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <History className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Nenhuma transação encontrada</h3>
              <p className="text-gray-400">
                {filter !== 'all' || searchTerm 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Suas transações aparecerão aqui quando você começar a usar a plataforma'
                }
              </p>
            </div>
          )}
        </div>

        {/* Summary */}
        {filteredTransactions.length > 0 && (
          <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-semibold text-lg mb-4">Resumo do Período</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {filteredTransactions.filter(tx => tx.type === 'stake').length}
                </p>
                <p className="text-gray-400 text-sm">Transações de Staking</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-400">
                  {filteredTransactions.filter(tx => tx.type === 'reward').length}
                </p>
                <p className="text-gray-400 text-sm">Recompensas Recebidas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {formatNumber(
                    filteredTransactions.reduce((sum, tx) => {
                      if (tx.type === 'reward' && tx.token === 'KALE') return sum + tx.amount
                      return sum
                    }, 0)
                  )}
                </p>
                <p className="text-gray-400 text-sm">Total KALE Ganho</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {formatNumber(
                    filteredTransactions.reduce((sum, tx) => {
                      if (tx.type === 'reward' && tx.token === 'XLM') return sum + tx.amount
                      return sum
                    }, 0)
                  )}
                </p>
                <p className="text-gray-400 text-sm">Total XLM Ganho</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HistoryPage