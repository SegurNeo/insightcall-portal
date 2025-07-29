import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  User, 
  Ticket, 
  ExternalLink,
  Clock,
  Plus,
  Activity
} from "lucide-react";

interface TicketCreated {
  ticket_id: string;
  tipo_incidencia: string;
  motivo_gestion: string;
  cliente_id: string;
  estado: 'created' | 'failed';
  error?: string;
}

interface RellamadaCreated {
  ticket_relacionado: string;
  followup_id?: string;
  estado: 'created' | 'failed';
  motivo: string;
  error?: string;
}

interface ClienteCreated {
  cliente_id: string;
  nombre: string;
  tipo: string;
  estado: 'created' | 'failed';
  error?: string;
}

interface CallActionsSectionProps {
  aiAnalysis: {
    tickets_creados?: TicketCreated[];
    rellamadas_creadas?: RellamadaCreated[];
    clientes_creados?: ClienteCreated[];
    resumen_ejecucion?: string;
  } | null;
  ticketsCreated: number;
  ticketIds: string[];
  onCreateNewTicket?: () => void;
}

export function CallActionsSection({
  aiAnalysis,
  ticketsCreated,
  ticketIds,
  onCreateNewTicket
}: CallActionsSectionProps) {
  const tickets = aiAnalysis?.tickets_creados || [];
  const rellamadas = aiAnalysis?.rellamadas_creadas || [];
  const clientes = aiAnalysis?.clientes_creados || [];

  const getTotalActions = () => {
    return tickets.length + rellamadas.length + clientes.length;
  };

  const getStatusIcon = (estado: string) => {
    return estado === 'created' ? (
      <CheckCircle2 className="h-4 w-4 text-green-600" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (estado: string) => {
    return estado === 'created' ? (
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
        Creado
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
        Error
      </Badge>
    );
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base font-semibold flex items-center">
            <Activity className="h-4 w-4 mr-2 text-blue-600" />
            Acciones Realizadas
            {getTotalActions() > 0 && (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                {getTotalActions()}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="default"
            size="sm"
            className="bg-zinc-900 text-white hover:bg-zinc-800 h-8 px-3 text-xs"
            onClick={onCreateNewTicket}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Crear Nuevo Ticket
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {getTotalActions() === 0 ? (
          <div className="text-center py-12 border rounded-md bg-white">
            <Activity className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No se realizaron acciones automáticas.</p>
            <p className="text-xs text-zinc-400 mt-1">
              Las acciones aparecerán aquí cuando el sistema procese la llamada.
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-sm text-zinc-800">Agente IA Autónomo</h4>
                <p className="text-xs text-zinc-500">Timeline de acciones ejecutadas</p>
              </div>
            </div>

            {/* 🚀 TIMELINE CRONOLÓGICO */}
            <div className="relative">
              {/* Línea vertical del timeline */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-green-200 to-amber-200"></div>

              <div className="space-y-3">
                {/* 👤 CLIENTES CREADOS PRIMERO */}
                {clientes.map((cliente, index) => (
                  <div key={`cliente-${index}`} className="relative flex items-start gap-4">
                    <div className="relative z-10 flex-shrink-0">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        cliente.estado === 'created' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}>
                        <User className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex-1 bg-white border border-green-200 rounded-lg p-3 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-zinc-800">
                          🎯 Cliente Creado
                        </span>
                        {getStatusBadge(cliente.estado)}
                      </div>
                      <p className="text-sm text-zinc-600 mb-2">
                        <strong>{cliente.nombre}</strong> registrado como {cliente.tipo}
                      </p>
                      <div className="text-xs text-zinc-500">
                        ID asignado: <code className="bg-zinc-100 px-1 py-0.5 rounded">{cliente.cliente_id}</code>
                      </div>
                      {cliente.error && (
                        <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">
                          ❌ {cliente.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* 📝 TICKETS CREADOS */}
                {tickets.map((ticket, index) => (
                  <div key={`ticket-${index}`} className="relative flex items-start gap-4">
                    <div className="relative z-10 flex-shrink-0">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        ticket.estado === 'created' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}>
                        <Ticket className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex-1 bg-white border border-blue-200 rounded-lg p-3 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-zinc-800">
                          🎫 Ticket Creado
                        </span>
                        {getStatusBadge(ticket.estado)}
                      </div>
                      <p className="text-sm text-zinc-600 mb-2">
                        <strong>{ticket.tipo_incidencia}</strong>
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500 mb-2">
                        <div>ID: <code className="bg-zinc-100 px-1 py-0.5 rounded">#{ticket.ticket_id}</code></div>
                        <div>Cliente: <code className="bg-zinc-100 px-1 py-0.5 rounded">{ticket.cliente_id}</code></div>
                      </div>
                      <div className="text-xs text-zinc-500">
                        Motivo: {ticket.motivo_gestion}
                      </div>
                      {ticket.error && (
                        <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">
                          ❌ {ticket.error}
                        </p>
                      )}
                      <div className="flex justify-end mt-2">
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs opacity-60 hover:opacity-100">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ver en Nogal
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 📞 RELLAMADAS CREADAS */}
                {rellamadas.map((rellamada, index) => (
                  <div key={`rellamada-${index}`} className="relative flex items-start gap-4">
                    <div className="relative z-10 flex-shrink-0">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        rellamada.estado === 'created' 
                          ? 'bg-amber-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}>
                        <Phone className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex-1 bg-white border border-amber-200 rounded-lg p-3 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-zinc-800">
                          📞 Rellamada Programada
                        </span>
                        {getStatusBadge(rellamada.estado)}
                      </div>
                      <p className="text-sm text-zinc-600 mb-2">
                        {rellamada.motivo}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500">
                        {rellamada.followup_id && (
                          <div>ID: <code className="bg-zinc-100 px-1 py-0.5 rounded">#{rellamada.followup_id}</code></div>
                        )}
                        <div>Relacionado: <code className="bg-zinc-100 px-1 py-0.5 rounded">{rellamada.ticket_relacionado}</code></div>
                      </div>
                      {rellamada.error && (
                        <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">
                          ❌ {rellamada.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* 📊 RESUMEN FINAL */}
                {aiAnalysis?.resumen_ejecucion && (
                  <div className="relative flex items-start gap-4">
                    <div className="relative z-10 flex-shrink-0">
                      <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-3 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm text-blue-800">
                          ✅ Proceso Completado
                        </span>
                      </div>
                      <p className="text-sm text-blue-700">{aiAnalysis.resumen_ejecucion}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 