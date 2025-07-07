import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { VoiceCallResponse } from '../../../../types/voiceCalls.types';

/**
 * Authentication middleware for Nogal API routes
 * Excludes health check endpoint from authentication
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip authentication for health check endpoint
  if (req.path === '/health' || req.url === '/health') {
    console.log('[AuthMiddleware] Skipping auth for health check');
    return next();
  }

  console.log('[AuthMiddleware] Validating API key for:', req.path);

  // Validate API key
  const authResult = authService.validateApiKey(req.headers.authorization);
  
  if (!authResult.isValid) {
    console.warn('[AuthMiddleware] Authentication failed:', authResult.error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      errors: [authResult.error || 'Invalid API key']
    } as VoiceCallResponse);
    return;
  }

  console.log('[AuthMiddleware] Authentication successful');
  next();
}; 