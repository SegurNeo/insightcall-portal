import React from 'react';
import { X } from 'lucide-react';
import { VoiceCallDetailsClean } from '../../services/voiceCallsRealDataService';
import { CallTranscriptionChat } from './CallTranscriptionChat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

interface CallDetailsSidebarProps {
  call: VoiceCallDetailsClean;
  isOpen: boolean;
  onClose: () => void;
}

export const CallDetailsSidebar: React.FC<CallDetailsSidebarProps> = ({
  call,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return `Hoy, ${date.toLocaleTimeString('es-ES')}`;
    } else if (diffInDays === 1) {
      return `Ayer, ${date.toLocaleTimeString('es-ES')}`;
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-black/10">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-black truncate">
            Detalles de Llamada
          </h2>
          <p className="text-sm text-black/60 truncate">
            {call.conversation_id}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 p-2 text-black/60 hover:text-black hover:bg-black/5 rounded-md transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <ScrollArea className="flex-1 h-[calc(100vh-80px)]">
        <Tabs defaultValue="resumen" className="w-full">
          <div className="sticky top-0 bg-white border-b border-black/10 z-10">
            <TabsList className="grid w-full grid-cols-3 bg-transparent h-12 p-1">
              <TabsTrigger 
                value="resumen" 
                className="text-xs data-[state=active]:bg-black data-[state=active]:text-white"
              >
                Resumen
              </TabsTrigger>
              <TabsTrigger 
                value="transcripcion" 
                className="text-xs data-[state=active]:bg-black data-[state=active]:text-white"
              >
                Transcripción
              </TabsTrigger>
              <TabsTrigger 
                value="analisis" 
                className="text-xs data-[state=active]:bg-black data-[state=active]:text-white"
              >
                Análisis
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            {/* RESUMEN */}
            <TabsContent value="resumen" className="m-0 space-y-6">
              {/* Estado y timing */}
              <Card className="border-black/10">
                <CardHeader>
                  <CardTitle className="text-base text-black">Estado de la Llamada</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-black/60">Estado</span>
                    <Badge 
                      variant="outline" 
                      className={`${
                        call.call_successful && call.status === 'completed'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : !call.call_successful
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}
                    >
                      {call.call_successful && call.status === 'completed' ? 'Completada' :
                       !call.call_successful ? 'Fallida' : 'En proceso'}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-black/60">Duración</span>
                      <div className="font-medium text-black">{formatDuration(call.duration_seconds)}</div>
                    </div>
                    <div>
                      <span className="text-black/60">Agente</span>
                      <div className="font-medium text-black">{call.agent_id}</div>
                    </div>
                    <div>
                      <span className="text-black/60">Inicio</span>
                      <div className="font-medium text-black">{formatDateTime(call.start_time)}</div>
                    </div>
                    <div>
                      <span className="text-black/60">Mensajes</span>
                      <div className="font-medium text-black">{call.total_messages}</div>
                    </div>
                  </div>

                  {call.termination_reason && (
                    <>
                      <Separator />
                      <div>
                        <span className="text-sm text-black/60">Motivo de finalización</span>
                        <div className="text-sm font-medium text-black mt-1">{call.termination_reason}</div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Resumen de transcripción */}
              {call.transcript_summary && (
                <Card className="border-black/10">
                  <CardHeader>
                    <CardTitle className="text-base text-black flex items-center">
                      Resumen de la Conversación
                      {call.has_translation && (
                        <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200">
                          Traducido
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-black/80 leading-relaxed">
                      {call.transcript_summary}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Tickets */}
              {call.tickets && call.tickets.length > 0 && (
                <Card className="border-black/10">
                  <CardHeader>
                    <CardTitle className="text-base text-black">
                      Tickets Generados ({call.tickets.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {call.tickets.map((ticket: any, index: number) => (
                      <div key={ticket.id || index} className="p-3 bg-black/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs">
                            {ticket.tipo_incidencia || ticket.type || 'Sin tipo'}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              ticket.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                              ticket.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-green-50 text-green-700 border-green-200'
                            }`}
                          >
                            {ticket.priority || 'medium'}
                          </Badge>
                        </div>
                        {ticket.description && (
                          <p className="text-xs text-black/70 line-clamp-2">
                            {ticket.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* TRANSCRIPCIÓN */}
            <TabsContent value="transcripcion" className="m-0">
              <Card className="border-black/10">
                <CardHeader>
                  <CardTitle className="text-base text-black">Conversación Completa</CardTitle>
                  <p className="text-sm text-black/60">
                    {call.agent_messages} mensajes del agente • {call.user_messages} del usuario
                  </p>
                </CardHeader>
                <CardContent>
                  <CallTranscriptionChat conversationId={call.conversation_id} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ANÁLISIS */}
            <TabsContent value="analisis" className="m-0">
              <Card className="border-black/10">
                <CardHeader>
                  <CardTitle className="text-lg text-black">Análisis Profundo</CardTitle>
                  <p className="text-sm text-black/60">
                    {call.has_analysis ? 'Análisis generado por IA' : 'Análisis pendiente'}
                  </p>
                </CardHeader>
                <CardContent>
                  {call.has_analysis ? (
                    <div className="space-y-4">
                      {/* AI Intent */}
                      {call.ai_intent && (
                        <div className="p-4 bg-black/5 rounded-lg">
                          <h4 className="font-medium text-black mb-2">Intención Detectada</h4>
                          <div className="space-y-2 text-sm">
                            {call.ai_intent.resumen && (
                              <div>
                                <span className="text-black/60">Resumen: </span>
                                <span className="text-black">{call.ai_intent.resumen}</span>
                              </div>
                            )}
                            {call.ai_intent.tipo_incidencia && (
                              <div>
                                <span className="text-black/60">Tipo: </span>
                                <span className="text-black">{call.ai_intent.tipo_incidencia}</span>
                              </div>
                            )}
                            {call.ai_intent.motivo_gestion && (
                              <div>
                                <span className="text-black/60">Motivo: </span>
                                <span className="text-black">{call.ai_intent.motivo_gestion}</span>
                              </div>
                            )}
                            {call.ai_intent.confidence && (
                              <div>
                                <span className="text-black/60">Confianza: </span>
                                <span className="text-black">{Math.round(call.ai_intent.confidence * 100)}%</span>
                              </div>
                            )}
                            {call.ai_intent.prioridad && (
                              <div>
                                <span className="text-black/60">Prioridad: </span>
                                <span className="text-black">{call.ai_intent.prioridad}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Analysis Results */}
                      {call.analysis_results && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-black mb-2">Análisis Detallado</h4>
                          <div className="text-sm text-black/80">
                            {call.analysis_results.resumenLlamada && (
                              <p className="mb-2">{call.analysis_results.resumenLlamada}</p>
                            )}
                            {call.analysis_results.incidenciaPrincipal && (
                              <div className="space-y-1">
                                <div>
                                  <strong>Tipo:</strong> {call.analysis_results.incidenciaPrincipal.tipo}
                                </div>
                                <div>
                                  <strong>Motivo:</strong> {call.analysis_results.incidenciaPrincipal.motivo}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-black/60">
                      <div className="mb-4">🧠</div>
                      <div>Análisis con Gemini pendiente</div>
                      <div className="text-xs mt-2">Se procesará automáticamente</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </ScrollArea>
    </div>
  );
}; 