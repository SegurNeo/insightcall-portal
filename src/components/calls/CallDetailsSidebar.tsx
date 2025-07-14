import React from 'react';
import { X, Brain, MessageSquare, Ticket, Globe, CheckCircle, AlertCircle, Clock, User, Bot, XCircle, Music, Download, Info } from 'lucide-react';
import { VoiceCallDetailsClean } from '../../services/voiceCallsRealDataService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { formatFileSize } from '../../lib/utils';

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
  // 🐛 DEBUG TEMPORAL - Verificar qué datos llegan
  console.log('🎵 CallDetailsSidebar (src) - DEBUG:', {
    conversationId: call.conversationId,
    audio_download_url: call.audio_download_url,
    audio_file_size: call.audio_file_size,
    ficheroLlamada: call.ficheroLlamada,
    hasAudioUrl: !!call.audio_download_url,
    audioAvailable: call.audioAvailable
  });
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
      <div 
        className={`
          fixed top-0 right-0 h-screen w-[800px] bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl overflow-hidden
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        onWheel={(e) => e.stopPropagation()}
      >
        
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
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Información de la llamada
                      </h2>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Agente</div>
                          <div className="text-gray-900 font-medium text-sm">{call.agentId}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Fecha y hora</div>
                          <div className="text-gray-900 font-medium text-sm">{call.formattedStartTime}</div>
                        </div>
              </div>

                      <div className="grid grid-cols-3 gap-3 py-3 bg-gray-50 rounded-lg px-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">{call.agentMessages}</div>
                          <div className="text-xs text-gray-500">Agente</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">{call.userMessages}</div>
                          <div className="text-xs text-gray-500">Usuario</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">{call.totalMessages}</div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>
                      </div>
                    </div>

                    {/* Resumen estilo ElevenLabs */}
                    <div className="space-y-6">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Resumen
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
                          <p className="text-gray-500">No hay resumen disponible</p>
                          <p className="text-gray-400 text-sm mt-1">
                            El resumen se generará automáticamente tras el análisis
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 🎵 REPRODUCTOR DE AUDIO - Después del resumen */}
                    {call.audio_download_url && (
                      <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                          <Music className="h-5 w-5 mr-2 text-gray-600" />
                          Grabación de Audio
                        </h2>
                        
                        <Card className="shadow-sm border border-gray-200">
                          <CardHeader className="pb-3">
                            <CardDescription className="text-sm text-gray-600">
                              Audio de la llamada • {call.audio_file_size ? formatFileSize(call.audio_file_size) : 'Tamaño desconocido'}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Reproductor HTML5 nativo */}
                            <div className="w-full">
                              <audio 
                                controls 
                                className="w-full"
                                preload="metadata"
                                style={{ height: '40px' }}
                              >
                                <source src={call.audio_download_url} type="audio/mpeg" />
                                Tu navegador no soporta el elemento de audio.
                              </audio>
                            </div>
                            
                            <Separator />
                            
                            {/* Botón de descarga */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Label className="text-sm text-gray-600">Archivo de audio</Label>
                                <Badge variant="outline" className="text-xs">MP3</Badge>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                asChild
                              >
                                <a 
                                  href={call.audio_download_url} 
                                  download
                                  className="flex items-center space-x-2"
                                >
                                  <Download className="h-4 w-4" />
                                  <span>Descargar</span>
                                </a>
                              </Button>
                            </div>
                            
                            {/* Información adicional */}
                            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center space-x-1 mb-1">
                                <Info className="h-3 w-3" />
                                <span className="font-medium">Información técnica</span>
                              </div>
                              <p>• El audio estará disponible por 60 días</p>
                              <p>• Formato MP3 compatible con todos los dispositivos</p>
                              <p>• Duración: {call.formattedDuration}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
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
                          <p className="text-gray-500 text-lg mb-2">No hay transcripción disponible</p>
                          <p className="text-gray-400 text-sm">
                            La transcripción se procesará automáticamente cuando esté disponible
                          </p>
                        </div>
                            </div>
                          )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* ANÁLISIS DETALLADO REAL */}
              <TabsContent value="analisis" className="mt-0">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="px-2 space-y-6">
                    {call.hasAnalysis && call.analysisResult ? (
                      <>
                        {/* Resumen del análisis */}
                        {call.analysisResult.summary && (
                          <Card className="border-black/10 bg-white shadow-sm">
                        <CardHeader>
                              <CardTitle className="text-lg text-black flex items-center gap-2">
                                <Brain className="h-5 w-5" />
                                Resumen del análisis
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
                              <CardTitle className="text-lg text-black">Puntos clave identificados</CardTitle>
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
                              <CardTitle className="text-lg text-black">Puntuación de calidad</CardTitle>
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
                          <CardTitle className="text-lg text-black">Análisis profundo</CardTitle>
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
              <TabsContent value="tickets" className="mt-0">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="px-2 space-y-6">
                    {call.hasTickets ? (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-black">Tickets generados</h3>
                          <Badge variant="outline" className="border-black/20 text-black">
                            {call.tickets.length} {call.tickets.length === 1 ? 'ticket' : 'tickets'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-6">
                          {call.tickets.map((ticket, index) => (
                            <Card key={ticket.id} className="border-zinc-200 bg-white shadow-sm">
                              <CardHeader className="pb-4 border-b border-zinc-100">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                                    <Ticket className="h-5 w-5 text-zinc-600" />
                                    Ticket #{ticket.id.slice(-8)}
                                  </CardTitle>
                                </div>
                              </CardHeader>
                              
                              <CardContent className="p-6">
                                <div className="grid grid-cols-1 gap-6">
                                  
                                  {/* Card de Información Técnica - Compacta */}
                                  <Card className="border border-zinc-200 bg-zinc-50/50">
                                    <CardHeader className="pb-4">
                                      <CardTitle className="text-sm font-semibold text-zinc-900">
                                        Información Técnica
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      
                                      {/* Layout mejorado sin confianza IA */}
                                      <div className="space-y-3">
                                        
                                        {/* Tipo de incidencia */}
                                        <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-zinc-200">
                                          <span className="text-sm font-medium text-zinc-600">Tipo de incidencia</span>
                                          <Badge variant="outline" className="text-xs border-zinc-300 text-zinc-700 font-medium">
                                            {ticket.tipo_incidencia}
                                          </Badge>
                                        </div>
                                        
                                        {/* Motivo */}
                                        <div className="p-4 bg-white rounded-lg border border-zinc-200">
                                          <div className="text-sm font-medium text-zinc-600 mb-2">Motivo</div>
                                          <div className="text-sm text-zinc-800">
                                            {ticket.motivo_incidencia}
                                          </div>
                                        </div>

                                        {/* ID Cliente */}
                                        <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-zinc-200">
                                          <span className="text-sm font-medium text-zinc-600">ID Cliente</span>
                                          <span className="text-sm font-mono text-zinc-800 bg-zinc-100 px-3 py-1 rounded">
                                            {ticket.metadata?.id_cliente || 
                                             ticket.metadata?.client_data?.idCliente || 
                                             <span className="text-red-600">No asignado</span>}
                                          </span>
                                        </div>

                                        {/* Estado Segurneo Voice rediseñado */}
                                        <div className="p-4 bg-white rounded-lg border border-zinc-200">
                                          <div className="text-sm font-medium text-zinc-600 mb-3">Estado Segurneo Voice</div>
                                          {ticket.metadata?.ticket_id || ticket.metadata?.nogal_ticket_id ? (
                                            <div className="flex items-start gap-3">
                                              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                              <div className="flex-1 min-w-0">
                                                <div className="text-sm text-green-700 font-medium mb-1">Enviado correctamente</div>
                                                <div className="text-xs text-zinc-600 bg-zinc-50 p-2 rounded font-mono break-all">
                                                  {ticket.metadata.ticket_id || ticket.metadata.nogal_ticket_id}
                                                </div>
                                              </div>
                                            </div>
                                          ) : ticket.metadata?.nogal_error ? (
                                            <div className="flex items-start gap-3">
                                              <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                              <div className="flex-1">
                                                <div className="text-sm text-red-700 font-medium mb-1">Error en envío</div>
                                                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                                  {ticket.metadata.nogal_error}
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-3">
                                              <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0"></div>
                                              <div className="text-sm text-amber-700">Pendiente de envío</div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Card de Notas */}
                                  <Card className="border border-zinc-200 bg-white">
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-sm font-semibold text-zinc-900">
                                        Notas
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div className="text-sm text-zinc-700 leading-relaxed bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                                        {ticket.description}
                                      </div>

                                      {/* Datos extraídos si existen */}
                                      {ticket.metadata?.datos_extraidos && Object.keys(ticket.metadata.datos_extraidos).length > 0 && (
                                        <div className="pt-4 border-t border-zinc-200">
                                          <span className="text-xs font-medium text-zinc-600 block mb-2">Datos extraídos</span>
                                          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                                            <div className="grid grid-cols-1 gap-1 text-xs">
                                              {Object.entries(ticket.metadata.datos_extraidos).map(([key, value]) => (
                                                value && value !== null && value !== "" && (
                                                  <div key={key} className="flex gap-2">
                                                    <span className="font-medium text-zinc-700 capitalize">{key}:</span>
                                                    <span className="text-zinc-600">{String(value)}</span>
                                                  </div>
                                                )
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                  
                                </div>


                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </>
                    ) : (
                      <Card className="border-black/10 bg-white shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg text-black">Gestión de tickets</CardTitle>
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