import React, { useState, useMemo } from 'react';
import { format, startOfToday, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Search, 
  RefreshCw, 
  Filter, 
  Download, 
  Phone, 
  Clock, 
  Users, 
  TrendingUp, 
  Eye, 
  Calendar, 
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  MessageSquare
} from 'lucide-react';

import { useVoiceCallsReal } from '../hooks/useVoiceCallsReal';
import { CallDetailsSidebar } from '../components/calls/CallDetailsSidebar';
import { voiceCallsRealDataService, VoiceCallDetailsClean } from '../services/voiceCallsRealDataService';
import { VoiceCallReal } from '../services/voiceCallsRealDataService';
import DashboardLayout from '@/components/layout/DashboardLayout';

// shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';

type FilterStatus = 'all' | 'completed' | 'failed' | 'in_progress';
type FilterPeriod = 'all' | 'today' | 'week' | 'month';

interface FilterState {
  status: FilterStatus;
  period: FilterPeriod;
  search: string;
}

export default function CallsPage() {
  const { toast } = useToast();
  const { calls, stats, isLoading, error, lastUpdated, refresh } = useVoiceCallsReal();
  
  // Estados
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    period: 'all',
    search: ''
  });
  const [selectedCall, setSelectedCall] = useState<VoiceCallDetailsClean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Filtros computados
  const filteredCalls = useMemo(() => {
    if (!calls) return [];
    
    return calls.filter(call => {
      // Filtro por estado
      if (filters.status !== 'all') {
        if (filters.status === 'completed' && (!call.call_successful || call.status !== 'completed')) return false;
        if (filters.status === 'failed' && call.call_successful) return false;
        if (filters.status === 'in_progress' && call.status === 'completed') return false;
      }
      
      // Filtro por período
      if (filters.period !== 'all') {
        const callDate = new Date(call.start_time);
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
      
      // Filtro por búsqueda
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          call.segurneo_call_id.toLowerCase().includes(searchLower) ||
          call.conversation_id.toLowerCase().includes(searchLower) ||
          call.agent_id.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [calls, filters]);

  // Estadísticas por estado
  const statusStats = useMemo(() => {
    if (!calls) return { all: 0, completed: 0, failed: 0, in_progress: 0 };
    
    return {
      all: calls.length,
      completed: calls.filter(c => c.call_successful && c.status === 'completed').length,
      failed: calls.filter(c => !c.call_successful).length,
      in_progress: calls.filter(c => c.status !== 'completed').length
    };
  }, [calls]);

  // Handlers
  const handleViewDetails = async (call: VoiceCallReal) => {
    setLoadingDetails(true);
    try {
      const details = await voiceCallsRealDataService.getVoiceCallDetailsClean(call.segurneo_call_id);
      setSelectedCall(details);
      setSidebarOpen(true);
      
      toast({
        title: "Detalles cargados",
        description: `Mostrando detalles para ${call.segurneo_call_id.slice(0, 8)}...`,
      });
    } catch (error) {
      console.error('Error cargando detalles:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles de la llamada",
        variant: "destructive",
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleRefresh = async () => {
    await refresh();
    toast({
      title: "Actualizado",
      description: "Lista de llamadas actualizada correctamente",
    });
  };

  const handleExport = () => {
    toast({
      title: "Exportando",
      description: "Preparando archivo de exportación...",
    });
  };

  // Utilidades
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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

  const getStatusConfig = (call: VoiceCallReal) => {
    if (call.call_successful && call.status === 'completed') {
      return { variant: 'default' as const, label: 'Completada', icon: CheckCircle };
    } else if (!call.call_successful && call.status === 'completed') {
      return { variant: 'destructive' as const, label: 'Fallida', icon: XCircle };
    } else {
      return { variant: 'secondary' as const, label: 'En proceso', icon: Activity };
    }
  };

  const getSuccessRate = () => {
    if (!calls || calls.length === 0) return 0;
    const successful = calls.filter(c => c.call_successful).length;
    return Math.round((successful / calls.length) * 100);
  };

  // Loading State
  if (isLoading && !calls) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array(4).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-20 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Error State
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Llamadas</h2>
              <p className="text-muted-foreground">
                Gestión y análisis de llamadas de voz
              </p>
            </div>
          </div>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>Error al cargar las llamadas: {error}</p>
                <Button onClick={handleRefresh} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        
        {/* Header */}
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Llamadas</h2>
            <p className="text-muted-foreground">
              Gestión y análisis de llamadas de voz
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Llamadas</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {lastUpdated && `Actualizado ${format(lastUpdated, 'HH:mm')}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {stats?.avgDuration ? formatDuration(stats.avgDuration) : '0:00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Por llamada
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getSuccessRate()}%</div>
              <Progress value={getSuccessRate()} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensajes Totales</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {calls?.reduce((sum, call) => sum + call.total_messages, 0) || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                En conversaciones
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y controles */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Filtra y busca llamadas específicas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Tabs de estado */}
            <Tabs 
              value={filters.status} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as FilterStatus }))}
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">
                  Todas <Badge variant="secondary" className="ml-1">{statusStats.all}</Badge>
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completadas <Badge variant="secondary" className="ml-1">{statusStats.completed}</Badge>
                </TabsTrigger>
                <TabsTrigger value="failed">
                  Fallidas <Badge variant="secondary" className="ml-1">{statusStats.failed}</Badge>
                </TabsTrigger>
                <TabsTrigger value="in_progress">
                  En Proceso <Badge variant="secondary" className="ml-1">{statusStats.in_progress}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Separator />

            {/* Controles de filtro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Período */}
              <div className="space-y-2">
                <Label htmlFor="period">Período</Label>
                <Select 
                  value={filters.period} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, period: value as FilterPeriod }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las fechas</SelectItem>
                    <SelectItem value="today">Hoy</SelectItem>
                    <SelectItem value="week">Última semana</SelectItem>
                    <SelectItem value="month">Último mes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Búsqueda */}
              <div className="space-y-2">
                <Label htmlFor="search">Búsqueda</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="ID, conversación, agente..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Modo de vista */}
              <div className="space-y-2">
                <Label>Vista</Label>
                <Select value={viewMode} onValueChange={(value) => setViewMode(value as 'table' | 'cards')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table">Tabla</SelectItem>
                    <SelectItem value="cards">Tarjetas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de llamadas */}
        <Card>
          <CardHeader>
            <CardTitle>
              Llamadas {filters.status !== 'all' && `(${filteredCalls.length})`}
            </CardTitle>
            <CardDescription>
              Lista de llamadas con detalles y acciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCalls.length === 0 ? (
              <div className="text-center py-12">
                <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay llamadas</h3>
                <p className="text-muted-foreground">
                  {filters.status !== 'all' || filters.search || filters.period !== 'all'
                    ? 'No se encontraron llamadas con los filtros actuales.'
                    : 'No hay llamadas disponibles en este momento.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {viewMode === 'table' ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Llamada</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Duración</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Mensajes</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCalls.map((call) => {
                          const statusConfig = getStatusConfig(call);
                          const StatusIcon = statusConfig.icon;
                          
                          return (
                            <TableRow key={call.id}>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs">
                                        {call.agent_id.slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-sm">
                                        {call.segurneo_call_id.slice(0, 8)}...
                                      </div>
                                      <div className="text-xs text-muted-foreground font-mono">
                                        {call.conversation_id.slice(0, 16)}...
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {formatDate(call.start_time)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm font-semibold tabular-nums">
                                    {formatDuration(call.duration_seconds)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusConfig.variant} className="flex items-center space-x-1">
                                  <StatusIcon className="h-3 w-3" />
                                  <span>{statusConfig.label}</span>
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2 text-sm">
                                  <div className="flex items-center space-x-1">
                                    <Users className="h-3 w-3 text-muted-foreground" />
                                    <span>{call.agent_messages}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                    <span>{call.user_messages}</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {call.total_messages}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  onClick={() => handleViewDetails(call)}
                                  disabled={loadingDetails}
                                  className="h-8 px-3 text-xs"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Ver detalles
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCalls.map((call) => {
                      const statusConfig = getStatusConfig(call);
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <Card key={call.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {call.agent_id.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <CardTitle className="text-sm">
                                    {call.segurneo_call_id.slice(0, 8)}...
                                  </CardTitle>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {call.conversation_id.slice(0, 16)}...
                                  </p>
                                </div>
                              </div>
                              <Badge variant={statusConfig.variant} className="flex items-center space-x-1">
                                <StatusIcon className="h-3 w-3" />
                                <span>{statusConfig.label}</span>
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Fecha:</span>
                                <span>{formatDate(call.start_time)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Duración:</span>
                                <span className="font-semibold tabular-nums">{formatDuration(call.duration_seconds)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Mensajes:</span>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-xs">
                                    {call.agent_messages}A
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {call.user_messages}U
                                  </Badge>
                                </div>
                              </div>
                              <Separator />
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="w-full h-8 text-xs" 
                                onClick={() => handleViewDetails(call)}
                                disabled={loadingDetails}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Ver detalles
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar de detalles */}
      {selectedCall && (
        <CallDetailsSidebar
          call={selectedCall}
          isOpen={sidebarOpen}
          onClose={() => {
            setSidebarOpen(false);
            setSelectedCall(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}
