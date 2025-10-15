import { AuthStrategy } from './AuthStrategy.js'
import albedo from '@albedo-link/intent'

/**
 * Estratégia de autenticação para Albedo Wallet
 */
export class AlbedoStrategy extends AuthStrategy {
  constructor() {
    super('albedo', 'Albedo Wallet', '🌟')
    this.albedo = albedo || null
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

      // Carregar Albedo SDK dinamicamente (fallback caso o import falhe)
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/@albedo-link/intent@0.13.0/lib/albedo.intent.js'
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
    // Retornar rapidamente para não perder o gesto do usuário no clique
    const available = typeof window !== 'undefined'
    if (!available) {
      console.log('[ALBEDO] Ambiente não é browser')
    }
    return available
  }

  /**
   * Realiza autenticação com Albedo
   * @returns {Promise<{publicKey: string, address: string, metadata: object}>}
   */
  async authenticate() {
    try {
      console.log('[ALBEDO] Iniciando processo de autenticação...')
      // Preferir biblioteca importada
      if (this.albedo && typeof this.albedo.publicKey === 'function') {
        const result = await this.albedo.publicKey({
          token: 'stellar-stake-house-auth',
          callback: null
        })

        if (!result || !result.pubkey) {
          throw new Error('Resposta inválida do Albedo - chave pública não encontrada')
        }
        if (!/^G[A-Z2-7]{55}$/.test(result.pubkey)) {
          throw new Error('Formato de chave pública Stellar inválido')
        }
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
      }

      // Fallback sem SDK: abrir popup em albedo.link e enviar parâmetros via postMessage
      const popupUrl = 'https://albedo.link/'
      console.log('[ALBEDO] SDK indisponível, usando fallback via postMessage:', popupUrl)

      const popup = window.open(popupUrl, 'albedo-intent', 'width=500,height=700')
      if (!popup) {
        throw new Error('Popup bloqueado. Permita popups para este site e tente novamente.')
      }

      const result = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          try { popup.close() } catch {}
          reject(new Error('Tempo limite excedido. Tente novamente.'))
        }, 60000)

        // Enviar intent repetidamente até o popup responder (simples handshake)
        const intentPayload = {
          intent: 'public_key',
          token: 'stellar-stake-house-auth',
          callback: 'postMessage'
        }
        const sendInterval = setInterval(() => {
          try {
            popup.postMessage(intentPayload, 'https://albedo.link')
          } catch (_) {
            // Ignorar erros de envio enquanto o popup inicializa
          }
        }, 500)

        const handler = (event) => {
          try {
            if (!event || !event.origin || !event.data) return
            // Validar origem do Albedo
            if (!event.origin.includes('albedo.link')) return

            const data = event.data
            // Espera-se um objeto com pubkey/lib intent
            if (data && data.pubkey) {
              clearTimeout(timeout)
              clearInterval(sendInterval)
              window.removeEventListener('message', handler)
              try { popup.close() } catch {}
              resolve({
                pubkey: data.pubkey,
                intent_version: data.intent_version || 'unknown',
                signed: data.signed || false
              })
            }
          } catch (e) {
            // Ignorar erros do handler
          }
        }
        window.addEventListener('message', handler)
      })

      if (!result || !result.pubkey) {
        throw new Error('Resposta inválida do Albedo - chave pública não encontrada')
      }
      if (!/^G[A-Z2-7]{55}$/.test(result.pubkey)) {
        throw new Error('Formato de chave pública Stellar inválido')
      }
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
      
      const albedoLib = this.albedo || (await this.loadAlbedoSDK())
      
      const result = await albedoLib.tx({
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
      
      const albedoLib = this.albedo || (await this.loadAlbedoSDK())
      
      const result = await albedoLib.pay({
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