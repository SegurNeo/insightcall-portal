import { Router } from 'express';
import nogalRoutes from './nogal';
import callsRoutes from './calls.routes';
import newCallsRoutes from './newCalls.routes';
import testAnalysisRoutes from './test-analysis.routes';
import translationRoutes from './translation.routes';
import crearTicketRoutes from './crear-ticket.routes';

const router = Router();

// Existing routes (analysis system)
router.use('/calls', callsRoutes);

// NEW CALLS SYSTEM - Sistema optimizado para webhooks de Segurneo
router.use('/calls/new', newCallsRoutes);

router.use('/test-analysis', testAnalysisRoutes);

// Translation service
router.use('/translation', translationRoutes);

// Ticket creation service
router.use('/crear-ticket', crearTicketRoutes);

// New Nogal module routes
router.use('/nogal', nogalRoutes);

// Health check for the entire API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API v1 is healthy',
    timestamp: new Date().toISOString(),
    services: {
      analysis: 'available',
      translation: 'available',
      ticketCreation: 'available',
      nogal: 'available',
      newCalls: 'available'
    }
  });
});

export default router; 