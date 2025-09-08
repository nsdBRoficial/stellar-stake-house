const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const StellarSdk = require('stellar-sdk');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * @route POST /api/auth/verify
 * @desc Verifica a assinatura de uma mensagem para autenticar o usuário
 * @access Public
 */
router.post('/verify', async (req, res) => {
  try {
    const { publicKey, signature, message, simpleAuth } = req.body;

    if (!publicKey || !message) {
      return res.status(400).json({ error: 'Dados de autenticação incompletos' });
    }

    // Verificar se é uma autenticação simples (apenas com chave pública)
    if (simpleAuth) {
      // Validar formato da chave pública Stellar
      try {
        StellarSdk.Keypair.fromPublicKey(publicKey);
      } catch (error) {
        return res.status(400).json({ error: 'Chave pública Stellar inválida' });
      }
    } else {
      // Verificação completa com assinatura
      if (!signature) {
        return res.status(400).json({ error: 'Assinatura necessária para autenticação completa' });
      }

      // Verificar a assinatura usando o Stellar SDK
      const keyPair = StellarSdk.Keypair.fromPublicKey(publicKey);
      const messageBuffer = Buffer.from(message, 'utf8');
      const signatureBuffer = Buffer.from(signature, 'base64');

      let isValid = false;
      try {
        isValid = keyPair.verify(messageBuffer, signatureBuffer);
      } catch (error) {
        console.error('Erro ao verificar assinatura:', error);
        return res.status(400).json({ error: 'Assinatura inválida' });
      }

      if (!isValid) {
        return res.status(401).json({ error: 'Assinatura inválida' });
      }
    }

    // Verificar se o usuário já existe no Supabase
    let { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('stellar_address', publicKey)
      .single();

    // Para autenticação simples, não precisamos criar usuário no banco
    // Vamos apenas retornar os dados da chave pública
    if (simpleAuth) {
      // Retornar dados básicos sem criar no banco
      const userData = {
        stellar_address: publicKey,
        created_at: new Date()
      };
      
      // Retornar dados do usuário
      return res.status(200).json({
        success: true,
        user: userData
      });
    }

    // Para autenticação completa com assinatura, criar usuário no banco
    if (fetchError || !user) {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{ stellar_address: publicKey, created_at: new Date() }])
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao criar usuário:', insertError);
        return res.status(500).json({ error: 'Erro ao criar usuário' });
      }

      user = newUser;
    }

    // Criar uma sessão para o usuário
    const session = {
      user_id: user.id,
      stellar_address: publicKey,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
    };

    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert([session])
      .select()
      .single();

    if (sessionError) {
      console.error('Erro ao criar sessão:', sessionError);
      return res.status(500).json({ error: 'Erro ao criar sessão' });
    }

    // Retornar dados do usuário e token de sessão
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        stellar_address: user.stellar_address,
        created_at: user.created_at
      },
      session: {
        id: sessionData.id,
        expires_at: sessionData.expires_at
      }
    });
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Encerra a sessão do usuário
 * @access Private
 */
router.post('/logout', async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'ID de sessão não fornecido' });
    }

    // Remover a sessão do banco de dados
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', session_id);

    if (error) {
      console.error('Erro ao encerrar sessão:', error);
      return res.status(500).json({ error: 'Erro ao encerrar sessão' });
    }

    return res.status(200).json({ message: 'Sessão encerrada com sucesso' });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @route GET /api/auth/session
 * @desc Verifica se a sessão do usuário é válida
 * @access Public
 */
router.get('/session', async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: 'ID de sessão não fornecido' });
    }

    // Buscar a sessão no banco de dados
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*, users(*)')
      .eq('id', session_id)
      .single();

    if (error || !session) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada' });
    }

    // Verificar se a sessão expirou
    if (new Date(session.expires_at) < new Date()) {
      // Remover a sessão expirada
      await supabase
        .from('sessions')
        .delete()
        .eq('id', session_id);

      return res.status(401).json({ error: 'Sessão expirada' });
    }

    // Retornar dados do usuário
    return res.status(200).json({
      user: {
        id: session.users.id,
        stellar_address: session.users.stellar_address,
        created_at: session.users.created_at
      },
      session: {
        id: session.id,
        expires_at: session.expires_at
      }
    });
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;