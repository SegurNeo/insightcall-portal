import { Router } from 'express';
import { callsController } from '../controllers/calls.controller';

const router = Router();

/**
 * @route GET /api/v1/calls-v2/health
 * @desc Health check endpoint for calls module
 * @access Public
 */
router.get('/health', callsController.healthCheck.bind(callsController));

/**
 * @route POST /api/v1/calls-v2/analyze
 * @desc Analyze call transcript
 * @access Private
 */
router.post('/analyze', callsController.analyzeCall.bind(callsController));

/**
 * @route GET /api/v1/calls-v2/:id
 * @desc Get specific call by ID
 * @access Private
 */
router.get('/:id', callsController.getCallById.bind(callsController));

/**
 * @route GET /api/v1/calls-v2
 * @desc Get calls list
 * @access Private
 */
router.get('/', callsController.getCalls.bind(callsController));

export default router; 