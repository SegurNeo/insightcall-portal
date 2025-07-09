import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PhoneIncoming,
  Clock,
  Users,
  RefreshCw,
  Loader2,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  XCircle,
  AudioLines
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useVoiceCallsReal } from "@/hooks/useVoiceCallsReal";

interface RealCallsListProps {
  limit?: number;
  showHeader?: boolean;
}

const RealCallsList: React.FC<RealCallsListProps> = ({ 
  limit = 10, 
  showHeader = true 
}) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  
  const { calls, stats, isLoading, error, lastUpdated, refresh } = useVoiceCallsReal(limit);

  const handleRefresh = () => {
    refresh();
  };

  const statusBadgeVariant = (callSuccessful: boolean) => {
    return callSuccessful ? "default" : "destructive";
  };

  const statusIcon = (callSuccessful: boolean) => {
    return callSuccessful ? (
      <CheckCircle className="h-3 w-3" />
    ) : (
      <XCircle className="h-3 w-3" />
    );
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) {
      return `Hoy, ${format(date, 'HH:mm')}`;
    } else if (isYesterday) {
      return `Ayer, ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'dd MMM yyyy, HH:mm', { locale: es });
    }
  };

  // Loading skeleton
  if (isLoading && (!calls || calls.length === 0)) {
    return (
      <>
        {showHeader && (
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Llamadas Recientes</CardTitle>
            <Button variant="outline" size="sm" disabled>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Cargando...
            </Button>
          </CardHeader>
        )}
        <CardContent className="p-0">
          <div className="space-y-2 p-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        {showHeader && (
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Llamadas Recientes</CardTitle>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardHeader>
        )}
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error al cargar las llamadas: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </>
    );
  }

  // Empty state
  if (!calls || calls.length === 0) {
    return (
      <>
        {showHeader && (
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Llamadas Recientes</CardTitle>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <PhoneIncoming className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay llamadas disponibles</p>
            <p className="text-sm">Las llamadas aparecerán aquí cuando lleguen de Segurneo</p>
          </div>
        </CardContent>
      </>
    );
  }

  return (
    <>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-medium">
              Llamadas Recientes de Segurneo
            </CardTitle>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-1">
                Última actualización: {lastUpdated.toLocaleTimeString('es-ES')}
              </p>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Actualizar
          </Button>
        </CardHeader>
      )}

      {/* Quick stats */}
      {stats && showHeader && (
        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">{stats.total}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-muted-foreground">Promedio:</span>
              <span className="font-medium">{formatDuration(stats.avgDuration)}</span>
            </div>
          </div>
        </div>
      )}

      <CardContent className="p-0">
        <div className="relative overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Llamada ID</TableHead>
                <TableHead>Conversación</TableHead>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Mensajes</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.slice(0, limit).map((call) => (
                <TableRow 
                  key={call.id}
                  className="group hover:bg-secondary/40 transition-colors"
                  onMouseEnter={() => setHoveredRow(call.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <PhoneIncoming className="h-3.5 w-3.5 mr-2 text-primary" />
                      <span className="font-mono text-xs">
                        {call.segurneo_call_id.slice(0, 8)}...
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="max-w-[200px] truncate font-mono text-xs">
                      {call.conversation_id}
                    </div>
                  </TableCell>
                  
                  <TableCell>{formatDate(call.start_time)}</TableCell>
                  
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      {formatDuration(call.duration_seconds)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant={statusBadgeVariant(call.call_successful)}
                      className="flex items-center space-x-1"
                    >
                      {statusIcon(call.call_successful)}
                      <span>{call.call_successful ? 'Exitosa' : 'Fallida'}</span>
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-1 text-xs">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-blue-600">↗{call.agent_messages}</span>
                      <span className="text-green-600">↙{call.user_messages}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      {call.audio_available && (
                        <Badge variant="outline" className="text-xs">
                          <AudioLines className="h-3 w-3 mr-1" />
                          Audio
                        </Badge>
                      )}
                      {call.total_messages > 0 && (
                        <Badge variant="outline" className="text-xs">
                          📝 {call.total_messages}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </>
  );
};

export default RealCallsList; 