const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const cbor = require('cbor');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configurações WebAuthn
const RP_NAME = 'Stellar Stake House';
const RP_ID = process.env.RP_ID || 'localhost';
const ORIGIN = process.env.ORIGIN || 'http://localhost:3000';

/**
 * Utilitários para WebAuthn
 */
const webauthnUtils = {
  /**
   * Gera um challenge aleatório
   */
  generateChallenge() {
    return crypto.randomBytes(32);
  },

  /**
   * Converte buffer para base64url
   */
  bufferToBase64url(buffer) {
    return buffer.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  },

  /**
   * Converte base64url para buffer
   */
  base64urlToBuffer(base64url) {
    const base64 = base64url
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(base64url.length + (4 - base64url.length % 4) % 4, '=');
    return Buffer.from(base64, 'base64');
  },

  /**
   * Verifica a origem
   */
  verifyOrigin(clientDataJSON) {
    const clientData = JSON.parse(clientDataJSON.toString());
    return clientData.origin === ORIGIN;
  },

  /**
   * Verifica o challenge
   */
  verifyChallenge(clientDataJSON, expectedChallenge) {
    const clientData = JSON.parse(clientDataJSON.toString());
    const receivedChallenge = this.base64urlToBuffer(clientData.challenge);
    return crypto.timingSafeEqual(receivedChallenge, expectedChallenge);
  }
};

/**
 * @route POST /api/auth/passkey/check
 * @desc Verifica se um usuário existe para o email
 * @access Public
 */
