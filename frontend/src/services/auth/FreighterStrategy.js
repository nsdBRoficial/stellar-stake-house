import { AuthStrategy } from './AuthStrategy.js'
import { isConnected, getPublicKey, signTransaction } from '@stellar/freighter-api'

/**
 * Estratégia de autenticação para Freighter Wallet
 */
export class FreighterStrategy extends AuthStrategy {
  constructor() {
    super('freighter', 'Freighter Wallet', '🚀')
  }

  /**
   * Verifica se o Freighter está disponível
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      console.log('[FREIGHTER] Iniciando verificação de disponibilidade...')
      
      // Verificação 1: Verificar se a extensão está instalada
      if (typeof window === 'undefined') {
        console.log('[FREIGHTER] Ambiente não é browser')
        return false
      }
      
      // Verificação 2: Verificar múltiplas formas de detecção
      const hasFreighterGlobal = !!(window.freighter)
      const hasStellarFreighter = !!(window.stellar && window.stellar.freighter)
      const hasFreighterAPI = typeof isConnected === 'function'
      
      console.log('[FREIGHTER] Verificações de detecção:', {
        hasFreighterGlobal,
        hasStellarFreighter,
        hasFreighterAPI
      })
      
      if (!hasFreighterAPI) {
        console.log('[FREIGHTER] API do Freighter não está disponível')
        return false
      }
      
      // Verificação 3: Tentar usar a API com timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na verificação')), 5000)
      })
      
      const connectionCheck = isConnected()
      
      await Promise.race([connectionCheck, timeoutPromise])
      
      console.log('[FREIGHTER] Disponível e funcionando')
      return true
    } catch (error) {
      console.log('[FREIGHTER] Não disponível ou com erro:', {
        message: error.message,
        name: error.name
      })
      return false
    }
  }

  /**
   * Realiza autenticação com Freighter
   * @returns {Promise<{publicKey: string, address: string, metadata: object}>}
   */
  async authenticate() {
    const maxRetries = 3
    let lastError = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[FREIGHTER] Tentativa ${attempt}/${maxRetries} de autenticação...`)
        
        // Verificar se está disponível
        const available = await this.isAvailable()
        if (!available) {
          throw new Error('Freighter wallet não está disponível. Verifique se a extensão está instalada e ativa.')
        }

        // Aguardar um pouco entre tentativas (exceto na primeira)
        if (attempt > 1) {
          console.log(`[FREIGHTER] Aguardando ${attempt * 500}ms antes da tentativa...`)
          await new Promise(resolve => setTimeout(resolve, attempt * 500))
        }

        // Obter chave pública com timeout
        console.log('[FREIGHTER] Solicitando chave pública...')
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout ao solicitar chave pública')), 10000)
        })
        
        const publicKeyPromise = getPublicKey()
        const publicKey = await Promise.race([publicKeyPromise, timeoutPromise])
        
        if (!publicKey) {
          throw new Error('Chave pública vazia retornada pelo Freighter')
        }
        
        // Validar formato da chave pública Stellar
        if (!/^G[A-Z2-7]{55}$/.test(publicKey)) {
          throw new Error('Formato de chave pública Stellar inválido')
        }

        console.log(`[FREIGHTER] Autenticação bem-sucedida na tentativa ${attempt}`)
        
        return {
          publicKey,
          address: publicKey,
          metadata: {
            provider: 'freighter',
            timestamp: Date.now(),
            version: 'latest',
            attempt: attempt
          }
        }
      } catch (error) {
        console.error(`[FREIGHTER] Erro na tentativa ${attempt}:`, {
          message: error.message,
          name: error.name,
          stack: error.stack
        })
        
        lastError = error
        
        // Se é a última tentativa ou erro crítico, não tentar novamente
        if (attempt === maxRetries || 
            error.message.includes('User declined') ||
            error.message.includes('rejected') ||
            error.message.includes('denied')) {
          break
        }
        
        console.log(`[FREIGHTER] Tentando novamente em ${attempt * 1000}ms...`)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
      }
    }
    
    // Se chegou aqui, todas as tentativas falharam
    console.error('[FREIGHTER] Todas as tentativas de autenticação falharam')
    
    if (lastError.message.includes('User declined') || lastError.message.includes('rejected')) {
      throw new Error('Autenticação cancelada pelo usuário')
    } else if (lastError.message.includes('locked')) {
      throw new Error('Freighter está bloqueado. Desbloqueie a carteira e tente novamente.')
    } else if (lastError.message.includes('Timeout')) {
      throw new Error('Tempo limite excedido. Verifique se o Freighter está funcionando e tente novamente.')
    } else {
      throw new Error(`Erro no Freighter após ${maxRetries} tentativas: ${lastError.message}`)
    }
  }

  /**
   * Desconecta do Freighter
   * @returns {Promise<void>}
   */
  async disconnect() {
    console.log('[FREIGHTER] Desconectando...')
    // Freighter não tem método de desconexão explícito
    // A desconexão é gerenciada pelo contexto da aplicação
    return Promise.resolve()
  }

  /**
   * Verifica sessão ativa no Freighter
   * @returns {Promise<object|null>}
   */
  async checkSession() {
    try {
      const available = await this.isAvailable()
      if (!available) {
        return null
      }

      const publicKey = await getPublicKey()
      if (publicKey) {
        return {
          publicKey,
          address: publicKey,
          provider: 'freighter'
        }
      }
      return null
    } catch (error) {
      console.log('[FREIGHTER] Erro ao verificar sessão:', error.message)
      return null
    }
  }

  /**
   * Assina uma transação com Freighter
   * @param {string} transaction - Transação XDR
   * @param {object} options - Opções de assinatura
   * @returns {Promise<string>}
   */
  async signTransaction(transaction, options = {}) {
    try {
      console.log('[FREIGHTER] Assinando transação...')
      const signedXdr = await signTransaction(transaction, options)
      console.log('[FREIGHTER] Transação assinada com sucesso')
      return signedXdr
    } catch (error) {
      console.error('[FREIGHTER] Erro ao assinar transação:', error)
      throw new Error(`Erro ao assinar transação: ${error.message}`)
    }
  }
}