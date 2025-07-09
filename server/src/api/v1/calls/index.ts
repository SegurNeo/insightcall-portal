import { Router } from 'express';
import callsRoutes from './routes/calls.routes';

const router = Router();

// Mount routes
router.use('/', callsRoutes);

export default router;

// Export services for testing or external use
export { callsController } from './controllers/calls.controller'; 