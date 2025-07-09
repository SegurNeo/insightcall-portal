import React from 'react';
import { X, Brain, MessageSquare, Ticket, Globe, CheckCircle, AlertCircle, Clock, User, Bot } from 'lucide-react';
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

  const getStatusConfig = () => {
    if (call.callSuccessful) {
      return { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle,
        label: 'Atención Exitosa' 
      };
    } else {
      return { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: AlertCircle,
        label: 'Atención Fallida' 
      };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/30 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-full max-w-5xl bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-hidden">
        <div className="flex flex-col h-full">
          
          {/* Header mejorado */}
          <div className="bg-gradient-to-r from-black to-black/80 text-white p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Análisis de Conversación</h2>
                  <p className="text-white/70 text-sm font-mono">{call.conversationId}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{call.formattedDuration}</div>
                <div className="text-white/70 text-xs">Duración</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{call.totalMessages}</div>
                <div className="text-white/70 text-xs">Mensajes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{call.tickets.length}</div>
                <div className="text-white/70 text-xs">Tickets</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center">
                  <StatusIcon className="h-6 w-6" />
                </div>
                <div className="text-white/70 text-xs">Estado</div>
              </div>
            </div>
          </div>

          {/* Content with Tabs */}
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="resumen" className="h-full flex flex-col">
              
              {/* Tabs List mejorada */}
              <div className="px-6 pt-4 border-b bg-gray-50">
                <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
                  <TabsTrigger 
                    value="resumen" 
                    className="data-[state=active]:bg-black data-[state=active]:text-white text-black/70 flex items-center gap-2"
                  >
                    <Brain className="h-4 w-4" />
                    Resumen IA
                  </TabsTrigger>
                  <TabsTrigger 
                    value="transcripcion"
                    className="data-[state=active]:bg-black data-[state=active]:text-white text-black/70 flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Chat Completo
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analisis"
                    className="data-[state=active]:bg-black data-[state=active]:text-white text-black/70 flex items-center gap-2"
                  >
                    <Brain className="h-4 w-4" />
                    Análisis Profundo
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tickets"
                    className="data-[state=active]:bg-black data-[state=active]:text-white text-black/70 flex items-center gap-2"
                  >
                    <Ticket className="h-4 w-4" />
                    Tickets ({call.tickets.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-hidden bg-gray-50">
                
                {/* RESUMEN Y EVALUACIÓN MEJORADO */}
                <TabsContent value="resumen" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="p-6 space-y-6">
                      
                      {/* Información básica mejorada */}
                      <Card className="border-black/10 bg-white shadow-sm">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-black flex items-center gap-2">
                              <Clock className="h-5 w-5" />
                              Información de la Llamada
                            </CardTitle>
                            <Badge className={`${statusConfig.color} border-0 flex items-center gap-1`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <div className="text-black/70 font-medium">Agente</div>
                              <div className="text-black flex items-center gap-2">
                                <Bot className="h-4 w-4 text-black/60" />
                                {call.agentId}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-black/70 font-medium">Fecha y Hora</div>
                              <div className="text-black">{call.formattedStartTime}</div>
                            </div>
                          </div>
                          
                          <Separator className="bg-black/10" />
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center p-3 bg-black/5 rounded-lg">
                              <div className="text-black/70 text-xs mb-1">Agente</div>
                              <div className="text-xl font-bold text-black">{call.agentMessages}</div>
                              <div className="text-black/60 text-xs">mensajes</div>
                            </div>
                            <div className="text-center p-3 bg-black/5 rounded-lg">
                              <div className="text-black/70 text-xs mb-1">Usuario</div>
                              <div className="text-xl font-bold text-black">{call.userMessages}</div>
                              <div className="text-black/60 text-xs">mensajes</div>
                            </div>
                            <div className="text-center p-3 bg-black/5 rounded-lg">
                              <div className="text-black/70 text-xs mb-1">Total</div>
                              <div className="text-xl font-bold text-black">{call.totalMessages}</div>
                              <div className="text-black/60 text-xs">mensajes</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Resumen traducido */}
                      <Card className="border-black/10 bg-white shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg text-black">
                            Resumen de la Conversación
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {call.hasTranscriptSummary ? (
                            <div className="bg-gradient-to-br from-black/5 to-black/10 rounded-lg p-4 border border-black/10">
                              <p className="text-black leading-relaxed">
                                {call.transcriptSummaryTranslated || call.transcriptSummary}
                              </p>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-black/60 bg-gray-50 rounded-lg border border-dashed border-black/20">
                              <Brain className="h-8 w-8 mx-auto mb-2 text-black/40" />
                              <div>No hay resumen disponible</div>
                              <div className="text-xs mt-1">El resumen se genera automáticamente tras el análisis</div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Análisis rápido */}
                      {call.hasAnalysis && call.analysisResult && (
                        <Card className="border-black/10 bg-white shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-lg text-black flex items-center gap-2">
                              <Brain className="h-5 w-5" />
                              Análisis Rápido de IA
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {call.analysisResult.sentiment && (
                              <div>
                                <div className="text-sm font-medium text-black/70 mb-2">Sentimiento General</div>
                                <Badge variant="outline" className="border-black/20 text-black">
                                  {call.analysisResult.sentiment}
                                </Badge>
                              </div>
                            )}
                            
                            {call.analysisResult.keyPoints && call.analysisResult.keyPoints.length > 0 && (
                              <div>
                                <div className="text-sm font-medium text-black/70 mb-2">Puntos Clave</div>
                                <ul className="space-y-1">
                                  {call.analysisResult.keyPoints.slice(0, 3).map((point, index) => (
                                    <li key={index} className="text-sm text-black flex items-start gap-2">
                                      <div className="w-1.5 h-1.5 bg-black rounded-full mt-2 flex-shrink-0"></div>
                                      {point}
                                    </li>
                                  ))}
                                </ul>
                                {call.analysisResult.keyPoints.length > 3 && (
                                  <div className="text-xs text-black/60 mt-2">
                                    +{call.analysisResult.keyPoints.length - 3} puntos más en el análisis detallado
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* TRANSCRIPCIÓN COMPLETA EN CHAT */}
                <TabsContent value="transcripcion" className="h-full m-0">
                  <div className="h-full bg-white">
                    {call.hasChatMessages ? (
                      <CallTranscriptionChat
                        messages={call.chatMessages}
                        callDuration={call.durationSeconds}
                        conversationId={call.conversationId}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center py-8 text-black/60">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-black/40" />
                          <div className="text-lg font-medium mb-2">No hay transcripción disponible</div>
                          <div className="text-sm">La transcripción se procesará automáticamente cuando esté disponible</div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* ANÁLISIS DETALLADO REAL */}
                <TabsContent value="analisis" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="p-6 space-y-6">
                      {call.hasAnalysis && call.analysisResult ? (
                        <>
                          {/* Resumen del análisis */}
                          {call.analysisResult.summary && (
                            <Card className="border-black/10 bg-white shadow-sm">
                              <CardHeader>
                                <CardTitle className="text-lg text-black flex items-center gap-2">
                                  <Brain className="h-5 w-5" />
                                  Resumen del Análisis
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                                  <p className="text-black leading-relaxed">{call.analysisResult.summary}</p>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Puntos clave completos */}
                          {call.analysisResult.keyPoints && call.analysisResult.keyPoints.length > 0 && (
                            <Card className="border-black/10 bg-white shadow-sm">
                              <CardHeader>
                                <CardTitle className="text-lg text-black">Puntos Clave Identificados</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-3">
                                  {call.analysisResult.keyPoints.map((point, index) => (
                                    <li key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                      <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                                        {index + 1}
                                      </div>
                                      <div className="text-black">{point}</div>
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          )}

                          {/* Recomendaciones */}
                          {call.analysisResult.recommendations && call.analysisResult.recommendations.length > 0 && (
                            <Card className="border-black/10 bg-white shadow-sm">
                              <CardHeader>
                                <CardTitle className="text-lg text-black">Recomendaciones</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-3">
                                  {call.analysisResult.recommendations.map((rec, index) => (
                                    <li key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                      <div className="text-black">{rec}</div>
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          )}

                          {/* Score si está disponible */}
                          {call.analysisResult.score !== undefined && (
                            <Card className="border-black/10 bg-white shadow-sm">
                              <CardHeader>
                                <CardTitle className="text-lg text-black">Puntuación de Calidad</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center gap-4">
                                  <div className="text-3xl font-bold text-black">{call.analysisResult.score}/10</div>
                                  <div className="flex-1">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-black h-2 rounded-full transition-all duration-300" 
                                        style={{ width: `${(call.analysisResult.score / 10) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </>
                      ) : (
                        <Card className="border-black/10 bg-white shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-lg text-black">Análisis Profundo</CardTitle>
                            <p className="text-sm text-black/60">Análisis generado por IA sobre la conversación</p>
                          </CardHeader>
                          <CardContent>
                            <div className="text-center py-12 text-black/60">
                              <Brain className="h-12 w-12 mx-auto mb-4 text-black/40" />
                              <div className="text-lg font-medium mb-2">Análisis no disponible</div>
                              <div className="text-sm">El análisis se está procesando o no está disponible para esta llamada</div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* TICKETS REALES */}
                <TabsContent value="tickets" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="p-6 space-y-6">
                      {call.hasTickets ? (
                        <>
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-black">Tickets Generados</h3>
                            <Badge variant="outline" className="border-black/20 text-black">
                              {call.tickets.length} tickets
                            </Badge>
                          </div>
                          
                          <div className="space-y-4">
                            {call.tickets.map((ticket, index) => (
                              <Card key={ticket.id} className="border-black/10 bg-white shadow-sm">
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-black flex items-center gap-2">
                                      <Ticket className="h-4 w-4" />
                                      Ticket #{index + 1}
                                    </CardTitle>
                                    <div className="flex gap-2">
                                      <Badge 
                                        variant="outline" 
                                        className="border-black/20 text-black text-xs"
                                      >
                                        {ticket.priority}
                                      </Badge>
                                      <Badge 
                                        variant={ticket.status === 'created' ? 'default' : 'secondary'}
                                        className={ticket.status === 'created' ? 'bg-black text-white' : ''}
                                      >
                                        {ticket.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div>
                                    <div className="text-xs font-medium text-black/70 mb-1">Tipo de Incidencia</div>
                                    <div className="text-sm text-black">{ticket.tipo_incidencia}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium text-black/70 mb-1">Motivo</div>
                                    <div className="text-sm text-black">{ticket.motivo_incidencia}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium text-black/70 mb-1">Descripción</div>
                                    <div className="text-sm text-black bg-gray-50 p-3 rounded border">
                                      {ticket.description}
                                    </div>
                                  </div>
                                  <div className="flex justify-between text-xs text-black/60">
                                    <span>ID: {ticket.id.slice(0, 8)}...</span>
                                    <span>{new Date(ticket.created_at).toLocaleDateString('es-ES')}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </>
                      ) : (
                        <Card className="border-black/10 bg-white shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-lg text-black">Gestión de Tickets</CardTitle>
                            <p className="text-sm text-black/60">Tickets generados automáticamente por IA</p>
                          </CardHeader>
                          <CardContent>
                            <div className="text-center py-12 text-black/60">
                              <Ticket className="h-12 w-12 mx-auto mb-4 text-black/40" />
                              <div className="text-lg font-medium mb-2">No hay tickets generados</div>
                              <div className="text-sm">Esta conversación no generó ningún ticket automático</div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}; 