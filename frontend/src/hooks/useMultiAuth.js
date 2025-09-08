import { useContext } from 'react'
import { MultiAuthContext } from '../contexts/MultiAuthContext.jsx'

/**
 * Hook personalizado para usar o contexto de autenticação multi-modal
 * @returns {object} Contexto de autenticação
 */
export function useMultiAuth() {
  const context = useContext(MultiAuthContext)
  
  if (!context) {
    throw new Error('useMultiAuth deve ser usado dentro de um MultiAuthProvider')
  }
  
  return context
}

/**
 * Hook para verificar se uma estratégia específica está disponível
 * @param {string} strategyName - Nome da estratégia
 * @returns {boolean} Se a estratégia está disponível
 */
export function useAuthStrategy(strategyName) {
  const { availableStrategies } = useMultiAuth()
  return availableStrategies.some(strategy => strategy.name === strategyName)
}

/**
 * Hook para obter informações sobre todas as estratégias
 * @returns {object} Informações das estratégias
 */
export function useAuthStrategies() {
  const { availableStrategies, currentStrategy } = useMultiAuth()
  
  return {
    available: availableStrategies,
    current: currentStrategy,
    count: availableStrategies.length,
    hasFreighter: availableStrategies.some(s => s.name === 'freighter'),
    hasAlbedo: availableStrategies.some(s => s.name === 'albedo'),
    hasPasskey: availableStrategies.some(s => s.name === 'passkey'),
    hasTest: availableStrategies.some(s => s.name === 'test')
  }
}

/**
 * Hook para autenticação rápida com estratégia preferida
 * @returns {function} Função de autenticação rápida
 */
export function useQuickAuth() {
  const { authenticateWith, getPreferredStrategy, availableStrategies } = useMultiAuth()
  
  const quickAuth = async (options = {}) => {
    const preferred = getPreferredStrategy()
    
    // Se há uma estratégia preferida e ela está disponível, usar ela
    if (preferred && availableStrategies.some(s => s.name === preferred)) {
      return await authenticateWith(preferred, options)
    }
    
    // Caso contrário, usar a primeira estratégia disponível
    if (availableStrategies.length > 0) {
      return await authenticateWith(availableStrategies[0].name, options)
    }
    
    throw new Error('Nenhuma estratégia de autenticação disponível')
  }
  
  return quickAuth
}