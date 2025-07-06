import { Router } from 'express';
import nogalRoutes from './nogal';
import callsRoutes from './calls.routes';
import testAnalysisRoutes from './test-analysis.routes';

const router = Router();

// Existing routes (analysis system)
router.use('/calls', callsRoutes);
router.use('/test-analysis', testAnalysisRoutes);

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
      nogal: 'available'
    }
  });
});

export default router; 