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
          <div className="space-y-4">
            {/* 📝 TICKETS CREADOS */}
            {tickets.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-sm text-zinc-800">
                    Tickets Creados ({tickets.length})
                  </h4>
                </div>
                <div className="space-y-2">
                  {tickets.map((ticket, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-white hover:bg-zinc-50/80 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {getStatusIcon(ticket.estado)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-zinc-800 truncate">
                                #{ticket.ticket_id}
                              </span>
                              {getStatusBadge(ticket.estado)}
                            </div>
                            <p className="text-sm text-zinc-600 mb-1">{ticket.tipo_incidencia}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                              <span>Cliente: {ticket.cliente_id}</span>
                              <span>•</span>
                              <span>Motivo: {ticket.motivo_gestion}</span>
                            </div>
                            {ticket.error && (
                              <p className="text-xs text-red-600 mt-1 bg-red-50 p-1 rounded">
                                Error: {ticket.error}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-60 hover:opacity-100">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 📞 RELLAMADAS CREADAS */}
            {rellamadas.length > 0 && (
              <>
                {tickets.length > 0 && <Separator />}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-orange-600" />
                    <h4 className="font-medium text-sm text-zinc-800">
                      Rellamadas Creadas ({rellamadas.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {rellamadas.map((rellamada, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-white hover:bg-zinc-50/80 transition-colors">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(rellamada.estado)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-zinc-800">
                                Seguimiento
                                {rellamada.followup_id && (
                                  <span className="text-zinc-500"> #{rellamada.followup_id}</span>
                                )}
                              </span>
                              {getStatusBadge(rellamada.estado)}
                            </div>
                            <p className="text-sm text-zinc-600 mb-1">{rellamada.motivo}</p>
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                              <Clock className="h-3 w-3" />
                              <span>Ticket relacionado: {rellamada.ticket_relacionado}</span>
                            </div>
                            {rellamada.error && (
                              <p className="text-xs text-red-600 mt-1 bg-red-50 p-1 rounded">
                                Error: {rellamada.error}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 👤 CLIENTES CREADOS */}
            {clientes.length > 0 && (
              <>
                {(tickets.length > 0 || rellamadas.length > 0) && <Separator />}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium text-sm text-zinc-800">
                      Clientes Creados ({clientes.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {clientes.map((cliente, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-white hover:bg-zinc-50/80 transition-colors">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(cliente.estado)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-zinc-800">
                                {cliente.nombre}
                              </span>
                              {getStatusBadge(cliente.estado)}
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                              <span>ID: {cliente.cliente_id}</span>
                              <span>•</span>
                              <span>Tipo: {cliente.tipo}</span>
                            </div>
                            {cliente.error && (
                              <p className="text-xs text-red-600 mt-1 bg-red-50 p-1 rounded">
                                Error: {cliente.error}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 📊 RESUMEN DE EJECUCIÓN */}
            {aiAnalysis?.resumen_ejecucion && (
              <>
                <Separator />
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-sm text-blue-800">Resumen</h4>
                  </div>
                  <p className="text-sm text-blue-700">{aiAnalysis.resumen_ejecucion}</p>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 