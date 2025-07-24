import React, { useState, useMemo } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { format, startOfToday, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { Call, CallListResponse } from '../types/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { Pagination } from '../components/ui/pagination';
import { Skeleton } from '../components/ui/skeleton';
import { CallDetailsDialog } from '../components/calls/CallDetailsDialog';
import { callService } from '../services/callService';

type FilterStatus = 'all' | 'completed' | 'failed' | 'in_progress';
type FilterPeriod = 'all' | 'today' | 'week' | 'month';

interface FilterState {
  status: FilterStatus;
  period: FilterPeriod;
  search: string;
}

function CallsPageMigrated() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    period: 'all',
    search: ''
  });
  
  // Estado del dialog
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Query para obtener las llamadas con paginación
  const { data, isLoading, error, refetch } = useQuery<CallListResponse>({
    queryKey: ['voice-calls-migrated', currentPage, filters],
    queryFn: () => callService.getCalls(currentPage, 10, {
      status: filters.status !== 'all' ? filters.status : undefined,
      searchQuery: filters.search || undefined
    }),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60, // 1 minuto
    refetchInterval: 1000 * 30 // 30 segundos
  });

  // Calls filtradas por periodo (filtro del frontend)
  const filteredCalls = useMemo(() => {
    if (!data?.calls) return [];
    
    return data.calls.filter(call => {
      // Filter by period (frontend filter)
      if (filters.period !== 'all') {
        const callDate = new Date(call.start_time_unix_secs * 1000);
        const today = startOfToday();
        
        switch (filters.period) {
          case 'today':
            if (callDate < today) return false;
            break;
          case 'week':
            if (callDate < subDays(today, 7)) return false;
            break;  
          case 'month':
            if (callDate < subDays(today, 30)) return false;
            break;
        }
      }
      
      return true;
    });
  }, [data?.calls, filters.period]);

  const handleViewDetails = async (call: Call) => {
    setLoadingDetails(true);
    try {
      const details = await callService.getConversationDetail(call.call_id);
      setSelectedCall(details);
      setDialogOpen(true);
    } catch (error) {
      console.error('❌ [MIGRATED] Error cargando detalles:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFiltersChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset a la primera página cuando cambian los filtros
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (unixSeconds: number) => {
    const date = new Date(unixSeconds * 1000);
    const today = startOfToday();
    const diffInDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return `Hoy, ${format(date, 'HH:mm')}`;
    } else if (diffInDays === 1) {
      return `Ayer, ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'dd MMM, HH:mm', { locale: es });
    }
  };

  const getStatusConfig = (call: Call) => {
    if (call.call_successful === 'success' && call.status === 'completed') {
      return { color: 'bg-black text-white', label: 'Completada' };
    } else if (call.call_successful === 'failed') {
      return { color: 'bg-black/20 text-black', label: 'Fallida' };
    } else {
      return { color: 'bg-black/10 text-black/70', label: 'En proceso' };
    }
  };

  // Stats por estado basadas en las llamadas actuales
  const statusStats = useMemo(() => {
    if (!filteredCalls) return { all: 0, completed: 0, failed: 0, in_progress: 0 };
    
    return {
      all: data?.total || 0,
      completed: filteredCalls.filter(c => c.call_successful === 'success' && c.status === 'completed').length,
      failed: filteredCalls.filter(c => c.call_successful === 'failed').length,
      in_progress: filteredCalls.filter(c => c.status !== 'completed').length
    };
  }, [filteredCalls, data?.total]);

  const totalPages = Math.ceil((data?.total || 0) / 10);

  if (isLoading && !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border border-black/20 border-t-black mx-auto mb-4"></div>
            <p className="text-black/60">Cargando llamadas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="border-black/10">
          <CardContent className="pt-6 text-center">
            <div className="text-black/60 mb-4">Error al cargar las llamadas</div>
            <p className="text-black/80 mb-4">{error.toString()}</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-black/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-black">🚀 Llamadas (Sistema Migrado)</h1>
            <p className="text-black/60">Gestión con arquitectura optimizada y análisis completo</p>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Stats Mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-black/10">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-black">{statusStats.all}</div>
                <div className="ml-auto text-black/40">📞</div>
              </div>
              <p className="text-xs text-black/60 font-medium">Total de llamadas</p>
            </CardContent>
          </Card>

          <Card className="border-black/10">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-black">{statusStats.completed}</div>
                <div className="ml-auto text-black/40">✅</div>
              </div>
              <p className="text-xs text-black/60 font-medium">Completadas</p>
            </CardContent>
          </Card>

          <Card className="border-black/10">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-black">{statusStats.failed}</div>
                <div className="ml-auto text-black/40">❌</div>
              </div>
              <p className="text-xs text-black/60 font-medium">Fallidas</p>
            </CardContent>
          </Card>

          <Card className="border-black/10">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="text-2xl font-bold text-black">{statusStats.in_progress}</div>
                <div className="ml-auto text-black/40">⏳</div>
              </div>
              <p className="text-xs text-black/60 font-medium">En proceso</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-black/10 mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/40 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar por ID de llamada o conversación..."
                    value={filters.search}
                    onChange={(e) => handleFiltersChange({ search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-black/10 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger 
                  value="all" 
                  onClick={() => handleFiltersChange({ status: 'all' })}
                  className="data-[state=active]:bg-black data-[state=active]:text-white"
                >
                  Todas ({statusStats.all})
                </TabsTrigger>
                <TabsTrigger 
                  value="completed"
                  onClick={() => handleFiltersChange({ status: 'completed' })}
                  className="data-[state=active]:bg-black data-[state=active]:text-white"
                >
                  Completadas ({statusStats.completed})
                </TabsTrigger>
                <TabsTrigger 
                  value="failed"
                  onClick={() => handleFiltersChange({ status: 'failed' })}
                  className="data-[state=active]:bg-black data-[state=active]:text-white"
                >
                  Fallidas ({statusStats.failed})
                </TabsTrigger>
                <TabsTrigger 
                  value="in_progress"
                  onClick={() => handleFiltersChange({ status: 'in_progress' })}
                  className="data-[state=active]:bg-black data-[state=active]:text-white"
                >
                  En proceso ({statusStats.in_progress})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center space-x-2 text-sm">
              <span className="text-black/60">Periodo:</span>
              <button
                onClick={() => handleFiltersChange({ period: 'all' })}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filters.period === 'all' 
                    ? 'bg-black text-white' 
                    : 'bg-black/5 text-black/70 hover:bg-black/10'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => handleFiltersChange({ period: 'today' })}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filters.period === 'today' 
                    ? 'bg-black text-white' 
                    : 'bg-black/5 text-black/70 hover:bg-black/10'
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => handleFiltersChange({ period: 'week' })}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filters.period === 'week' 
                    ? 'bg-black text-white' 
                    : 'bg-black/5 text-black/70 hover:bg-black/10'
                }`}
              >
                Esta semana
              </button>
              <button
                onClick={() => handleFiltersChange({ period: 'month' })}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filters.period === 'month' 
                    ? 'bg-black text-white' 
                    : 'bg-black/5 text-black/70 hover:bg-black/10'
                }`}
              >
                Este mes
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calls Table */}
      <Card className="border-black/10">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-black/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-black/70 uppercase tracking-wider">
                    Llamada
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-black/70 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-black/70 uppercase tracking-wider">
                    Duración
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-black/70 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-black/70 uppercase tracking-wider">
                    Mensajes
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-black/70 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading && !data ? (
                  // Skeleton loading
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-black/5">
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-6 w-20" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-4 w-12" />
                      </td>
                      <td className="px-6 py-4">
                        <Skeleton className="h-8 w-24" />
                      </td>
                    </tr>
                  ))
                ) : (
                  filteredCalls.map((call) => {
                    const statusConfig = getStatusConfig(call);
                    
                    return (
                      <tr key={call.call_id} className="border-b border-black/5 hover:bg-black/[0.02]">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-black">
                              {call.call_id.slice(0, 8)}...
                            </div>
                            <div className="text-xs text-black/60 font-mono">
                              {call.conversation_id.slice(0, 20)}...
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-black">
                          {formatDate(call.start_time_unix_secs)}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-black">
                          {formatDuration(call.call_duration_secs)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${statusConfig.color} border-0`}>
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-black">
                          <div className="flex space-x-2">
                            <span className="text-black/70">{call.metadata.agent_id || 'N/A'}A</span>
                            <span className="text-black/70">({call.transcript?.length || 0})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewDetails(call)}
                            disabled={loadingDetails}
                            className="text-black hover:text-black/70 disabled:opacity-50 text-sm font-medium"
                          >
                            {loadingDetails ? '...' : 'Ver detalles'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filteredCalls.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-black/40 mb-2 text-2xl">📞</div>
              <h3 className="text-lg font-medium text-black mb-2">No hay llamadas</h3>
              <p className="text-black/60">
                {filters.status !== 'all' || filters.search || filters.period !== 'all'
                  ? 'No se encontraron llamadas con los filtros actuales.'
                  : 'No hay llamadas disponibles en este momento.'}
              </p>
            </div>
          )}
        </CardContent>

        {/* Paginación */}
        {totalPages > 1 && (
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            <div className="flex items-center justify-between">
              <div className="text-sm text-black/60">
                Mostrando página {currentPage} de {totalPages} ({data?.total || 0} llamadas en total)
              </div>
              
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Dialog para mostrar detalles */}
      <CallDetailsDialog
        call={selectedCall || undefined}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedCall(null);
          }
        }}
      />
    </div>
  );
}

export default CallsPageMigrated; 