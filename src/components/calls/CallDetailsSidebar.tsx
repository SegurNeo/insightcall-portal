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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/30 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-hidden">
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-white">
            <div>
              <h2 className="text-xl font-semibold text-black">Detalles de la Conversación</h2>
              <p className="text-sm text-black/60 font-mono">{call.conversationId}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-black/60 hover:text-black hover:bg-black/5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content with Tabs */}
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="resumen" className="h-full flex flex-col">
              
              {/* Tabs List */}
              <div className="px-6 pt-4 border-b">
                <TabsList className="grid w-full grid-cols-4 bg-black/5">
                  <TabsTrigger 
                    value="resumen" 
                    className="data-[state=active]:bg-black data-[state=active]:text-white text-black/70"
                  >
                    Resumen y Evaluación
                  </TabsTrigger>
                  <TabsTrigger 
                    value="transcripcion"
                    className="data-[state=active]:bg-black data-[state=active]:text-white text-black/70"
                  >
                    Chat Completo
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analisis"
                    className="data-[state=active]:bg-black data-[state=active]:text-white text-black/70"
                  >
                    Análisis Detallado
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tickets"
                    className="data-[state=active]:bg-black data-[state=active]:text-white text-black/70"
                  >
                    Tickets
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-hidden">
                
                {/* RESUMEN Y EVALUACIÓN */}
                <TabsContent value="resumen" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="p-6 space-y-6">
                      
                      {/* ID Conversación y Básicos */}
                      <Card className="border-black/10">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-black/70">ID Conversación</CardTitle>
                            <Badge variant="outline" className="border-black/20 text-black/70">
                              {call.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="font-mono text-xs text-black break-all bg-black/5 p-2 rounded">
                            {call.conversationId}
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-black/70">Duración</div>
                              <div className="font-medium text-black">{call.formattedDuration}</div>
                            </div>
                            <div>
                              <div className="text-black/70">Agente</div>
                              <div className="font-medium text-black">{call.agentId}</div>
                            </div>
                            <div>
                              <div className="text-black/70">Fecha y Hora</div>
                              <div className="font-medium text-black">{call.formattedStartTime}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Resumen de la llamada */}
                      <Card className="border-black/10">
                        <CardHeader>
                          <CardTitle className="text-lg text-black">Resumen de la llamada</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {call.hasTranscriptSummary ? (
                            <div className="space-y-4">
                              <div className="bg-black/5 rounded-lg p-4">
                                <p className="text-black leading-relaxed">
                                  {call.transcriptSummary}
                                </p>
                              </div>
                              <div className="flex justify-between text-xs text-black/60">
                                <span>Transcripción disponible</span>
                                <span>{call.transcriptSummary?.length} caracteres</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-black/60">
                              No hay resumen disponible
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Evaluación y feedback */}
                      <Card className="border-black/10">
                        <CardHeader>
                          <CardTitle className="text-lg text-black">Evaluación y feedback</CardTitle>
                          <p className="text-sm text-black/60">Calidad basada en el éxito de la llamada y feedback manual.</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-black/70 mb-2">Estado Atención</div>
                              <Badge 
                                variant={call.callSuccessful ? "default" : "destructive"}
                                className={call.callSuccessful ? "bg-black text-white" : "bg-red-100 text-red-800"}
                              >
                                {call.callSuccessful ? "Atención Exitosa" : "Atención Fallida"}
                              </Badge>
                            </div>
                            <div>
                              <div className="text-sm text-black/70 mb-2">Mensajes</div>
                              <div className="text-sm">
                                <span className="text-black font-medium">{call.agentMessages}</span> agente · 
                                <span className="text-black font-medium"> {call.userMessages}</span> usuario
                              </div>
                            </div>
                          </div>
                          
                          <Separator className="bg-black/10" />
                          
                          <div>
                            <div className="text-sm text-black/70 mb-2">Feedback rápido</div>
                            <div className="flex gap-2">
                              <button className="p-2 rounded border border-black/20 hover:bg-black/5">👍</button>
                              <button className="p-2 rounded border border-black/20 hover:bg-black/5">👎</button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* TRANSCRIPCIÓN COMPLETA EN CHAT */}
                <TabsContent value="transcripcion" className="h-full m-0">
                  <div className="h-full">
                    <CallTranscriptionChat
                      messages={call.chatMessages}
                      callDuration={call.durationSeconds}
                      conversationId={call.conversationId}
                    />
                  </div>
                </TabsContent>

                {/* ANÁLISIS DETALLADO */}
                <TabsContent value="analisis" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="p-6">
                      <Card className="border-black/10">
                        <CardHeader>
                          <CardTitle className="text-lg text-black">Análisis Profundo</CardTitle>
                          <p className="text-sm text-black/60">Análisis generado por IA sobre la conversación</p>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8 text-black/60">
                            <div className="mb-4">🧠</div>
                            <div>Análisis con Gemini pendiente de implementación</div>
                            <div className="text-xs mt-2">Se integrará análisis de sentimiento, puntos clave y mejoras</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* TICKETS */}
                <TabsContent value="tickets" className="h-full m-0">
                  <ScrollArea className="h-full">
                    <div className="p-6">
                      <Card className="border-black/10">
                        <CardHeader>
                          <CardTitle className="text-lg text-black">Gestión de Tickets</CardTitle>
                          <p className="text-sm text-black/60">Crear y gestionar tickets relacionados con esta llamada</p>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8 text-black/60">
                            <div className="mb-4">🎫</div>
                            <div>Sistema de tickets pendiente de implementación</div>
                            <div className="text-xs mt-2">Permitirá crear, asignar y seguir tickets</div>
                          </div>
                        </CardContent>
                      </Card>
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