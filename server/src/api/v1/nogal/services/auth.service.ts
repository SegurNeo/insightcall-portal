import config from '../../../../config';

export class AuthService {
  
  /**
   * Validates API key from Authorization header
   * Supports both "Bearer token" and "token" formats
   */
  validateApiKey(authHeader: string | undefined): { isValid: boolean; error?: string } {
    try {
      if (!authHeader) {
        return { isValid: false, error: 'Authorization header is required' };
      }
      
      // Extract token from header
      let token: string;
      
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      } else if (authHeader.startsWith('bearer ')) {
        token = authHeader.replace('bearer ', '');
      } else {
        // Assume direct token
        token = authHeader;
      }
      
      if (!token || token.trim().length === 0) {
        return { isValid: false, error: 'API key cannot be empty' };
      }
      
      // Get expected API key from config
      const expectedApiKey = (config as any).nogalApiKey;
      
      if (!expectedApiKey) {
        console.warn('[AuthService] NOGAL_API_KEY not configured - allowing all requests');
        return { isValid: true }; // Allow if not configured (dev mode)
      }
      
      // Compare tokens
      if (token !== expectedApiKey) {
        return { isValid: false, error: 'Invalid API key' };
      }
      
      return { isValid: true };
      
    } catch (error) {
      console.error('[AuthService] Error validating API key:', error);
      return { isValid: false, error: 'Authentication error' };
    }
  }
  
  /**
   * Validates API key from X-API-Key header (alternative method)
   */
  validateApiKeyFromCustomHeader(apiKeyHeader: string | undefined): { isValid: boolean; error?: string } {
    if (!apiKeyHeader) {
      return { isValid: false, error: 'X-API-Key header is required' };
    }
    
    return this.validateApiKey(apiKeyHeader);
  }
  
  /**
   * Check if API key authentication is required
   * In development, it might be disabled
   */
  isAuthRequired(): boolean {
    return config.nodeEnv === 'production' || !!(config as any).nogalApiKey;
  }
  
  /**
   * Generate a secure API key (for setup purposes)
   */
  generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'nogal_';
    
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }
}

export const authService = new AuthService(); 