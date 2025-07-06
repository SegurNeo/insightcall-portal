import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

interface LogEntry extends winston.Logform.TransformableInfo {
  timestamp?: string;
}

// Formato personalizado para los logs
const customFormat = printf(({ level, message, timestamp, ...metadata }: LogEntry) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Crear el logger base
const baseLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    customFormat
  ),
  transports: [
    // Escribir logs de error y superiores a error.log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: combine(timestamp(), customFormat)
    }),
    // Escribir todos los logs a combined.log
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: combine(timestamp(), customFormat)
    })
  ]
});

// Si no estamos en producción, también log a la consola
if (process.env.NODE_ENV !== 'production') {
  baseLogger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp(),
      customFormat
    )
  }));
}

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