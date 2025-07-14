import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function formatTicketType(type: string | undefined | null): string {
  if (!type) return 'Sin tipo';

  const typeMap: Record<string, string> = {
    'devolucion_recibos': 'Devolución de recibos',
    'anulacion_poliza': 'Anulación de póliza',
    'regularizacion_poliza': 'Regularización de póliza',
    'cambio_mediador': 'Cambio de mediador',
    'contrasenas': 'Contraseñas'
  };

  return typeMap[type.toLowerCase()] || type.replace('_', ' ');
}

/**
 * Formatea el tamaño de archivo en bytes a formato amigable
 */
export function formatFileSize(bytes: number | null): string {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}
