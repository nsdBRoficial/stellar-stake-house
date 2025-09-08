import { AuthStrategy } from './AuthStrategy.js'
import * as StellarSdk from 'stellar-sdk'

/**
 * Estratégia de autenticação via Passkey/WebAuthn com email
 */
export class PasskeyStrategy extends AuthStrategy {
  constructor() {
    super('passkey', 'Email + Passkey', '🔐')
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002'
  }

  /**
   * Verifica se WebAuthn está disponível
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      console.log('[PASSKEY] Verificando disponibilidade do WebAuthn...')
      
      // Verificar se o navegador suporta WebAuthn
      const isWebAuthnSupported = !!(navigator.credentials && navigator.credentials.create)
      
      if (!isWebAuthnSupported) {
        console.log('[PASSKEY] WebAuthn não suportado pelo navegador')
        return false
      }

      // Verificar se o dispositivo suporta autenticadores
      const isAuthenticatorSupported = window.PublicKeyCredential ? 
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable() : false
      
      console.log('[PASSKEY] WebAuthn disponível:', isWebAuthnSupported)
      console.log('[PASSKEY] Autenticador de plataforma disponível:', isAuthenticatorSupported)
      
      return isWebAuthnSupported
    } catch (error) {
      console.log('[PASSKEY] Erro ao verificar disponibilidade:', error.message)
      return false
    }
  }

  /**
   * Realiza autenticação via email + passkey
   * @param {string} email - Email do usuário
   * @returns {Promise<{publicKey: string, address: string, metadata: object}>}
   */
  async authenticate(email) {
    try {
      console.log('[PASSKEY] Iniciando autenticação para:', email)
      
      if (!email) {
        throw new Error('Email é obrigatório para autenticação via Passkey')
      }

      // Verificar se já existe uma conta para este email
      const existingUser = await this.checkExistingUser(email)
      
      if (existingUser) {
        return await this.authenticateExistingUser(email)
      } else {
        return await this.registerNewUser(email)
      }
    } catch (error) {
      console.error('[PASSKEY] Erro na autenticação:', error)
      throw new Error(`Erro na autenticação Passkey: ${error.message}`)
    }
  }

