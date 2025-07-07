import { useState, useEffect, useCallback } from 'react';
import { voiceCallsRealDataService, VoiceCallReal, VoiceCallsStats } from '@/services/voiceCallsRealDataService';

interface UseVoiceCallsRealReturn {
  calls: VoiceCallReal[] | null;
  stats: VoiceCallsStats | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
}

export function useVoiceCallsReal(limit: number = 50, autoRefresh: boolean = true): UseVoiceCallsRealReturn {
  const [calls, setCalls] = useState<VoiceCallReal[] | null>(null);
  const [stats, setStats] = useState<VoiceCallsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Actualizando datos de llamadas...');
      
      // Obtener llamadas y estadísticas en paralelo
      const [callsData, statsData] = await Promise.all([
        voiceCallsRealDataService.getRecentVoiceCalls(limit),
        voiceCallsRealDataService.getVoiceCallsStats()
      ]);

      setCalls(callsData);
      setStats(statsData);
      setLastUpdated(new Date());
      
      console.log('✅ Datos actualizados:', {
        llamadas: callsData.length,
        total: statsData.total,
        promedioDuracion: statsData.avgDuration
      });
      
    } catch (err) {
      console.error('❌ Error actualizando datos:', err);
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