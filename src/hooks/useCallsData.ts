import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { callsService } from '@/services/calls';
import { Database } from '@/types/database';

type ProcessedCall = Database['public']['Tables']['processed_calls']['Row'];
type CallAnalysis = Database['public']['Tables']['call_analysis']['Row'];

interface PaginatedResponse<T> {
  data: T[];
  count: number;
}

export function useCallsList(page = 1, limit = 10) {
  return useQuery<PaginatedResponse<ProcessedCall>>({
    queryKey: ['calls', page, limit],
    queryFn: () => callsService.listCalls(page, limit),
    placeholderData: (previousData) => previousData,
    refetchInterval: 30000, // Refresca cada 30 segundos
  });
}

export function useCallDetails(callId: string | undefined) {
  return useQuery<ProcessedCall | null>({
    queryKey: ['call', callId],
    queryFn: () => callId ? callsService.getCallDetails(callId) : null,
    enabled: !!callId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useCallAnalysis(callId: string | undefined) {
  return useQuery<CallAnalysis | null>({
    queryKey: ['analysis', callId],
    queryFn: () => callId ? callsService.getAnalysis(callId) : null,
    enabled: !!callId,
    staleTime: 1000 * 60 * 30, // 30 minutos
  });
}

// Hook para búsqueda infinita
export function useCallsSearch(searchQuery: string) {
  return useInfiniteQuery<PaginatedResponse<ProcessedCall>>({
    queryKey: ['calls-search', searchQuery],
    queryFn: ({ pageParam = 1 }) => 
      callsService.searchCalls(searchQuery),
    initialPageParam: 1,
    enabled: searchQuery.length > 0,
    getNextPageParam: (lastPage) => {
      return lastPage.data.length === 10 ? lastPage.data.length + 1 : undefined;
    },
  });
} 