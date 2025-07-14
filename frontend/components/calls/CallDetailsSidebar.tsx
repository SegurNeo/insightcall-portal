import React from 'react';
import { X, Brain, MessageSquare, BarChart3, Clock, User, Calendar, Hash, AlertCircle, CheckCircle2, Info, Download, Music, Play, Pause } from 'lucide-react';
import { VoiceCallDetailsClean } from '../../../src/services/voiceCallsRealDataService';
import { CallTranscriptionChat } from './CallTranscriptionChat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { formatFileSize } from '../../../src/lib/utils';

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
      {/* Header mejorado */}
      <div className="flex items-center justify-between p-6 border-b bg-white sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center border">
            <MessageSquare className="h-4 w-4 text-zinc-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-zinc-900">
              Detalles de Llamada
            </h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm text-zinc-500 truncate cursor-help" title={call.conversationId}>
                    {call.conversationId}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>ID completo: {call.conversationId}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-500 hover:bg-zinc-100"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 h-[calc(100vh-80px)]">
        <Tabs defaultValue="resumen" className="w-full">
          <div className="sticky top-0 bg-white border-b z-10">
            <TabsList className="grid w-full grid-cols-3 bg-transparent h-12 p-1">
              <TabsTrigger 
                value="resumen" 
                className="text-sm data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900"
              >
                <BarChart3 className="h-4 w-4 mr-1.5" />
                Resumen
              </TabsTrigger>
              <TabsTrigger 
                value="transcripcion" 
                className="text-sm data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900"
              >
                <MessageSquare className="h-4 w-4 mr-1.5" />
                Transcripción
              </TabsTrigger>
              <TabsTrigger 
                value="analisis" 
                className="text-sm data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900"
              >
                <Brain className="h-4 w-4 mr-1.5" />
                Análisis
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            {/* RESUMEN */}
            <TabsContent value="resumen" className="m-0 space-y-6">
              {/* Estado y timing mejorado */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-muted-foreground" />
                    Estado de la Llamada
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">Estado</Label>
                    <Badge 
                      variant={call.callSuccessful && call.status === 'completed' ? 'secondary' : 
                              !call.callSuccessful ? 'destructive' : 'default'}
                    >
                      {call.callSuccessful && call.status === 'completed' ? 'Completada' :
                       !call.callSuccessful ? 'Fallida' : 'En proceso'}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Duración
                      </Label>
                      <div className="text-sm font-medium">{formatDuration(call.durationSeconds)}</div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        Agente
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {call.agentId ? call.agentId.charAt(0).toUpperCase() : 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{call.agentId}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Inicio
                      </Label>
                      <div className="text-sm font-medium">{formatDateTime(call.startTime)}</div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground flex items-center">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Mensajes
                      </Label>
                      <div className="text-sm font-medium">{call.totalMessages}</div>
                    </div>
                  </div>

                  {call.terminationReason && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-muted-foreground">Motivo de finalización</Label>
                        <p className="text-sm">{call.terminationReason}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Audio Player - Después del estado de la llamada */}
              {call.audio_download_url && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <Music className="h-4 w-4 mr-2 text-muted-foreground" />
                      Grabación de Audio
                    </CardTitle>
                    <CardDescription>
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
                      >
                        <source src={call.audio_download_url} type="audio/mpeg" />
                        Tu navegador no soporta el elemento de audio.
                      </audio>
                    </div>
                    
                    <Separator />
                    
                    {/* Botón de descarga */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm text-muted-foreground">Archivo de audio</Label>
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
                    <div className="text-xs text-muted-foreground bg-zinc-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-1 mb-1">
                        <Info className="h-3 w-3" />
                        <span className="font-medium">Información técnica</span>
                      </div>
                      <p>• El audio estará disponible por 60 días</p>
                      <p>• Formato MP3 compatible con todos los dispositivos</p>
                      <p>• Duración: {formatDuration(call.durationSeconds)}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Resumen de transcripción mejorado */}
              {call.transcriptSummary && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                      Resumen de la Conversación
                      {call.translationInfo && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="ml-2 text-xs">
                                Traducido
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Esta conversación ha sido traducida automáticamente</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{call.transcriptSummary}</p>
                  </CardContent>
                </Card>
              )}

              {/* Tickets Elegantes - Rediseñados */}
              {call.tickets && call.tickets.length > 0 && (
                <Card className="shadow-sm border-zinc-200">
                  <CardHeader className="pb-4 border-b border-zinc-100">
                    <CardTitle className="text-base flex items-center text-zinc-900">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-zinc-600" />
                      Tickets Generados ({call.tickets.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {call.tickets.map((ticket: any, index: number) => (
                      <Card key={ticket.id || index} className="border border-zinc-200 bg-white">
                        <CardContent className="p-0">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                            
                            {/* Card de Información Técnica */}
                            <Card className="border-0 border-r border-zinc-100 rounded-r-none bg-zinc-50/50">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-zinc-900 flex items-center justify-between">
                                  <span>Información Técnica</span>
                                  <Badge 
                                    variant={ticket.priority === 'high' ? 'destructive' : 
                                            ticket.priority === 'medium' ? 'default' : 'secondary'}
                                    className="text-xs font-medium"
                                  >
                                    {ticket.priority || 'medium'}
                                  </Badge>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="grid grid-cols-1 gap-3">
                                  <div className="flex justify-between items-center">
                                    <Label className="text-xs font-medium text-zinc-600">Tipo</Label>
                                    <Badge variant="outline" className="text-xs border-zinc-200 text-zinc-700">
                                      {ticket.tipo_incidencia || ticket.type || 'Sin tipo'}
                                    </Badge>
                                  </div>
                                  
                                  {ticket.id && (
                                    <div className="flex justify-between items-center">
                                      <Label className="text-xs font-medium text-zinc-600">ID</Label>
                                      <span className="text-xs font-mono text-zinc-800 bg-zinc-100 px-2 py-1 rounded">
                                        {ticket.id}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {ticket.status && (
                                    <div className="flex justify-between items-center">
                                      <Label className="text-xs font-medium text-zinc-600">Estado</Label>
                                      <Badge variant="secondary" className="text-xs bg-zinc-100 text-zinc-700">
                                        {ticket.status}
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {ticket.createdAt && (
                                    <div className="flex justify-between items-center">
                                      <Label className="text-xs font-medium text-zinc-600">Creado</Label>
                                      <span className="text-xs text-zinc-700">
                                        {new Date(ticket.createdAt).toLocaleDateString('es-ES')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>

                            {/* Card de Descripción */}
                            <Card className="border-0 rounded-l-none bg-white">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-zinc-900">
                                  Descripción
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {ticket.description ? (
                                  <div className="space-y-2">
                                    <p className="text-sm text-zinc-700 leading-relaxed">
                                      {ticket.description}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="text-center py-4">
                                    <AlertCircle className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                                    <p className="text-xs text-zinc-500">
                                      Sin descripción disponible
                                    </p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                            
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* TRANSCRIPCIÓN */}
            <TabsContent value="transcripcion" className="m-0">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                    Conversación Completa
                  </CardTitle>
                  <CardDescription>
                    {call.agentMessages} mensajes del agente • {call.userMessages} del usuario
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CallTranscriptionChat conversationId={call.conversationId} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ANÁLISIS */}
            <TabsContent value="analisis" className="m-0">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Brain className="h-4 w-4 mr-2 text-muted-foreground" />
                    Análisis Profundo
                  </CardTitle>
                  <CardDescription>
                    {call.hasAnalysis ? 'Análisis generado por IA' : 'Análisis pendiente'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {call.hasAnalysis ? (
                    <div className="space-y-4">
                      {/* Analysis Results mejorado */}
                      {call.analysisResult && (
                        <Card className="bg-blue-50/50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Análisis Detallado</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {call.analysisResult.summary && (
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-muted-foreground">Resumen</Label>
                                <p className="text-sm">{call.analysisResult.summary}</p>
                              </div>
                            )}
                            {call.analysisResult.score && (
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-muted-foreground">Puntuación</Label>
                                <Badge variant="secondary" className="text-xs">{call.analysisResult.score}/10</Badge>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <Alert>
                      <Brain className="h-4 w-4" />
                      <AlertDescription>
                        <div className="text-center">
                          <p className="font-medium mb-1">Análisis con Gemini pendiente</p>
                          <p className="text-xs">Se procesará automáticamente</p>
                        </div>
                      </AlertDescription>
                    </Alert>
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