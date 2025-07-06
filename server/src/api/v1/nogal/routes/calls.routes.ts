import { Router } from 'express';
import { callsController } from '../controllers/calls.controller';

const router = Router();

/**
 * @route POST /api/v1/calls
 * @desc Create a new voice call record
 * @access Private (requires API key)
 * @body VoiceCallPayload
 * @returns VoiceCallResponse
 */
router.post('/', callsController.createCall.bind(callsController));

/**
 * @route GET /api/v1/calls/:callId
 * @desc Get voice call by Segurneo call ID
 * @access Private (requires API key)
 * @param callId - Segurneo call ID (UUID)
 * @returns VoiceCallResponse with call data
 */
router.get('/:callId', callsController.getCall.bind(callsController));

/**
 * @route GET /api/v1/calls
 * @desc Get recent voice calls for monitoring
 * @access Private (requires API key)
 * @query limit - Number of calls to return (1-100, default: 10)
 * @returns VoiceCallResponse with array of calls
 */
router.get('/', callsController.getCalls.bind(callsController));

/**
 * @route GET /api/v1/calls/stats
 * @desc Get voice call statistics
 * @access Private (requires API key)
 * @returns VoiceCallResponse with statistics
 */
router.get('/stats', callsController.getStats.bind(callsController));

/**
 * @route GET /api/v1/calls/health
 * @desc Health check endpoint
 * @access Public
 * @returns Health status
 */
router.get('/health', callsController.healthCheck.bind(callsController));

export default router; 