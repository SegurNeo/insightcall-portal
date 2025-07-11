import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PhoneIncoming,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Phone
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
      return `${format(date, 'HH:mm')}`;
    } else if (isYesterday) {
      return `Ayer ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'dd MMM, HH:mm', { locale: es });
    }
  };

  // Loading skeleton - minimalista
  if (isLoading && (!calls || calls.length === 0)) {
    return (
      <>
        {showHeader && (
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-light">Llamadas Recientes</CardTitle>
              <Button variant="ghost" size="sm" disabled>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Cargando...
              </Button>
            </div>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-6">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b border-muted/20 last:border-0">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </>
    );
  }

  // Error state - minimalista
  if (error) {
    return (
      <>
        {showHeader && (
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-light">Llamadas Recientes</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-light">
                Error al cargar las llamadas
              </p>
              <p className="text-sm text-muted-foreground mt-2">{error}</p>
            </div>
          </div>
        </CardContent>
      </>
    );
  }

  // Empty state - minimalista
  if (!calls || calls.length === 0) {
    return (
      <>
        {showHeader && (
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-light">Llamadas Recientes</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Phone className="h-8 w-8 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-light">
                Sin llamadas recientes
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Las llamadas aparecerán aquí cuando lleguen
              </p>
            </div>
          </div>
        </CardContent>
      </>
    );
  }

  return (
    <>
      {showHeader && (
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-light">
                Llamadas Recientes
              </CardTitle>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground mt-2 font-light">
                  Actualizado {lastUpdated.toLocaleTimeString('es-ES')}
                </p>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Actualizar
            </Button>
          </div>
        </CardHeader>
      )}

      <CardContent>
        {/* Lista de llamadas - diseño minimalista */}
        <div className="space-y-0">
          {calls.map((call, index) => (
            <div
              key={call.id}
              className={`group flex items-center justify-between py-6 border-b border-muted/20 last:border-0 transition-colors hover:bg-muted/5 ${
                hoveredRow === call.id ? 'bg-muted/10' : ''
              }`}
              onMouseEnter={() => setHoveredRow(call.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {/* Información principal */}
              <div className="flex items-center space-x-4">
                                 {/* Indicador de estado */}
                 <div className="flex items-center justify-center w-2 h-2">
                   {call.call_successful ? (
                     <div className="w-2 h-2 bg-green-500 rounded-full" />
                   ) : (
                     <div className="w-2 h-2 bg-red-500 rounded-full" />
                   )}
                 </div>
                 
                 {/* Detalles de la llamada */}
                 <div className="space-y-1">
                   <div className="flex items-center space-x-3">
                     <p className="font-medium text-foreground">
                       {call.conversation_id.substring(0, 8)}...
                     </p>
                     <Badge 
                       variant={call.call_successful ? "secondary" : "destructive"}
                       className="text-xs font-light px-2 py-1"
                     >
                       {call.call_successful ? 'Exitosa' : 'Fallida'}
                     </Badge>
                   </div>
                   
                   <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                     <span className="flex items-center">
                       <Clock className="h-3 w-3 mr-1" />
                       {formatDuration(call.duration_seconds)}
                     </span>
                     <span>
                       {formatDate(call.start_time)}
                     </span>
                   </div>
                 </div>
              </div>

                             {/* Información adicional */}
               <div className="flex items-center space-x-4">
                 {/* Mensajes totales */}
                 {call.total_messages > 0 && (
                   <Badge variant="outline" className="font-light">
                     {call.total_messages} mensaje{call.total_messages !== 1 ? 's' : ''}
                   </Badge>
                 )}
                 
                 {/* Botón de acción */}
                 <Button
                   variant="ghost"
                   size="sm"
                   className="opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                   <ArrowUpRight className="h-4 w-4" />
                 </Button>
               </div>
            </div>
          ))}
        </div>

                 {/* Estadísticas de resumen - minimalista */}
         {stats && calls.length > 0 && (
           <div className="mt-8 pt-6 border-t border-muted/20">
             <div className="flex items-center justify-between text-sm">
               <span className="text-muted-foreground font-light">
                 Total de llamadas
               </span>
               <span className="font-medium text-foreground">
                 {stats.total}
               </span>
             </div>
             
             <div className="flex items-center justify-between text-sm mt-2">
               <span className="text-muted-foreground font-light">
                 Duración promedio
               </span>
               <span className="font-medium text-foreground">
                 {formatDuration(stats.avgDuration)}
               </span>
             </div>
           </div>
         )}
      </CardContent>
    </>
  );
};

export default RealCallsList; 