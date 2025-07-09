import { Router } from 'express';
import { callsController } from './calls/controllers/calls.controller';

const router = Router();

// Health check endpoint 
router.get('/health', callsController.healthCheck.bind(callsController));

// GET /api/v1/calls - Get all calls with pagination using CallDataService
router.get('/', callsController.getCalls.bind(callsController));

// GET /api/v1/calls/:id - Get a specific call using CallDataService
router.get('/:id', callsController.getCallById.bind(callsController));

// POST /api/v1/calls/analyze - Analyze call transcript
router.post('/analyze', callsController.analyzeCall.bind(callsController));

export default router; 