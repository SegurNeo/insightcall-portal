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
  AlertCircle,
  Activity,
  MessageSquare,
  Send,
  FileText
} from 'lucide-react';

import { useVoiceCallsPaginated } from '../hooks/useVoiceCallsReal';
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
import { Pagination } from '@/components/ui/pagination';

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

// Types para filtros mejorados
type FilterStatus = 'all' | 'ticket_sent' | 'ticket_pending' | 'ticket_unassigned' | 'in_progress';
type FilterPeriod = 'all' | 'today' | 'week' | 'month';

interface FilterState {
  status: FilterStatus;
  period: FilterPeriod;
  search: string;
}

export default function CallsPage() {
  const { toast } = useToast();
  
  // Estados locales de filtros
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    period: 'all',
    search: ''
  });
  
  // USAR EL NUEVO HOOK CON PAGINACIÓN Y FILTROS
  const { 
    calls, 
    stats, 
    isLoading, 
    error, 
    lastUpdated, 
    refresh,
    currentPage,
    totalPages,
    total,
    setPage,
    hasNextPage,
    hasPrevPage,
    updateFilters
  } = useVoiceCallsPaginated(1, 15, false, filters); // Pasamos los filtros al hook
  
  // Estados
  const [selectedCall, setSelectedCall] = useState<VoiceCallDetailsClean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // YA NO NECESITAMOS FILTROS COMPUTADOS - TODO SE HACE EN EL BACKEND
  const filteredCalls = calls || []; // Simplemente usar las llamadas que vienen del hook

  // Handler para cambio de filtros
  const handleFiltersChange = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    updateFilters(updatedFilters); // Esto actualizará los datos en el backend
  };

  // Estadísticas por estado mejoradas
  const statusStats = useMemo(() => {
    if (!calls) return { all: 0, ticket_sent: 0, ticket_pending: 0, ticket_unassigned: 0, in_progress: 0 };
    
    return {
      all: total, // Usar el total real de la BD, no solo las de la página actual
      ticket_sent: calls.filter(c => c.ticket_status === 'sent').length,
      ticket_pending: calls.filter(c => c.ticket_status === 'pending').length,
      ticket_unassigned: calls.filter(c => c.ticket_status === 'none').length,
      in_progress: calls.filter(c => c.status !== 'completed').length
    };
  }, [calls, total]);

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
    // Si la llamada está en proceso
    if (call.status !== 'completed') {
      return { variant: 'secondary' as const, label: 'En Proceso', icon: Activity };
    }
    
    // Para todas las llamadas completadas, mostrar estado de tickets
    if (call.ticket_status === 'sent') {
      return { variant: 'default' as const, label: 'Ticket Enviado', icon: Send };
    } else if (call.ticket_status === 'pending') {
      return { variant: 'secondary' as const, label: 'Ticket Pendiente', icon: FileText };
    } else {
      return { variant: 'outline' as const, label: 'Ticket Sin Asignar', icon: AlertCircle };
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
              <div className="text-2xl font-bold">{total || 0}</div>
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
              onValueChange={(value) => handleFiltersChange({ status: value as FilterStatus })}
            >
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">
                  Todas <Badge variant="secondary" className="ml-1">{statusStats.all}</Badge>
                </TabsTrigger>
                <TabsTrigger value="ticket_sent">
                  Ticket Enviado <Badge variant="secondary" className="ml-1">{statusStats.ticket_sent}</Badge>
                </TabsTrigger>
                <TabsTrigger value="ticket_pending">
                  Ticket Pendiente <Badge variant="secondary" className="ml-1">{statusStats.ticket_pending}</Badge>
                </TabsTrigger>
                <TabsTrigger value="ticket_unassigned">
                  Sin Asignar <Badge variant="secondary" className="ml-1">{statusStats.ticket_unassigned}</Badge>
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
                  onValueChange={(value) => handleFiltersChange({ period: value as FilterPeriod })}
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
                    onChange={(e) => handleFiltersChange({ search: e.target.value })}
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
          
          {/* Paginación */}
          {totalPages > 1 && (
            <CardContent className="pt-0">
              <Separator className="mb-6" />
              <div className="space-y-4">
                {/* Información de paginación */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      Mostrando{' '}
                      <span className="font-semibold text-foreground">
                        {(currentPage - 1) * 15 + 1}
                      </span>
                      {' - '}
                      <span className="font-semibold text-foreground">
                        {Math.min(currentPage * 15, total)}
                      </span>
                      {' de '}
                      <span className="font-semibold text-foreground">{total}</span>
                      {' llamadas'}
                    </div>
                  </div>
                </div>
                
                {/* Componente de paginación */}
                <div className="flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              </div>
            </CardContent>
          )}
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
