import { Router } from 'express';
import { CallsController } from './calls.controller';

const router = Router();
const controller = new CallsController();

// GET /api/v1/calls - Get all calls with pagination
router.get('/', controller.getCalls.bind(controller));

// GET /api/v1/calls/:id - Get a specific call
router.get('/:id', controller.getCallById.bind(controller));

// GET /api/v1/calls/:id/audio - Get call audio
router.get('/:id/audio', controller.getCallAudio.bind(controller));

// POST /api/v1/calls/sync - Sync calls from Segurneo
router.post('/sync', controller.syncCalls.bind(controller));

// POST /api/v1/calls/webhook - Webhook endpoint for Segurneo Voice
router.post('/webhook', controller.webhookHandler.bind(controller));

export default router; 