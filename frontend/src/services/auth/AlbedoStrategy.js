import { AuthStrategy } from './AuthStrategy.js'

/**
 * Estratégia de autenticação para Albedo Wallet
 */
export class AlbedoStrategy extends AuthStrategy {
  constructor() {
    super('albedo', 'Albedo Wallet', '🌟')
    this.albedo = null
  }

  /**
   * Carrega o SDK do Albedo dinamicamente
   * @returns {Promise<object>}
   */
  async loadAlbedoSDK() {
    if (this.albedo) {
      return this.albedo
    }

    try {
      console.log('[ALBEDO] Iniciando carregamento do SDK...')
      
      // Verificar se já está carregado
      if (window.albedo) {
        console.log('[ALBEDO] SDK já estava carregado')
        this.albedo = window.albedo
        return this.albedo
      }

      // Carregar Albedo SDK dinamicamente
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/@albedo-link/intent@0.12.1/lib/albedo.min.js'
      script.async = true
      script.crossOrigin = 'anonymous'
      
      console.log('[ALBEDO] Carregando script do SDK...')
      
      await new Promise((resolve, reject) => {
        script.onload = () => {
          console.log('[ALBEDO] Script carregado com sucesso')
          resolve()
        }
        script.onerror = (error) => {
          console.error('[ALBEDO] Erro ao carregar script:', error)
          reject(new Error('Falha ao carregar script do Albedo'))
        }
        document.head.appendChild(script)
      })

      // Aguardar o Albedo estar disponível globalmente com timeout
      console.log('[ALBEDO] Aguardando SDK estar disponível...')
      await new Promise((resolve, reject) => {
        let attempts = 0
        const maxAttempts = 50 // 5 segundos
        
        const checkAlbedo = () => {
          attempts++
          if (window.albedo) {
            console.log('[ALBEDO] SDK disponível após', attempts * 100, 'ms')
            resolve()
          } else if (attempts >= maxAttempts) {
            reject(new Error('Timeout aguardando Albedo SDK'))
          } else {
            setTimeout(checkAlbedo, 100)
          }
        }
        checkAlbedo()
      })

      this.albedo = window.albedo
      console.log('[ALBEDO] SDK carregado e configurado com sucesso')
      return this.albedo
    } catch (error) {
      console.error('[ALBEDO] Erro ao carregar SDK:', error)
      throw new Error(`Não foi possível carregar o Albedo SDK: ${error.message}`)
    }
  }

  /**
   * Verifica se o Albedo está disponível
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      console.log('[ALBEDO] Verificando disponibilidade...')
      await this.loadAlbedoSDK()
      console.log('[ALBEDO] Disponível')
      return true
    } catch (error) {
      console.log('[ALBEDO] Não disponível:', error.message)
      return false
    }
  }

  /**
   * Realiza autenticação com Albedo
   * @returns {Promise<{publicKey: string, address: string, metadata: object}>}
   */
  async authenticate() {
    try {
      console.log('[ALBEDO] Iniciando processo de autenticação...')
      
      const albedo = await this.loadAlbedoSDK()
      
      if (!albedo || typeof albedo.publicKey !== 'function') {
        throw new Error('SDK do Albedo não está funcionando corretamente')
      }
      
      // Configurar parâmetros para solicitar chave pública
      const requestParams = {
        token: 'stellar-stake-house-auth',
        callback: null, // Forçar popup mode
        network: 'public' // Usar rede principal
      }
      
      console.log('[ALBEDO] Solicitando chave pública com parâmetros:', requestParams)
      
      // Solicitar chave pública do usuário
      const result = await albedo.publicKey(requestParams)
      
      console.log('[ALBEDO] Resposta recebida:', {
        pubkey: result.pubkey ? 'Presente' : 'Ausente',
        intent_version: result.intent_version,
        signed: result.signed
      })

      if (!result || !result.pubkey) {
        throw new Error('Resposta inválida do Albedo - chave pública não encontrada')
      }

      // Validar formato da chave pública Stellar
      if (!/^G[A-Z2-7]{55}$/.test(result.pubkey)) {
        throw new Error('Formato de chave pública Stellar inválido')
      }

      console.log('[ALBEDO] Autenticação bem-sucedida')
      
      return {
        publicKey: result.pubkey,
        address: result.pubkey,
        metadata: {
          provider: 'albedo',
          timestamp: Date.now(),
          intent_version: result.intent_version || 'unknown',
          signed: result.signed || false,
          network: 'public'
        }
      }
    } catch (error) {
      console.error('[ALBEDO] Erro detalhado na autenticação:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      
      // Tratar erros específicos do Albedo
      if (error.message && error.message.includes('rejected')) {
        throw new Error('Autenticação cancelada pelo usuário')
      } else if (error.message && error.message.includes('timeout')) {
        throw new Error('Tempo limite excedido. Tente novamente.')
      } else if (error.message && error.message.includes('popup')) {
        throw new Error('Popup bloqueado. Permita popups para este site e tente novamente.')
      } else if (error.message && error.message.includes('network')) {
        throw new Error('Erro de rede. Verifique sua conexão e tente novamente.')
      } else {
        throw new Error(`Erro no Albedo: ${error.message}`)
      }
    }
  }

  /**
   * Desconecta do Albedo
   * @returns {Promise<void>}
   */
  async disconnect() {
    console.log('[ALBEDO] Desconectando...')
    // Albedo não mantém sessão persistente
    // A desconexão é gerenciada pelo contexto da aplicação
    return Promise.resolve()
  }

  /**
   * Verifica sessão ativa no Albedo
   * @returns {Promise<object|null>}
   */
  async checkSession() {
    // Albedo não mantém sessões persistentes
    // Cada interação requer nova autorização
    console.log('[ALBEDO] Albedo não mantém sessões persistentes')
    return null
  }

  /**
   * Assina uma transação com Albedo
   * @param {string} transaction - Transação XDR
   * @param {object} options - Opções de assinatura
   * @returns {Promise<string>}
   */
  async signTransaction(transaction, options = {}) {
    try {
      console.log('[ALBEDO] Assinando transação...')
      
      const albedo = await this.loadAlbedoSDK()
      
      const result = await albedo.tx({
        xdr: transaction,
        network: options.network || 'public',
        token: 'stellar-stake-house',
        callback: undefined
      })

      if (!result.signed_envelope_xdr) {
        throw new Error('Transação não foi assinada')
      }

      console.log('[ALBEDO] Transação assinada com sucesso')
      return result.signed_envelope_xdr
    } catch (error) {
      console.error('[ALBEDO] Erro ao assinar transação:', error)
      
      if (error.message && error.message.includes('rejected')) {
        throw new Error('Assinatura cancelada pelo usuário')
      } else {
        throw new Error(`Erro ao assinar transação: ${error.message}`)
      }
    }
  }

  /**
   * Solicita pagamento via Albedo
   * @param {object} paymentOptions - Opções de pagamento
   * @returns {Promise<string>}
   */
  async requestPayment(paymentOptions) {
    try {
      console.log('[ALBEDO] Solicitando pagamento...')
      
      const albedo = await this.loadAlbedoSDK()
      
      const result = await albedo.pay({
        ...paymentOptions,
        token: 'stellar-stake-house',
        callback: undefined
      })

      console.log('[ALBEDO] Pagamento processado com sucesso')
      return result
    } catch (error) {
      console.error('[ALBEDO] Erro no pagamento:', error)
      throw new Error(`Erro no pagamento: ${error.message}`)
    }
  }
}