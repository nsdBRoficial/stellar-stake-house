const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { takeSnapshot } = require('../services/snapshotService');

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * @route POST /api/snapshots/execute
 * @desc Executa um snapshot manual dos saldos de staking
 * @access Private (Admin)
 */
router.post('/execute', async (req, res) => {
  try {
    console.log('Executando snapshot manual...');
    
    const result = await takeSnapshot();
    
    return res.status(200).json({
      success: true,
      message: 'Snapshot executado com sucesso',
      snapshot_count: result.snapshot_count,
      snapshot_date: result.snapshot_date
    });
  } catch (error) {
    console.error('Erro ao executar snapshot:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erro ao executar snapshot',
      details: error.message 
    });
  }
});

/**
 * @route GET /api/snapshots/history
 * @desc Obtém o histórico de snapshots
 * @access Private (Admin)
 */
router.get('/history', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    // Buscar snapshots com informações do usuário
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('snapshots')
      .select(`
        *,
        users!inner(stellar_address)
      `)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (snapshotsError) {
      console.error('Erro ao buscar snapshots:', snapshotsError);
      return res.status(500).json({ error: 'Erro ao buscar histórico de snapshots' });
    }

    // Contar o total de snapshots
    const { count: totalCount, error: countError } = await supabase
      .from('snapshots')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Erro ao contar snapshots:', countError);
    }

    return res.status(200).json({
      snapshots: snapshots,
      totalPages: Math.ceil((totalCount || 0) / parseInt(limit)),
      totalItems: totalCount || 0,
      pagination: {
        total: totalCount || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: (parseInt(offset) + snapshots.length) < (totalCount || 0)
      }
    });
  } catch (error) {
    console.error('Erro ao obter histórico de snapshots:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * @route GET /api/snapshots/latest
 * @desc Obtém informações do último snapshot
 * @access Public
 */
router.get('/latest', async (req, res) => {
  try {
    // Buscar o último snapshot
    const { data: latestSnapshot, error: snapshotError } = await supabase
      .from('snapshots')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (snapshotError && snapshotError.code !== 'PGRST116') {
      console.error('Erro ao buscar último snapshot:', snapshotError);
      return res.status(500).json({ error: 'Erro ao buscar último snapshot' });
    }

    // Calcular próximo snapshot (simplificado - próxima meia-noite)
    const now = new Date();
    const nextSnapshot = new Date(now);
    nextSnapshot.setDate(nextSnapshot.getDate() + 1);
    nextSnapshot.setHours(0, 0, 0, 0);

    return res.status(200).json({
      last_snapshot: latestSnapshot ? latestSnapshot.created_at : null,
      next_snapshot: nextSnapshot.toISOString(),
      snapshot_interval: '24 horas'
    });
  } catch (error) {
    console.error('Erro ao obter informações do snapshot:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;