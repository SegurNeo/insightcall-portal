import React from 'react';
import { X, Brain, MessageSquare, Ticket, Globe, CheckCircle, AlertCircle, Clock, User, Bot, XCircle } from 'lucide-react';
import { VoiceCallDetailsClean } from '../../services/voiceCallsRealDataService';
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
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40" 
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 right-0 h-full w-[800px] bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        
        {/* Header limpio estilo ElevenLabs */}
        <div className="border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-500 font-medium">Análisis de Conversación</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                {call.conversationId}
              </h1>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Métricas principales estilo ElevenLabs */}
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {Math.floor(call.durationSeconds / 60)}:{(call.durationSeconds % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-500 font-medium">Duración</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {call.totalMessages}
              </div>
              <div className="text-sm text-gray-500 font-medium">Mensajes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {call.tickets?.length || 0}
              </div>
              <div className="text-sm text-gray-500 font-medium">Tickets</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                {call.callSuccessful ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
              </div>
              <div className="text-sm text-gray-500 font-medium">Estado</div>
            </div>
          </div>
        </div>

        {/* Navegación de tabs estilo ElevenLabs */}
        <div className="px-8 py-4 border-b border-gray-200">
          <Tabs defaultValue="resumen" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-50">
              <TabsTrigger value="resumen" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                Resumen IA
              </TabsTrigger>
              <TabsTrigger value="transcripcion" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                Transcription
              </TabsTrigger>
              <TabsTrigger value="analisis" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                Análisis Profundo
              </TabsTrigger>
              <TabsTrigger value="tickets" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                Tickets ({call.tickets?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Contenido */}
            <div className="mt-8">
              <TabsContent value="resumen" className="mt-0">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="px-2 space-y-8">
                    
                    {/* Información de la llamada estilo ElevenLabs */}
                    <div className="space-y-6">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Información de la Llamada
                      </h2>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Agente</div>
                          <div className="text-gray-900 font-medium">{call.agentId}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Fecha y Hora</div>
                          <div className="text-gray-900 font-medium">{call.formattedStartTime}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6 py-4 bg-gray-50 rounded-lg px-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">{call.agentMessages}</div>
                          <div className="text-sm text-gray-500">Agente</div>
                          <div className="text-xs text-gray-400">mensajes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">{call.userMessages}</div>
                          <div className="text-sm text-gray-500">Usuario</div>
                          <div className="text-xs text-gray-400">mensajes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">{call.totalMessages}</div>
                          <div className="text-sm text-gray-500">Total</div>
                          <div className="text-xs text-gray-400">mensajes</div>
                        </div>
                      </div>
                    </div>

                    {/* Resumen estilo ElevenLabs */}
                    <div className="space-y-6">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Summary
                      </h2>
                      
                      {call.hasTranscriptSummary ? (
                        <div className="prose prose-lg max-w-none">
                          <p className="text-gray-700 leading-relaxed">
                            {call.transcriptSummaryTranslated || call.transcriptSummary}
                          </p>
                        </div>
                      ) : (
                        <div className="py-12 text-center">
                          <div className="text-gray-400 mb-3">
                            <Brain className="h-8 w-8 mx-auto" />
                          </div>
                          <p className="text-gray-500">No summary available</p>
                          <p className="text-gray-400 text-sm mt-1">
                            Summary will be generated automatically after analysis
                          </p>
                        </div>
                      )}
                    </div>

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

              {/* TRANSCRIPCIÓN ESTILO ELEVENLABS */}
              <TabsContent value="transcripcion" className="mt-0">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="px-2">
                    {call.hasChatMessages ? (
                      <div className="space-y-6 py-4">
                        {call.chatMessages.map((message, index) => {
                          const isAgent = message.speaker === 'agent';
                          return (
                            <div key={index} className="space-y-4">
                              {/* Mensaje estilo ElevenLabs */}
                              <div className={`flex items-start gap-4 ${!isAgent ? 'flex-row-reverse' : ''}`}>
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    isAgent ? 'bg-gray-100' : 'bg-gray-800'
                                  }`}>
                                    {isAgent ? (
                                      <Bot className="h-4 w-4 text-gray-600" />
                                    ) : (
                                      <User className="h-4 w-4 text-white" />
                                    )}
                                  </div>
                                </div>

                                {/* Contenido del mensaje */}
                                <div className={`flex-1 max-w-[80%] ${!isAgent ? 'text-right' : ''}`}>
                                  <div className={`rounded-2xl px-4 py-3 ${
                                    isAgent 
                                      ? 'bg-gray-50 border border-gray-200' 
                                      : 'bg-gray-100 border border-gray-300'
                                  }`}>
                                    <p className="text-gray-900 leading-relaxed">
                                      {message.text}
                                    </p>
                                    
                                    {/* Timestamp */}
                                    <div className="mt-2 text-right">
                                      <span className="text-xs text-gray-500 font-medium">
                                        {message.formattedTime}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[400px]">
                        <div className="text-center">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-gray-500 text-lg mb-2">No transcription available</p>
                          <p className="text-gray-400 text-sm">
                            The transcription will be processed automatically when available
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
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
    </>
  );
}; 