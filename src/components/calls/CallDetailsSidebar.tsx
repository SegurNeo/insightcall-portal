import React, { useState, useRef, useEffect } from 'react';
import { X, Brain, MessageSquare, Ticket, Globe, CheckCircle, AlertCircle, Clock, User, Bot, XCircle, Music, Download, Info, Play, Pause, Volume2, SkipBack, SkipForward, Phone, Activity } from 'lucide-react';
import { VoiceCallDetailsClean } from '../../services/voiceCallsRealDataService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Progress } from '../ui/progress';
import { formatFileSize } from '../../lib/utils';
import { CallActionsSection } from './CallActionsSection';

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
  // Estado para el reproductor de audio avanzado
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Funciones del reproductor
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownloadAudio = () => {
    if (call.ficheroLlamada) {
      const link = document.createElement('a');
      link.href = call.ficheroLlamada;
      link.download = `llamada-${call.segurneoCallId}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        }
      };
    }
  }, [call.ficheroLlamada]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" 
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-[800px] bg-gradient-to-br from-white to-gray-50 shadow-2xl z-50 flex flex-col border-l border-gray-200">
        
        {/* Header fijo */}
        <div className="flex-shrink-0 px-8 py-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Análisis de Conversación</h2>
                <p className="text-sm text-gray-600 font-mono">{call.conversation_id}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Métricas principales */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{Math.floor(call.durationSeconds / 60)}:{(call.durationSeconds % 60).toString().padStart(2, '0')}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Duración</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{call.totalMessages}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Mensajes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{call.tickets?.length || 0}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Tickets</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                {call.callSuccessful ? (
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Estado</div>
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
              <TabsTrigger value="actions" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <Activity className="h-4 w-4 mr-1" />
                Acciones
              </TabsTrigger>
            </TabsList>

            {/* Contenido */}
            <div className="mt-8">
              <TabsContent value="resumen" className="mt-0">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="px-2 space-y-8">
                    
                    {/* Información de la llamada estilo ElevenLabs */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-black">Información de la llamada</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        
                        {/* Agente */}
                        <Card className="border-black/10 bg-white shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Bot className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm text-black/60">Agente</p>
                                <p className="font-medium text-black">{call.agent_id}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Fecha y hora */}
                        <Card className="border-black/10 bg-white shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <Clock className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm text-black/60">Fecha y hora</p>
                                <p className="font-medium text-black">{new Date(call.start_time).toLocaleDateString()} {new Date(call.start_time).toLocaleTimeString()}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                      </div>

                      {/* Métricas de conversación */}
                      <div className="grid grid-cols-3 gap-4">
                        <Card className="border-black/10 bg-white shadow-sm">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-black">{call.agent_messages}</div>
                            <div className="text-sm text-black/60">Agente</div>
                          </CardContent>
                        </Card>
                        
                        <Card className="border-black/10 bg-white shadow-sm">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-black">{call.user_messages}</div>
                            <div className="text-sm text-black/60">Usuario</div>
                          </CardContent>
                        </Card>
                        
                        <Card className="border-black/10 bg-white shadow-sm">
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-black">{call.total_messages}</div>
                            <div className="text-sm text-black/60">Total</div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Resumen */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-black">Resumen</h3>
                      
                      <Card className="border-black/10 bg-white shadow-sm">
                        <CardContent className="p-6">
                          <p className="text-black leading-relaxed">
                            {call.transcript_summary || "No hay resumen disponible para esta conversación."}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Número de contacto */}
                    {call.caller_id && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-black">Número de contacto</h3>
                        
                        <Card className="border-black/10 bg-white shadow-sm">
                          <CardContent className="p-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <Phone className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm text-black/60">Número de teléfono</p>
                                <p className="font-mono text-lg font-medium text-black">{call.caller_id}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Grabación de audio */}
                    {call.fichero_llamada && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-black">Grabación de audio</h3>
                        
                        <Card className="border-black/10 bg-white shadow-sm">
                          <CardContent className="p-6">
                            
                            {/* Reproductor de audio avanzado */}
                            <div className="space-y-4">
                              
                              {/* Audio element (hidden) */}
                              <audio
                                ref={audioRef}
                                src={call.fichero_llamada}
                                preload="metadata"
                                onEnded={() => setIsPlaying(false)}
                              />
                              
                              {/* Control de reproducción */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={skipBackward}
                                    disabled={!duration}
                                  >
                                    <SkipBack className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button
                                    onClick={togglePlayPause}
                                    disabled={!duration}
                                    className="w-12 h-12 rounded-full"
                                  >
                                    {isPlaying ? (
                                      <Pause className="h-5 w-5" />
                                    ) : (
                                      <Play className="h-5 w-5" />
                                    )}
                                  </Button>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={skipForward}
                                    disabled={!duration}
                                  >
                                    <SkipForward className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleDownloadAudio}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Descargar
                                </Button>
                              </div>
                              
                              {/* Progress bar */}
                              <div className="space-y-2">
                                <Slider
                                  value={[currentTime]}
                                  max={duration || 100}
                                  step={1}
                                  onValueChange={handleSeek}
                                  className="w-full"
                                  disabled={!duration}
                                />
                                <div className="flex justify-between text-sm text-black/60">
                                  <span>{formatTime(currentTime)}</span>
                                  <span>{formatTime(duration)}</span>
                                </div>
                              </div>
                              
                              {/* Volume control */}
                              <div className="flex items-center space-x-2">
                                <Volume2 className="h-4 w-4 text-black/60" />
                                <Slider
                                  value={[volume]}
                                  max={1}
                                  step={0.1}
                                  onValueChange={handleVolumeChange}
                                  className="w-24"
                                />
                                <span className="text-sm text-black/60 w-10">
                                  {Math.round(volume * 100)}%
                                </span>
                              </div>
                              
                              {/* File info */}
                              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <div className="flex items-center space-x-2">
                                  <Music className="h-4 w-4 text-black/60" />
                                  <span className="text-sm text-black/60">MP3</span>
                                  <span className="text-sm text-black/60">•</span>
                                  <span className="text-sm text-black/60">Duración: {Math.floor(call.duration_seconds / 60)}:{(call.duration_seconds % 60).toString().padStart(2, '0')}</span>
                                </div>
                                <div className="text-sm text-black/60">
                                  Disponible: 60 días
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Transcripción completa */}
              <TabsContent value="transcripcion" className="mt-0">
                {/* Contenido de transcripción (simplificado) */}
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="px-2 space-y-4">
                    <p className="text-gray-600">Contenido de transcripción...</p>
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Análisis Profundo */}
              <TabsContent value="analisis" className="mt-0">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="px-2 space-y-4">
                    <p className="text-gray-600">Contenido de análisis profundo...</p>
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* ACCIONES REALIZADAS POR IA */}
              <TabsContent value="actions" className="mt-0">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="px-2">
                    <CallActionsSection 
                      aiAnalysis={call.analysis_data || null}
                      ticketsCreated={call.tickets?.length || 0}
                      ticketIds={call.tickets?.map(t => t.id) || []}
                    />
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