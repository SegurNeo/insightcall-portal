import { Request, Response } from 'express';
import { validationService } from '../services/validation.service';
import { authService } from '../services/auth.service';
import { databaseService } from '../services/database.service';
import { VoiceCallPayload, VoiceCallResponse } from '../../../../types/voiceCalls.types';

export class CallsController {
  
  /**
   * POST /api/v1/calls
   * Main endpoint to receive voice call data from Segurneo
   */
  async createCall(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('[CallsController] Received voice call request');
      
      // Validation (authentication is now handled by middleware)
      const validationResult = validationService.validateVoiceCallPayload(req.body);
      if (!validationResult.isValid) {
        console.warn('[CallsController] Validation failed:', validationResult.errors);
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.errors.map(e => `${e.field}: ${e.message}`)
        } as VoiceCallResponse);
        return;
      }

      const payload = req.body as VoiceCallPayload;
      
      // Check for duplicates
      const existsResult = await databaseService.voiceCallExists(payload.call_id);
      if (existsResult.error) {
        console.error('[CallsController] Error checking duplicates:', existsResult.error);
        res.status(500).json({
          success: false,
          message: 'Database error',
          errors: [existsResult.error]
        } as VoiceCallResponse);
        return;
      }
      
      if (existsResult.exists) {
        console.warn('[CallsController] Duplicate call_id:', payload.call_id);
        res.status(409).json({
          success: false,
          message: 'Voice call already exists',
          call_id: payload.call_id,
          errors: ['A voice call with this call_id already exists']
        } as VoiceCallResponse);
        return;
      }
      
      // Save to database
      const saveResult = await databaseService.saveVoiceCall(payload);
      if (!saveResult.success) {
        console.error('[CallsController] Error saving voice call:', saveResult.error);
        res.status(500).json({
          success: false,
          message: 'Failed to save voice call',
          call_id: payload.call_id,
          errors: [saveResult.error || 'Unknown database error']
        } as VoiceCallResponse);
        return;
      }
      
      // Success response
      const processingTime = Date.now() - startTime;
      console.log(`[CallsController] Voice call saved successfully in ${processingTime}ms:`, {
        call_id: payload.call_id,
        nogal_internal_id: saveResult.nogalInternalId,
        status: payload.status,
        duration: payload.duration_seconds,
        cost: payload.cost
      });
      
      res.status(201).json({
        success: true,
        message: 'Voice call saved successfully',
        call_id: payload.call_id,
        nogal_internal_id: saveResult.nogalInternalId
      } as VoiceCallResponse);
      
    } catch (error) {
      console.error('[CallsController] Unexpected error processing voice call:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['An unexpected error occurred']
      } as VoiceCallResponse);
    }
  }
  
  /**
   * GET /api/v1/calls/:callId
   * Get voice call by Segurneo call ID
   */
  async getCall(req: Request, res: Response): Promise<void> {
    try {
      const { callId } = req.params;
      
      if (!callId) {
        res.status(400).json({
          success: false,
          message: 'Call ID is required',
          errors: ['callId parameter is required']
        } as VoiceCallResponse);
        return;
      }
      
      // Get voice call (authentication handled by middleware)
      const result = await databaseService.getVoiceCallBySegurneoId(callId);
      if (result.error) {
        const status = result.error === 'Voice call not found' ? 404 : 500;
        res.status(status).json({
          success: false,
          message: result.error,
          call_id: callId,
          errors: [result.error]
        } as VoiceCallResponse);
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Voice call retrieved successfully',
        call_id: callId,
        data: result.data
      });
      
    } catch (error) {
      console.error('[CallsController] Unexpected error getting voice call:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['An unexpected error occurred']
      } as VoiceCallResponse);
    }
  }
  
  /**
   * GET /api/v1/calls
   * Get recent voice calls for monitoring
   */
  async getCalls(req: Request, res: Response): Promise<void> {
    try {
      // Get limit from query params (authentication handled by middleware)
      const limit = parseInt(req.query.limit as string) || 10;
      if (limit < 1 || limit > 100) {
        res.status(400).json({
          success: false,
          message: 'Invalid limit parameter',
          errors: ['limit must be between 1 and 100']
        } as VoiceCallResponse);
        return;
      }
      
      // Get recent calls
      const result = await databaseService.getRecentVoiceCalls(limit);
      if (result.error) {
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve voice calls',
          errors: [result.error]
        } as VoiceCallResponse);
        return;
      }
      
      res.status(200).json({
        success: true,
        message: `Retrieved ${result.data?.length || 0} voice calls`,
        data: result.data
      });
      
    } catch (error) {
      console.error('[CallsController] Unexpected error getting voice calls:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['An unexpected error occurred']
      } as VoiceCallResponse);
    }
  }
  
  /**
   * GET /api/v1/calls/stats
   * Get voice call statistics
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      // Get stats (authentication handled by middleware)
      const result = await databaseService.getVoiceCallStats();
      if (result.error) {
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve statistics',
          errors: [result.error]
        } as VoiceCallResponse);
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Statistics retrieved successfully',
        data: result.data
      });
      
    } catch (error) {
      console.error('[CallsController] Unexpected error getting stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: ['An unexpected error occurred']
      } as VoiceCallResponse);
    }
  }
  
  /**
   * GET /api/v1/calls/health
   * Health check endpoint - NO authentication required
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Test database connection
      const dbResult = await databaseService.testConnection();
      
      // Debug info about environment variables
      const envInfo = {
        hasNogalApiKey: !!(process.env.NOGAL_API_KEY),
        nogalApiKeyLength: process.env.NOGAL_API_KEY?.length || 0,
        nodeEnv: process.env.NODE_ENV,
        authRequired: authService.isAuthRequired()
      };
      
      console.log('[HealthCheck] Environment debug info:', envInfo);
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: dbResult.connected ? 'connected' : 'disconnected',
        auth: authService.isAuthRequired() ? 'required' : 'optional',
        version: '1.0.0',
        debug: envInfo // Temporary debugging info
      };
      
      if (!dbResult.connected) {
        health.status = 'unhealthy';
        res.status(503).json({
          success: false,
          message: 'Service unhealthy',
          data: health,
          errors: [dbResult.error || 'Database connection failed']
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        message: 'Service healthy',
        data: health
      });
      
    } catch (error) {
      console.error('[CallsController] Unexpected error in health check:', error);
      res.status(500).json({
        success: false,
        message: 'Health check failed',
        errors: ['An unexpected error occurred']
      });
    }
  }
}

export const callsController = new CallsController(); 