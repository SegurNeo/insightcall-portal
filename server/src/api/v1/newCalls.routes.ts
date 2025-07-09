// 🛤️ RUTAS NUEVAS DEL SISTEMA OPTIMIZADO
// Endpoints temporales para la nueva arquitectura

import { Router } from 'express';
import { newCallsController } from './newCalls.controller';

const router = Router();

/**
 * 🎯 RUTAS PRINCIPALES DEL NUEVO SISTEMA
 * Base: /api/v1/calls/new
 */

// 📥 WEBHOOK: Endpoint principal para recibir llamadas de Segurneo
router.post('/webhook', (req, res) => newCallsController.webhook(req, res));

// 📋 LISTADO: Obtener llamadas con paginación y filtros
router.get('/', (req, res) => newCallsController.getCalls(req, res));

// 🔍 DETALLE: Obtener una llamada específica por ID o conversation_id
router.get('/:id', (req, res) => newCallsController.getCall(req, res));

// 📊 ESTADÍSTICAS: Métricas del sistema
router.get('/system/stats', (req, res) => newCallsController.getStats(req, res));

// ❤️ HEALTH CHECK: Estado del sistema
router.get('/system/health', (req, res) => newCallsController.health(req, res));

// 🔧 TEMPORAL: Endpoint temporal de listado mientras se arregla el principal
router.get('/temp-list', async (req, res) => {
  try {
    console.log('🔧 [TEMP] Temporary listing endpoint');
    
    // Hacer consulta directa a Supabase desde las rutas
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NOGAL_SUPABASE_URL,
      process.env.NOGAL_SUPABASE_SERVICE_KEY
    );
    
    const { data: calls, count, error } = await supabase
      .from('calls')
      .select('*', { count: 'exact' })
      .order('received_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('🔧 [TEMP] Database error:', error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }

    console.log('🔧 [TEMP] Retrieved calls:', calls?.length);

    return res.json({
      calls: calls || [],
      pagination: {
        page: 1,
        limit: 20,
        total: count || 0,
        pages: Math.ceil((count || 0) / 20)
      }
    });
  } catch (error) {
    console.error('🔧 [TEMP] Error:', error);
    return res.status(500).json({
      error: 'Temporary endpoint error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 🧪 TEST: Crear llamada de prueba (solo desarrollo)
router.post('/system/test', (req, res) => newCallsController.test(req, res));

// 🔍 DEBUG: Endpoint temporal de debug
router.get('/debug', (req, res) => newCallsController.debugCalls(req, res));

export default router; 