router.post('/check', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Verificar se o usuário existe
    const { data: user, error } = await supabase
      .from('passkey_users')
      .select('id')
      .eq('email', email)
      .single();

    res.json({ exists: !!user && !error });
  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @route POST /api/auth/passkey/register/begin
 * @desc Inicia o processo de registro WebAuthn
 * @access Public
 */
router.post('/register/begin', async (req, res) => {
  try {
    const { email, publicKey, displayName } = req.body;

    if (!email || !publicKey) {
      return res.status(400).json({ error: 'Email e chave pública são obrigatórios' });
    }

    // Verificar se o usuário já existe
    const { data: existingUser } = await supabase
      .from('passkey_users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    // Gerar challenge
    const challenge = webauthnUtils.generateChallenge();
    const userId = crypto.randomBytes(32);

    // Salvar dados temporários da sessão
    const sessionData = {
      email,
      publicKey,
      challenge: challenge.toString('base64'),
      userId: userId.toString('base64'),
      timestamp: Date.now()
    };

    // Armazenar sessão temporária (em produção, use Redis ou similar)
    const sessionId = crypto.randomUUID();
    await supabase
      .from('passkey_sessions')
      .insert({
        session_id: sessionId,
        data: sessionData,
        expires_at: new Date(Date.now() + 5 * 60 * 1000) // 5 minutos
      });

    // Opções de registro WebAuthn
    const registrationOptions = {
      publicKey: {
        challenge: Array.from(challenge),
        rp: {
          name: RP_NAME,
          id: RP_ID
        },
        user: {
          id: Array.from(userId),
          name: email,
          displayName: displayName || email.split('@')[0]
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred'
        },
        timeout: 60000,
        attestation: 'direct'
      },
      sessionId
    };

    res.json(registrationOptions);
  } catch (error) {
    console.error('Erro ao iniciar registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @route POST /api/auth/passkey/register/finish
 * @desc Finaliza o processo de registro WebAuthn
 * @access Public
 */
router.post('/register/finish', async (req, res) => {
  try {
    const { email, publicKey, credential } = req.body;

    if (!email || !publicKey || !credential) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Recuperar dados da sessão
    const { data: session } = await supabase
      .from('passkey_sessions')
      .select('data')
      .eq('session_id', req.body.sessionId)
      .single();

    if (!session) {
      return res.status(400).json({ error: 'Sessão inválida ou expirada' });
    }

    const sessionData = session.data;
    const expectedChallenge = Buffer.from(sessionData.challenge, 'base64');

    // Verificar dados do cliente
    const clientDataJSON = Buffer.from(credential.response.clientDataJSON);
    
    if (!webauthnUtils.verifyOrigin(clientDataJSON)) {
      return res.status(400).json({ error: 'Origem inválida' });
    }

    if (!webauthnUtils.verifyChallenge(clientDataJSON, expectedChallenge)) {
      return res.status(400).json({ error: 'Challenge inválido' });
    }

    // Criar usuário no banco
    const { data: newUser, error: userError } = await supabase
      .from('passkey_users')
      .insert({
        email,
        stellar_public_key: publicKey,
        created_at: new Date()
      })
      .select()
      .single();

    if (userError) {
      console.error('Erro ao criar usuário:', userError);
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }

    // Salvar credencial
    const { error: credError } = await supabase
      .from('passkey_credentials')
      .insert({
        user_id: newUser.id,
        credential_id: credential.id,
        public_key: Buffer.from(credential.response.attestationObject).toString('base64'),
        counter: 0,
        created_at: new Date()
      });

    if (credError) {
      console.error('Erro ao salvar credencial:', credError);
      return res.status(500).json({ error: 'Erro ao salvar credencial' });
    }

    // Limpar sessão temporária
    await supabase
      .from('passkey_sessions')
      .delete()
      .eq('session_id', req.body.sessionId);

    res.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        stellar_public_key: newUser.stellar_public_key
      }
    });
  } catch (error) {
    console.error('Erro ao finalizar registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @route POST /api/auth/passkey/login/begin
 * @desc Inicia o processo de login WebAuthn
 * @access Public
 */
router.post('/login/begin', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabase
      .from('passkey_users')
      .select('id, stellar_public_key')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Buscar credenciais do usuário
    const { data: credentials } = await supabase
      .from('passkey_credentials')
      .select('credential_id')
      .eq('user_id', user.id);

    // Gerar challenge
    const challenge = webauthnUtils.generateChallenge();

    // Salvar dados temporários da sessão
    const sessionData = {
      email,
      userId: user.id,
      publicKey: user.stellar_public_key,
      challenge: challenge.toString('base64'),
      timestamp: Date.now()
    };

    const sessionId = crypto.randomUUID();
    await supabase
      .from('passkey_sessions')
      .insert({
        session_id: sessionId,
        data: sessionData,
        expires_at: new Date(Date.now() + 5 * 60 * 1000)
      });

    // Opções de autenticação WebAuthn
    const authenticationOptions = {
      publicKey: {
        challenge: Array.from(challenge),
        timeout: 60000,
        rpId: RP_ID,
        allowCredentials: credentials.map(cred => ({
          id: Array.from(Buffer.from(cred.credential_id, 'base64')),
          type: 'public-key'
        })),
        userVerification: 'required'
      },
      sessionId
    };

    res.json(authenticationOptions);
  } catch (error) {
    console.error('Erro ao iniciar login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @route POST /api/auth/passkey/login/finish
 * @desc Finaliza o processo de login WebAuthn
 * @access Public
 */
router.post('/login/finish', async (req, res) => {
  try {
    const { email, assertion } = req.body;

    if (!email || !assertion) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Recuperar dados da sessão
    const { data: session } = await supabase
      .from('passkey_sessions')
      .select('data')
      .eq('session_id', req.body.sessionId)
      .single();

    if (!session) {
      return res.status(400).json({ error: 'Sessão inválida ou expirada' });
    }

    const sessionData = session.data;
    const expectedChallenge = Buffer.from(sessionData.challenge, 'base64');

    // Verificar dados do cliente
    const clientDataJSON = Buffer.from(assertion.response.clientDataJSON);
    
    if (!webauthnUtils.verifyOrigin(clientDataJSON)) {
      return res.status(400).json({ error: 'Origem inválida' });
    }

    if (!webauthnUtils.verifyChallenge(clientDataJSON, expectedChallenge)) {
      return res.status(400).json({ error: 'Challenge inválido' });
    }

    // Verificar credencial
    const { data: credential } = await supabase
      .from('passkey_credentials')
      .select('*')
      .eq('credential_id', assertion.id)
      .eq('user_id', sessionData.userId)
      .single();

    if (!credential) {
      return res.status(400).json({ error: 'Credencial inválida' });
    }

    // Atualizar contador (simplificado)
    await supabase
      .from('passkey_credentials')
      .update({ counter: credential.counter + 1 })
      .eq('id', credential.id);

    // Limpar sessão temporária
    await supabase
      .from('passkey_sessions')
      .delete()
      .eq('session_id', req.body.sessionId);

    res.json({
      success: true,
      publicKey: sessionData.publicKey,
      user: {
        id: sessionData.userId,
        email: sessionData.email,
        stellar_public_key: sessionData.publicKey
      }
    });
  } catch (error) {
    console.error('Erro ao finalizar login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;