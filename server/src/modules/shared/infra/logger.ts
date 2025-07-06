// Simple console logger implementation (no winston dependency)

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

class SimpleLogger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: LogLevel, message: string, metadata?: any): string {
    const timestamp = new Date().toISOString();
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (metadata && Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  }

  error(message: string, metadata?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, metadata));
    }
  }

  warn(message: string, metadata?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, metadata));
    }
  }

  info(message: string, metadata?: any): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, metadata));
    }
  }

  debug(message: string, metadata?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, metadata));
    }
  }
}

const baseLogger = new SimpleLogger();

export interface LogMetadata {
  [key: string]: any;
}

export class Logger {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  private formatMessage(message: string): string {
    return this.context ? `[${this.context}] ${message}` : message;
  }

  error(message: string, metadata?: LogMetadata): void {
    baseLogger.error(this.formatMessage(message), metadata);
  }

  warn(message: string, metadata?: LogMetadata): void {
    baseLogger.warn(this.formatMessage(message), metadata);
  }

  info(message: string, metadata?: LogMetadata): void {
    baseLogger.info(this.formatMessage(message), metadata);
  }

  debug(message: string, metadata?: LogMetadata): void {
    baseLogger.debug(this.formatMessage(message), metadata);
  }

  // Método para crear una nueva instancia con un contexto específico
  withContext(context: string): Logger {
    return new Logger(context);
  }
}

// Exportar una instancia por defecto
export const logger = new Logger(); 