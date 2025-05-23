import express from 'express';
import cors from 'cors';
import { callProcessingService } from './services/call_processing_service';
import { ticketService } from './services/ticketService';
import config from './config';
import { supabase } from './lib/supabase';
import callsRoutes from './api/v1/calls.routes';

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

// Process call endpoint
const processCall: express.RequestHandler<CallParams> = async (req, res, next) => {
  try {
    const { externalCallId } = req.params;
    const result = await callProcessingService.processCallByExternalId(externalCallId);
    res.json({
      message: 'Call processed successfully',
      data: result
    });
  } catch (error: unknown) {
    next(error);
  }
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
app.use('/api/v1/calls', callsRoutes);
console.log('Rutas montadas en /api/v1/calls');

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
  console.log('API base URL:', `http://localhost:${config.port}/api/v1`);
}); 