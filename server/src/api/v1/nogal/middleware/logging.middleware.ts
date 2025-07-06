import { Request, Response, NextFunction } from 'express';

interface LogData {
  timestamp: string;
  method: string;
  url: string;
  ip: string;
  userAgent: string;
  requestId: string;
  contentType?: string;
  contentLength?: number;
  hasAuth: boolean;
  processingTime?: number;
  statusCode?: number;
  responseSize?: number;
  error?: string;
}

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  // Add request ID to request object for use in controllers
  (req as any).requestId = requestId;
  
  // Log incoming request
  const logData: LogData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    requestId,
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length') ? parseInt(req.get('Content-Length')!) : undefined,
    hasAuth: !!(req.headers.authorization || req.headers['x-api-key']),
  };
  
  console.log('[NogalAPI] Incoming request:', formatLogData(logData));
  
  // Override res.json to capture response data
  const originalJson = res.json;
  let responseData: any;
  
  res.json = function(data: any) {
    responseData = data;
    return originalJson.call(this, data);
  };
  
  // Log response when finished
  res.on('finish', () => {
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    const responseLogData: LogData = {
      ...logData,
      processingTime,
      statusCode: res.statusCode,
      responseSize: res.get('Content-Length') ? parseInt(res.get('Content-Length')!) : undefined,
    };
    
    // Add error info if response indicates failure
    if (res.statusCode >= 400 && responseData) {
      responseLogData.error = responseData.message || responseData.error || 'Unknown error';
    }
    
    // Log with appropriate level based on status code
    if (res.statusCode >= 500) {
      console.error('[NogalAPI] Server error:', formatLogData(responseLogData));
    } else if (res.statusCode >= 400) {
      console.warn('[NogalAPI] Client error:', formatLogData(responseLogData));
    } else {
      console.log('[NogalAPI] Request completed:', formatLogData(responseLogData));
    }
    
    // Log performance warning for slow requests
    if (processingTime > 5000) { // 5 seconds
      console.warn('[NogalAPI] Slow request detected:', {
        requestId,
        processingTime,
        url: req.url,
        method: req.method
      });
    }
  });
  
  // Handle errors
  res.on('error', (error) => {
    console.error('[NogalAPI] Response error:', {
      requestId,
      error: error.message,
      url: req.url,
      method: req.method
    });
  });
  
  next();
};

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatLogData(data: LogData): string {
  const parts: string[] = [];
  
  parts.push(`${data.method} ${data.url}`);
  parts.push(`ID:${data.requestId}`);
  parts.push(`IP:${data.ip}`);
  
  if (data.statusCode) {
    parts.push(`Status:${data.statusCode}`);
  }
  
  if (data.processingTime !== undefined) {
    parts.push(`Time:${data.processingTime}ms`);
  }
  
  if (data.contentLength) {
    parts.push(`ReqSize:${data.contentLength}b`);
  }
  
  if (data.responseSize) {
    parts.push(`ResSize:${data.responseSize}b`);
  }
  
  if (data.hasAuth) {
    parts.push('Auth:yes');
  }
  
  if (data.error) {
    parts.push(`Error:${data.error}`);
  }
  
  return parts.join(' | ');
}

// Export request ID getter for use in controllers
export const getRequestId = (req: Request): string => {
  return (req as any).requestId || 'unknown';
}; 