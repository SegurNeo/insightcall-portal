import express from 'express';
import cors from 'cors';
// import { callProcessingService } from './services/call_processing_service'; // ELIMINADO - sistema legacy
import { ticketService } from './services/ticketService';
import config from './config/index';
import { supabase } from './lib/supabase';
import apiV1Routes from './api/v1';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

interface CallParams {
  externalCallId: string;
}

// Health check endpoint
const healthCheck: express.RequestHandler = (_req, res) => {
  res.json({
    status: 'OK',
    message: 'Nogal Voice API is healthy',
    timestamp: new Date().toISOString()
  });
};

// Process call endpoint - DESHABILITADO (sistema legacy eliminado)
const processCall: express.RequestHandler<CallParams> = async (req, res, next) => {
  res.status(410).json({
    error: 'Endpoint discontinued',
    message: 'Este endpoint ha sido eliminado. Usar /api/v1/calls/webhook-new'
  });
};

// Get call details endpoint
const getCallDetails: express.RequestHandler<CallParams> = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('processed_calls')
      .select('*')
      .eq('segurneo_external_call_id', req.params.externalCallId)
      .single();

    if (error) throw error;
    if (!data) {
      res.status(404).json({
        message: 'Call not found'
      });
      return;
    }

    res.json({
      message: 'Call details retrieved successfully',
      data
    });
  } catch (error: unknown) {
    next(error);
  }
};

// Get tickets for a call endpoint
const getCallTickets: express.RequestHandler<CallParams> = async (req, res, next) => {
  try {
    const { data: call, error: callError } = await supabase
      .from('processed_calls')
      .select('id')
      .eq('segurneo_external_call_id', req.params.externalCallId)
      .single();

    if (callError || !call) {
      res.status(404).json({
        message: 'Call not found'
      });
      return;
    }

    const tickets = await ticketService.getTicketsByConversationId(call.id);
    res.json({
      message: 'Tickets retrieved successfully',
      data: tickets
    });
  } catch (error: unknown) {
    next(error);
  }
};

// API v1 Routes
app.use('/api/v1', apiV1Routes);
console.log('API v1 montada en /api/v1');
console.log('Rutas disponibles:');
console.log('  - /api/v1/calls (análisis IA)');
console.log('  - /api/v1/test-analysis (testing)');
console.log('  - /api/v1/nogal/calls (endpoint Nogal)');
console.log('  - /api/v1/health (health check)');

// Legacy Routes
app.get('/health', healthCheck);
app.post('/api/calls/process/:externalCallId', processCall);
app.get('/api/calls/:externalCallId', getCallDetails);
app.get('/api/calls/:externalCallId/tickets', getCallTickets);

// Error handling middleware
const errorHandler: express.ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('Error detallado:', {
    message: err.message,
    stack: err.stack,
    details: err
  });
  const message = err instanceof Error ? err.message : 'An unknown error occurred';
  res.status(500).json({
    message: 'Internal server error',
    error: message
  });
};

// Error handler must be last
app.use(errorHandler);

// Start the server
const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log('Environment:', config.nodeEnv);
  
  // Dynamic API base URL based on environment
  const apiBaseUrl = config.nodeEnv === 'production' 
    ? `https://insightcall-portal.onrender.com/api/v1`
    : `http://localhost:${config.port}/api/v1`;
  
  console.log('API base URL:', apiBaseUrl);
}); 