import { Router } from 'express';
import { testAnalysisController } from './test-analysis.controller';

const router = Router();

// Rutas para testing de análisis sin crear tickets reales
router.post('/full-analysis', testAnalysisController.testFullAnalysis.bind(testAnalysisController));
router.post('/classify-tickets', testAnalysisController.testTicketClassification.bind(testAnalysisController));
router.get('/ticket-definitions', testAnalysisController.getTicketDefinitions.bind(testAnalysisController));

export default router; 