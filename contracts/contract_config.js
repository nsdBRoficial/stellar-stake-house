// Configuração dos contratos Stellar para integração com o frontend

// Configurações da rede Stellar
export const STELLAR_CONFIG = {
  testnet: {
    networkPassphrase: 'Test SDF Network ; September 2015',
    rpcUrl: 'https://soroban-testnet.stellar.org:443',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    friendbotUrl: 'https://friendbot.stellar.org'
  },
  mainnet: {
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
    rpcUrl: 'https://soroban-rpc.stellar.org:443',
    horizonUrl: 'https://horizon.stellar.org'
  }
}

// IDs dos contratos (serão preenchidos após deploy)
export const CONTRACT_IDS = {
  testnet: {
    poolRewards: process.env.REACT_APP_POOL_REWARDS_CONTRACT_ID || 'CCSDDTQSALKJQ2SXXBS2VUSYD74QDHG22KFZRHMHTOCWDCMKO7JVHSXY',
    // Adicionar outros contratos conforme necessário
  },
  mainnet: {
    poolRewards: process.env.REACT_APP_POOL_REWARDS_CONTRACT_ID_MAINNET || '',
  }
}

// Tokens suportados na testnet
export const SUPPORTED_TOKENS = {
  testnet: {
    KALE: {
      symbol: 'KALE',
      name: 'Kale Token',
      contractAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQAHHAGCN4YU', // Placeholder
      decimals: 7,
      icon: '🥬'
    },
    XLM: {
      symbol: 'XLM',
      name: 'Stellar Lumens',
      contractAddress: 'native',
      decimals: 7,
      icon: '⭐'
    }
  },
  mainnet: {
    // Configurar tokens da mainnet quando necessário
  }
}

// Configurações padrão para pools
export const POOL_DEFAULTS = {
  minTotalRewards: 1000, // Mínimo de tokens para criar uma pool
  maxTotalRewards: 1000000000, // Máximo de tokens para uma pool
  minAPY: 0.1, // APY mínimo em %
  maxAPY: 100, // APY máximo em %
  minDistributionDays: 1, // Mínimo de dias para distribuição
  maxDistributionDays: 365, // Máximo de dias para distribuição
  minDelegationAmount: 1 // Valor mínimo para delegação
}

// Funções utilitárias para interação com contratos
export const CONTRACT_FUNCTIONS = {
  // Pool Rewards Contract
  poolRewards: {
    // Funções de leitura (não requerem assinatura)
    read: {
      getPool: 'get_pool',
      getActivePools: 'get_active_pools',
      getUserDelegation: 'get_user_delegation',
      calculatePendingRewards: 'calculate_pending_rewards'
    },
    // Funções de escrita (requerem assinatura)
    write: {
      createPool: 'create_pool',
      delegateToPool: 'delegate_to_pool',
      claimRewards: 'claim_rewards',
      togglePoolStatus: 'toggle_pool_status'
    }
  }
}

// Configurações de gas e fees
export const TRANSACTION_CONFIG = {
  baseFee: '100', // Fee base em stroops
  timeout: 30, // Timeout em segundos
  networkPassphrase: STELLAR_CONFIG.testnet.networkPassphrase // Usar testnet por padrão
}

// Mensagens de erro comuns
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Carteira não conectada',
  INSUFFICIENT_BALANCE: 'Saldo insuficiente',
  POOL_NOT_FOUND: 'Pool não encontrada',
  POOL_INACTIVE: 'Pool não está ativa',
  POOL_ENDED: 'Pool já terminou',
  INVALID_AMOUNT: 'Valor inválido',
  TRANSACTION_FAILED: 'Transação falhou',
  CONTRACT_ERROR: 'Erro no contrato inteligente',
  NETWORK_ERROR: 'Erro de rede'
}

// Eventos do contrato (para logs e monitoramento)
export const CONTRACT_EVENTS = {
  POOL_CREATED: 'pool_created',
  DELEGATION_MADE: 'delegation_made',
  REWARDS_CLAIMED: 'rewards_claimed',
  POOL_STATUS_CHANGED: 'pool_status_changed'
}

// Configurações de cache para otimização
export const CACHE_CONFIG = {
  poolDataTTL: 300000, // 5 minutos em ms
  userDataTTL: 60000, // 1 minuto em ms
  rewardsDataTTL: 30000 // 30 segundos em ms
}

// Função para obter configuração baseada no ambiente
export function getNetworkConfig(network = 'testnet') {
  return {
    stellar: STELLAR_CONFIG[network],
    contracts: CONTRACT_IDS[network],
    tokens: SUPPORTED_TOKENS[network]
  }
}

// Função para validar parâmetros de pool
export function validatePoolParams(params) {
  const errors = []
  
  if (!params.poolName || params.poolName.trim().length < 3) {
    errors.push('Nome da pool deve ter pelo menos 3 caracteres')
  }
  
  if (!params.totalRewards || params.totalRewards < POOL_DEFAULTS.minTotalRewards) {
    errors.push(`Total de recompensas deve ser pelo menos ${POOL_DEFAULTS.minTotalRewards}`)
  }
  
  if (params.totalRewards > POOL_DEFAULTS.maxTotalRewards) {
    errors.push(`Total de recompensas não pode exceder ${POOL_DEFAULTS.maxTotalRewards}`)
  }
  
  if (!params.maxAPY || params.maxAPY < POOL_DEFAULTS.minAPY || params.maxAPY > POOL_DEFAULTS.maxAPY) {
    errors.push(`APY deve estar entre ${POOL_DEFAULTS.minAPY}% e ${POOL_DEFAULTS.maxAPY}%`)
  }
  
  if (!params.distributionDays || params.distributionDays < POOL_DEFAULTS.minDistributionDays || params.distributionDays > POOL_DEFAULTS.maxDistributionDays) {
    errors.push(`Período de distribuição deve estar entre ${POOL_DEFAULTS.minDistributionDays} e ${POOL_DEFAULTS.maxDistributionDays} dias`)
  }
  
  return errors
}

// Função para formatar valores para o contrato
export function formatValueForContract(value, decimals = 7) {
  return Math.floor(value * Math.pow(10, decimals))
}

// Função para formatar valores do contrato para exibição
export function formatValueFromContract(value, decimals = 7) {
  return value / Math.pow(10, decimals)
}

// Função para calcular APY em pontos base
export function apyToBasicPoints(apy) {
  return Math.floor(apy * 100) // 15% = 1500 pontos base
}

// Função para converter pontos base para APY
export function basicPointsToApy(basicPoints) {
  return basicPoints / 100
}

export default {
  STELLAR_CONFIG,
  CONTRACT_IDS,
  SUPPORTED_TOKENS,
  POOL_DEFAULTS,
  CONTRACT_FUNCTIONS,
  TRANSACTION_CONFIG,
  ERROR_MESSAGES,
  CONTRACT_EVENTS,
  CACHE_CONFIG,
  getNetworkConfig,
  validatePoolParams,
  formatValueForContract,
  formatValueFromContract,
  apyToBasicPoints,
  basicPointsToApy
}