// 🧪 HOOK TEMPORAL PARA PROBAR MIGRACIÓN
// Hook simple que usa el callService migrado

import { useState, useEffect } from 'react';
import { callService } from '@/services/callService';
import { CallListResponse } from '@/types/api';

interface UseCallsNewReturn {
  data: CallListResponse | null;
  isLoading: boolean;
  error: string | null;
  testBackend: () => Promise<void>;
}

export function useCallsNew(): UseCallsNewReturn {
  const [data, setData] = useState<CallListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testBackend = async () => {
    console.log('🧪 [TEST] Probando nuevo backend...');
    setIsLoading(true);
    setError(null);
    
    try {
      // Probar el nuevo servicio migrado
      const result = await callService.getCalls(1, 10);
      
      console.log('🧪 [TEST] Resultado:', result);
      setData(result);
      
    } catch (err) {
      console.error('🧪 [TEST] Error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    testBackend
  };
} 