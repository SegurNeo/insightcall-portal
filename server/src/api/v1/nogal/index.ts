import { Router } from 'express';
import { loggingMiddleware } from './middleware/logging.middleware';
import callsRoutes from './routes/calls.routes';

const router = Router();

// Apply logging middleware to all Nogal routes
router.use(loggingMiddleware);

// Mount routes
router.use('/calls', callsRoutes);

export default router;

// Export services for testing or external use
export { validationService } from './services/validation.service';
export { authService } from './services/auth.service';
export { databaseService } from './services/database.service';
export { callsController } from './controllers/calls.controller'; 