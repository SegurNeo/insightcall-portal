import { useState, useEffect, useCallback } from 'react';
import { callService } from '@/services/callService';
import { Call } from '@/types/api';

interface VoiceCallsStats {
  total: number;
  avgDuration: number;
}

interface UseVoiceCallsRealReturn {
  calls: Call[] | null;
  stats: VoiceCallsStats | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

export function useVoiceCallsReal(limit: number = 50, autoRefresh: boolean = true): UseVoiceCallsRealReturn {
  const [calls, setCalls] = useState<Call[] | null>(null);
  const [stats, setStats] = useState<VoiceCallsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🚀 [MIGRATED] Actualizando datos con nuevo sistema...');
      
      // Usar el nuevo callService migrado
      const callsResponse = await callService.getCalls(1, limit);
      const callsData = callsResponse.calls;
      
      // Calcular estadísticas en el frontend
      const statsData: VoiceCallsStats = {
        total: callsResponse.total,
        avgDuration: callsData.length > 0 
          ? Math.round(callsData.reduce((acc, call) => acc + call.call_duration_secs, 0) / callsData.length)
          : 0
      };

      setCalls(callsData);
      setStats(statsData);
      setLastUpdated(new Date());
      
      console.log('✅ [MIGRATED] Datos actualizados:', {
        llamadas: callsData.length,
        total: statsData.total,
        promedioDuracion: statsData.avgDuration
      });
      
    } catch (err) {
      console.error('❌ [MIGRATED] Error actualizando datos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Carga inicial
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh cada 30 segundos si está habilitado
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh de llamadas...');
      fetchData();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [fetchData, autoRefresh]);

  return {
    calls,
    stats,
    isLoading,
    error,
    lastUpdated,
    refresh
  };
} 