  /**
   * Verifica se já existe um usuário com o email
   * @param {string} email 
   * @returns {Promise<boolean>}
   */
  async checkExistingUser(email) {
    try {
      const response = await fetch(`${this.apiUrl}/api/auth/passkey/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()
      return data.exists || false
    } catch (error) {
      console.error('[PASSKEY] Erro ao verificar usuário existente:', error)
      return false
    }
  }

  /**
   * Registra um novo usuário com Passkey
   * @param {string} email 
   * @returns {Promise<object>}
   */
  async registerNewUser(email) {
    try {
      console.log('[PASSKEY] Registrando novo usuário...')
      
      // Gerar par de chaves Stellar para o usuário
      const keypair = StellarSdk.Keypair.random()
      const publicKey = keypair.publicKey()
      const secretKey = keypair.secret()

      // Solicitar opções de registro do servidor
      const optionsResponse = await fetch(`${this.apiUrl}/api/auth/passkey/register/begin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email,
          publicKey,
          displayName: email.split('@')[0]
        })
      })

      if (!optionsResponse.ok) {
        throw new Error('Erro ao obter opções de registro')
      }

      const options = await optionsResponse.json()

      // Criar credencial WebAuthn
      console.log('[PASSKEY] Criando credencial WebAuthn...')
      const credential = await navigator.credentials.create({
        publicKey: {
          ...options.publicKey,
          challenge: new Uint8Array(options.publicKey.challenge),
          user: {
            ...options.publicKey.user,
            id: new Uint8Array(options.publicKey.user.id)
          }
        }
      })

      if (!credential) {
        throw new Error('Falha ao criar credencial')
      }

      // Finalizar registro no servidor
      const finishResponse = await fetch(`${this.apiUrl}/api/auth/passkey/register/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          publicKey,
          credential: {
            id: credential.id,
            rawId: Array.from(new Uint8Array(credential.rawId)),
            response: {
              attestationObject: Array.from(new Uint8Array(credential.response.attestationObject)),
              clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON))
            },
            type: credential.type
          }
        })
      })

      if (!finishResponse.ok) {
        throw new Error('Erro ao finalizar registro')
      }

      const result = await finishResponse.json()
      
      console.log('[PASSKEY] Usuário registrado com sucesso')
      
      // Armazenar chave secreta de forma segura (temporariamente no sessionStorage)
      // Em produção, considere usar um método mais seguro
      sessionStorage.setItem(`stellar_secret_${email}`, secretKey)
      
      return {
        publicKey,
        address: publicKey,
        metadata: {
          provider: 'passkey',
          email,
          timestamp: Date.now(),
          credentialId: credential.id,
          isNewUser: true
        }
      }
    } catch (error) {
      console.error('[PASSKEY] Erro no registro:', error)
      throw new Error(`Erro no registro: ${error.message}`)
    }
  }

  /**
   * Autentica usuário existente
   * @param {string} email 
   * @returns {Promise<object>}
   */
  async authenticateExistingUser(email) {
    try {
      console.log('[PASSKEY] Autenticando usuário existente...')
      
      // Solicitar opções de autenticação do servidor
      const optionsResponse = await fetch(`${this.apiUrl}/api/auth/passkey/login/begin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      if (!optionsResponse.ok) {
        throw new Error('Erro ao obter opções de autenticação')
      }

      const options = await optionsResponse.json()

      // Autenticar com WebAuthn
      console.log('[PASSKEY] Solicitando autenticação WebAuthn...')
      const assertion = await navigator.credentials.get({
        publicKey: {
          ...options.publicKey,
          challenge: new Uint8Array(options.publicKey.challenge),
          allowCredentials: options.publicKey.allowCredentials?.map(cred => ({
            ...cred,
            id: new Uint8Array(cred.id)
          }))
        }
      })

      if (!assertion) {
        throw new Error('Falha na autenticação')
      }

      // Finalizar autenticação no servidor
      const finishResponse = await fetch(`${this.apiUrl}/api/auth/passkey/login/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          assertion: {
            id: assertion.id,
            rawId: Array.from(new Uint8Array(assertion.rawId)),
            response: {
              authenticatorData: Array.from(new Uint8Array(assertion.response.authenticatorData)),
              clientDataJSON: Array.from(new Uint8Array(assertion.response.clientDataJSON)),
              signature: Array.from(new Uint8Array(assertion.response.signature)),
              userHandle: assertion.response.userHandle ? Array.from(new Uint8Array(assertion.response.userHandle)) : null
            },
            type: assertion.type
          }
        })
      })

      if (!finishResponse.ok) {
        throw new Error('Erro ao finalizar autenticação')
      }

      const result = await finishResponse.json()
      
      console.log('[PASSKEY] Autenticação bem-sucedida')
      
      return {
        publicKey: result.publicKey,
        address: result.publicKey,
        metadata: {
          provider: 'passkey',
          email,
          timestamp: Date.now(),
          credentialId: assertion.id,
          isNewUser: false
        }
      }
    } catch (error) {
      console.error('[PASSKEY] Erro na autenticação:', error)
      throw new Error(`Erro na autenticação: ${error.message}`)
    }
  }

  /**
   * Desconecta do Passkey
   * @returns {Promise<void>}
   */
  async disconnect() {
    console.log('[PASSKEY] Desconectando...')
    // Limpar dados sensíveis do sessionStorage
    const keys = Object.keys(sessionStorage)
    keys.forEach(key => {
      if (key.startsWith('stellar_secret_')) {
        sessionStorage.removeItem(key)
      }
    })
    return Promise.resolve()
  }

  /**
   * Verifica sessão ativa
   * @returns {Promise<object|null>}
   */
  async checkSession() {
    try {
      // Verificar se há dados de sessão no localStorage
      const savedAuth = localStorage.getItem('stellar_auth')
      if (!savedAuth) {
        return null
      }

      const authData = JSON.parse(savedAuth)
      if (authData.provider === 'passkey' && authData.email) {
        // Verificar se a sessão ainda é válida (24 horas)
        const isExpired = Date.now() - authData.timestamp > 24 * 60 * 60 * 1000
        if (!isExpired) {
          return {
            publicKey: authData.publicKey,
            address: authData.publicKey,
            provider: 'passkey',
            email: authData.email
          }
        }
      }
      return null
    } catch (error) {
      console.log('[PASSKEY] Erro ao verificar sessão:', error.message)
      return null
    }
  }
}