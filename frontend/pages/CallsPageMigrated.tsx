import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, Clock, Phone, MessageCircle } from 'lucide-react';
import { format, startOfToday, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useVoiceCallsReal } from '../hooks/useVoiceCallsReal';
import { Call } from '../types/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';

type FilterStatus = 'all' | 'completed' | 'failed' | 'in_progress';

interface FilterState {
  status: FilterStatus;
  period: 'today' | 'week' | 'month' | 'all';
  search: string;
}

function CallsPageMigrated() {
  const { calls, stats, isLoading, error, lastUpdated, refresh } = useVoiceCallsReal();
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    period: 'all',
    search: ''
  });
  
  // Estado del sidebar - simplificado por ahora
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Calls filtradas
  const filteredCalls = useMemo(() => {
    if (!calls) return [];
    
    return calls.filter(call => {
      // Filter by status
      if (filters.status !== 'all') {
        if (filters.status === 'completed' && (call.call_successful !== 'success' || call.status !== 'completed')) return false;
        if (filters.status === 'failed' && call.call_successful !== 'failed') return false;
        if (filters.status === 'in_progress' && call.status === 'completed') return false;
      }
      
      // Filter by period
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
      
      // Filter by search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          call.call_id.toLowerCase().includes(searchLower) ||
          call.conversation_id.toLowerCase().includes(searchLower) ||
          (call.metadata.agent_id && call.metadata.agent_id.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    });
  }, [calls, filters]);

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
      return { color: 'bg-green-600 text-white', label: 'Completada' };
    } else if (call.call_successful === 'failed') {
      return { color: 'bg-red-600 text-white', label: 'Fallida' };
    } else {
      return { color: 'bg-yellow-600 text-white', label: 'En proceso' };
    }
  };

  // Stats por estado
  const statusStats = useMemo(() => {
    if (!calls) return { all: 0, completed: 0, failed: 0, in_progress: 0 };
    
    return {
      all: calls.length,
      completed: calls.filter(c => c.call_successful === 'success' && c.status === 'completed').length,
      failed: calls.filter(c => c.call_successful === 'failed').length,
      in_progress: calls.filter(c => c.status !== 'completed').length
    };
  }, [calls]);

  const getTranscriptStats = (call: Call) => {
    const transcriptLength = call.transcript?.length || 0;
    return {
      total: transcriptLength,
      hasTranscript: transcriptLength > 0
    };
  };

  if (isLoading && !calls) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border border-black/20 border-t-black mx-auto mb-4"></div>
            <p className="text-black/60">🚀 Cargando llamadas con sistema migrado...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center">
            <div className="text-red-600 mb-4">❌ Error al cargar las llamadas (sistema migrado)</div>
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
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
            onClick={refresh}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Stats Mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Total Llamadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Duración Promedio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">
                {stats?.avgDuration ? formatDuration(stats.avgDuration) : '0:00'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
                <MessageCircle className="h-4 w-4 mr-2" />
                Con Análisis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-800">
                {calls ? calls.filter(c => c.transcript && c.transcript.length > 0).length : 0}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200 bg-gray-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Última Actualización</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-800">
                {lastUpdated ? format(lastUpdated, 'HH:mm:ss') : 'Nunca'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-black/10 mb-6">
        <CardHeader>
          <CardTitle className="text-lg text-black">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Status Tabs */}
          <div>
            <div className="text-sm font-medium text-black/70 mb-3">Estado</div>
            <Tabs value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as FilterStatus }))}>
              <TabsList className="bg-black/5">
                <TabsTrigger value="all" className="data-[state=active]:bg-black data-[state=active]:text-white text-black/70">
                  Todas ({statusStats.all})
                </TabsTrigger>
                <TabsTrigger value="completed" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-black/70">
                  Completadas ({statusStats.completed})
                </TabsTrigger>
                <TabsTrigger value="failed" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-black/70">
                  Fallidas ({statusStats.failed})
                </TabsTrigger>
                <TabsTrigger value="in_progress" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white text-black/70">
                  En proceso ({statusStats.in_progress})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Separator className="bg-black/10" />
          
          {/* Period and Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-black/70 block mb-2">Período</label>
              <select
                value={filters.period}
                onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value as any }))}
                className="w-full px-3 py-2 border border-black/20 rounded-md bg-white text-black focus:ring-2 focus:ring-black/20 focus:border-black"
              >
                <option value="all">Todas</option>
                <option value="today">Hoy</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-black/70 block mb-2">Búsqueda</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black/40" />
                <input
                  type="text"
                  placeholder="ID, conversación, agente..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-black/20 rounded-md bg-white text-black placeholder:text-black/40 focus:ring-2 focus:ring-black/20 focus:border-black"
                />
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-black/10">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="px-6 py-4 text-left text-xs font-medium text-black/70 uppercase tracking-wider">
                    ID & Conversación
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-black/70 uppercase tracking-wider">
                    Agente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-black/70 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-black/70 uppercase tracking-wider">
                    Duración
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-black/70 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-black/70 uppercase tracking-wider">
                    Análisis
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-black/70 uppercase tracking-wider">
                    Ticket
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCalls.map((call) => {
                  const statusConfig = getStatusConfig(call);
                  const transcriptStats = getTranscriptStats(call);
                  
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
                        <div>
                          <div className="font-medium">{call.metadata.agent_name}</div>
                          {call.metadata.agent_id && (
                            <div className="text-xs text-black/60">{call.metadata.agent_id}</div>
                          )}
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
                        {transcriptStats.hasTranscript ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-green-600">✅</span>
                            <span>{transcriptStats.total} msgs</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Sin análisis</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-black">
                        {call.ticket ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-600">🎫</span>
                            <span className="text-xs">{call.ticket.type}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredCalls.length === 0 && (
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
      </Card>

      {/* Información del Sistema Migrado */}
      <Card className="border-green-200 bg-green-50 mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <div className="text-green-600 text-2xl">🚀</div>
            <div>
              <h3 className="font-semibold text-green-800">Sistema Migrado Activo</h3>
              <p className="text-green-700 text-sm">
                Arquitectura optimizada • Análisis completo • Sin duplicados • Una sola tabla
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CallsPageMigrated; 