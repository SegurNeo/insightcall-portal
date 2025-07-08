import { Router } from 'express';
import { TranslationController } from './translation.controller';

const router = Router();
const controller = new TranslationController();

// POST /api/v1/translation/translate - Traducir texto
router.post('/translate', controller.translateText.bind(controller));

// GET /api/v1/translation/health - Health check
router.get('/health', controller.healthCheck.bind(controller));

export default router;