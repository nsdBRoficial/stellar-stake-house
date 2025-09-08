const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const {
  validateStellarAddress,
  validatePagination,
  validateHistoryFilters,
  sanitizeInput,
  securityLogger
} = require('../middleware/validation');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Aplicar middlewares de segurança em todas as rotas
router.use(securityLogger);
router.use(sanitizeInput);

/**
 * @route GET /api/history/:address
 * @desc Obtém o histórico de transações de um usuário
 * @access Public
 */
router.get('/:address', validateStellarAddress, validatePagination, validateHistoryFilters, async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 10, offset = 0, type } = req.query;

    if (!address) {
      return res.status(400).json({ error: 'Endereço não fornecido' });
    }

    // Buscar o usuário pelo endereço Stellar
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('stellar_address', address)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Construir a consulta base
    let query = supabase
      .from('history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    // Filtrar por tipo, se fornecido
    if (type) {
      query = query.eq('type', type);
    }

    // Executar a consulta
    const { data: history, error: historyError, count } = await query;

    if (historyError) {
      console.error('Erro ao buscar histórico:', historyError);
      return res.status(500).json({ error: 'Erro ao buscar histórico' });
    }

    // Contar o total de registros para paginação
    const { count: totalCount, error: countError } = await supabase
      .from('history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Erro ao contar registros:', countError);
      // Não retornar erro, pois os dados já foram obtidos
    }

    return res.status(200).json({
      transactions: history,
      totalPages: Math.ceil((totalCount || 0) / parseInt(limit)),
      totalItems: totalCount || 0,
      pagination: {
        total: totalCount || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: (parseInt(offset) + history.length) < (totalCount || 0)
      }
    });
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;