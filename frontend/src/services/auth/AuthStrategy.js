/**
 * Interface base para estratégias de autenticação
 * Implementa o padrão Strategy para diferentes métodos de login
 */
export class AuthStrategy {
  constructor(name, displayName, icon) {
    this.name = name
    this.displayName = displayName
    this.icon = icon
  }

  /**
   * Verifica se o método de autenticação está disponível
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    throw new Error('isAvailable() deve ser implementado pela estratégia')
  }

  /**
   * Realiza a autenticação
   * @returns {Promise<{publicKey: string, address: string, metadata?: object}>}
   */
  async authenticate() {
    throw new Error('authenticate() deve ser implementado pela estratégia')
  }

  /**
   * Desconecta o usuário
   * @returns {Promise<void>}
   */
  async disconnect() {
    // Implementação padrão - pode ser sobrescrita
    return Promise.resolve()
  }

  /**
   * Verifica se há uma sessão ativa
   * @returns {Promise<object|null>}
   */
  async checkSession() {
    // Implementação padrão - pode ser sobrescrita
    return null
  }
}

/**
 * Gerenciador de estratégias de autenticação
 */
export class AuthStrategyManager {
  constructor() {
    this.strategies = new Map()
    this.currentStrategy = null
  }

  /**
   * Registra uma nova estratégia de autenticação
   * @param {AuthStrategy} strategy 
   */
  registerStrategy(strategy) {
    this.strategies.set(strategy.name, strategy)
  }

  /**
   * Obtém todas as estratégias disponíveis
   * @returns {Promise<AuthStrategy[]>}
   */
  async getAvailableStrategies() {
    const available = []
    for (const strategy of this.strategies.values()) {
      try {
        if (await strategy.isAvailable()) {
          available.push(strategy)
        }
      } catch (error) {
        console.warn(`Erro ao verificar disponibilidade da estratégia ${strategy.name}:`, error)
      }
    }
    return available
  }

  /**
   * Obtém uma estratégia específica
   * @param {string} name 
   * @returns {AuthStrategy|null}
   */
  getStrategy(name) {
    return this.strategies.get(name) || null
  }

  /**
   * Define a estratégia atual
   * @param {string} name 
   */
  setCurrentStrategy(name) {
    const strategy = this.getStrategy(name)
    if (strategy) {
      this.currentStrategy = strategy
    }
  }

  /**
   * Obtém a estratégia atual
   * @returns {AuthStrategy|null}
   */
  getCurrentStrategy() {
    return this.currentStrategy
  }
}