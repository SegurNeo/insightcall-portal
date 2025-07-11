import React, { useState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "../ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { Progress } from "../ui/progress";
import { Slider } from "../ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Alert, AlertDescription } from "../ui/alert";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { 
  MessageSquare, 
  AlignLeft, 
  Download, 
  Clock, 
  Calendar, 
  Hash, 
  CheckCircle2,
  User2,
  Phone,
  BarChart3,
  X,
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Info,
  ClipboardCheck,
  Loader2,
  AlertCircle,
  Plus,
  Star,
  ThumbsUp,
  ThumbsDown,
  Music
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Conversation } from "../../types/api";
import { TranscriptMessage } from "../../types";
import { callService } from "../../services/callService";
import { cn, formatTicketType } from "../../lib/utils";
import { useToast } from "../../hooks/use-toast";
import { analysisService } from '../../services/analysisService';
import { TranscriptionAnalysisResult, TicketActionType } from '../../types/analysis';
import { CreateTicketDialog } from "./CreateTicketDialog";
import { ticketService, Ticket } from "../../services/ticketService";

interface CallDetailsDialogProps {
  call?: Conversation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CallDetailsDialog({ call, open, onOpenChange }: CallDetailsDialogProps) {
  const [transcriptionView, setTranscriptionView] = useState<'chat' | 'raw'>('chat');
  const [audioUrl, setAudioUrl] = useState<string>();
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<TranscriptionAnalysisResult>({ status: 'idle' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  
  // State for manual evaluation
  const [manualRating, setManualRating] = useState<number | null>(null);
  const [manualFeedback, setManualFeedback] = useState<'like' | 'dislike' | null>(null);

  const performAnalysis = async (currentTranscript: TranscriptMessage[]) => {
    if (!currentTranscript.length || !call?.conversation_id || isAnalyzing) return;
    
    setIsAnalyzing(true);
    setAnalysisResult({ status: 'loading' });
    
    try {
      const analysis = await analysisService.analyzeTranscript(currentTranscript, call.conversation_id);
      
      if (analysis.status === 'error') {
        throw new Error(analysis.details);
      }

      const actionType = analysis.action_id.toUpperCase().replace('-', '_') as TicketActionType;

      const action = {
        type: actionType,
        confidence: analysis.metadata?.confidence || 0,
        summary: analysis.details,
        details: {
          context: analysis.metadata?.context || '',
          priority: analysis.metadata?.priority as 'low' | 'medium' | 'high' || 'medium',
          requiredData: analysis.metadata?.requiredData || []
        }
      };

      // Crear ticket automáticamente
      if (analysis.metadata?.confidence && analysis.metadata.confidence > 0.5) {
        try {
          await ticketService.createTicket({
            type: actionType.toLowerCase(),
            description: analysis.details,
            priority: analysis.metadata.priority || 'medium',
            status: 'pending',
            conversationId: call.conversation_id,
          });

          // Actualizar la lista de tickets
          const updatedTickets = await ticketService.getTicketsByConversationId(call.conversation_id);
          setTickets(updatedTickets);

          toast({
            title: "Ticket creado automáticamente",
            description: "Se ha creado un ticket basado en el análisis de la llamada",
          });
        } catch (error) {
          console.error('Error al crear el ticket:', error);
          toast({
            title: "Error",
            description: "No se pudo crear el ticket automáticamente",
            variant: "destructive",
          });
        }
      }

      setAnalysisResult({ status: 'success', action });
    } catch (error) {
      console.error('Error en el análisis:', error);
      setAnalysisResult({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadTranscript = async () => {
    if (!call) return;

    try {
      console.log('Cargando transcripción para:', call.conversation_id);
      setIsLoadingTranscript(true);
      setAnalysisResult({ status: 'idle' });
      setIsAnalyzing(false);
      
      const data = await callService.getConversationDetail(call.conversation_id);
      
      console.log('Datos de transcripción recibidos:', {
        status: data.status,
        transcriptCount: data?.transcript?.length || 0,
        metadata: data.metadata,
        firstMessage: data.transcript?.[0],
        lastMessage: data.transcript?.[data.transcript.length - 1]
      });

      if (!data.transcript || data.transcript.length === 0) {
        console.warn('No hay transcripción disponible para esta llamada');
        setTranscript([]);
        return;
      }

      setTranscript(data.transcript);
      
      if (data.transcript.length > 0) {
        performAnalysis(data.transcript);
      }
    } catch (error) {
      console.error('Error al cargar la transcripción:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo cargar la transcripción",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTranscript(false);
    }
  };

  useEffect(() => {
    if (call && open) {
      console.log('Cargando detalles para la llamada:', {
        id: call.call_id,
        conversation_id: call.conversation_id,
        status: call.status,
        call_successful: call.call_successful
      });
      loadAudio();
      loadTranscript();
    } else {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(undefined);
      }
      setTranscript([]);
      setAnalysisResult({ status: 'idle' });
      setIsAnalyzing(false);
    }
  }, [call, open]);

  useEffect(() => {
    if (call?.conversation_id) {
      setIsLoadingTickets(true);
      ticketService.getTicketsByConversationId(call.conversation_id)
        .then(setTickets)
        .finally(() => setIsLoadingTickets(false));
    }
  }, [call?.conversation_id]);

  const loadAudio = async () => {
    if (!call) return;

    try {
      console.log('Intentando cargar audio para la llamada:', call.conversation_id);
      setIsLoadingAudio(true);
      const audioBlob = await callService.getConversationAudio(call.conversation_id);
      console.log('Audio cargado correctamente:', {
        size: audioBlob.size,
        type: audioBlob.type
      });
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    } catch (error) {
      console.error('Error al cargar el audio:', {
        conversationId: call.conversation_id,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error
      });
      
      // No mostrar toast para error 501 (no implementado)
      // if (error instanceof Error && !error.message.includes('501')) {
      //   toast({
      //     title: "Error",
      //     description: error instanceof Error ? error.message : "No se pudo cargar el audio de la llamada",
      //     variant: "destructive",
      //   });
      // }
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handlePlayPause = () => {
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
    if (audioRef.current) {
      const newVolume = value[0];
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTicketCreated = () => {
    if (call?.conversation_id) {
      ticketService.getTicketsByConversationId(call.conversation_id)
        .then(setTickets);
    }
  };

  const handleManualRating = (rating: number) => {
    setManualRating(rating);
  };

  const handleManualFeedback = (feedback: 'like' | 'dislike') => {
    setManualFeedback(feedback);
  };

  if (!call || !open) return null;

  // DEBUG: Log call successful value when the component renders with a call object
  console.log(`[Debug CallDetails] Rendering Call ID: ${call.conversation_id}, call_successful:`, call.call_successful, typeof call.call_successful);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[800px] sm:max-w-[800px] p-0 flex flex-col">
        <div className="flex h-full flex-col">
          <SheetHeader className="px-6 py-4 border-b bg-white sticky top-0 z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center border">
                  <Phone className="h-4 w-4 text-zinc-600" />
                </div>
                <SheetTitle className="text-lg font-semibold text-zinc-900">
                  Detalles de la Conversación
                </SheetTitle>
              </div>
              <div className="flex items-center space-x-2">
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:bg-zinc-100">
                    <X className="h-4 w-4" />
                  </Button>
                </SheetClose>
              </div>
            </div>
          </SheetHeader>

          <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="bg-white px-6 h-auto min-h-[48px] w-full justify-start gap-1 border-b rounded-none flex-shrink-0 flex-wrap">
              <TabsTrigger value="overview" className="text-sm px-3 py-2 data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm">
                <BarChart3 className="h-4 w-4 mr-1.5" />
                Resumen y Evaluación
              </TabsTrigger>
              <TabsTrigger value="transcription" className="text-sm px-3 py-2 data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm">
                <MessageSquare className="h-4 w-4 mr-1.5" />
                Transcripción
              </TabsTrigger>
              <TabsTrigger value="analysis" className="text-sm px-3 py-2 data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm">
                <ClipboardCheck className="h-4 w-4 mr-1.5" />
                Análisis Detallado
              </TabsTrigger>
              <TabsTrigger value="tickets" className="text-sm px-3 py-2 data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm">
                 <CheckCircle2 className="h-4 w-4 mr-1.5" />
                 Tickets ({tickets.length})
              </TabsTrigger>
              <TabsTrigger value="client" className="text-sm px-3 py-2 data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm">
                <User2 className="h-4 w-4 mr-1.5" />
                Cliente
              </TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b bg-zinc-50/50">
              <div className="space-y-1">
                <Label className="flex items-center space-x-1.5 text-xs text-muted-foreground">
                  <Hash className="h-3 w-3" />
                  <span>ID Conversación</span>
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-sm font-medium text-zinc-800 truncate cursor-help" title={call.conversation_id}>
                        {call.conversation_id}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>ID completo: {call.conversation_id}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-1">
                <Label className="flex items-center space-x-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Duración</span>
                </Label>
                <p className="text-sm font-medium text-zinc-800">
                  {formatTime(call.call_duration_secs)}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="flex items-center space-x-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Fecha y Hora</span>
                </Label>
                <p className="text-sm font-medium text-zinc-800">
                  {call?.start_time_unix_secs 
                    ? format(call.start_time_unix_secs * 1000, "P p", { locale: es })
                    : 'No disponible'
                  }
                </p>
              </div>
            </div>

            <ScrollArea className="flex-1 bg-zinc-100/50">
              <div className="p-6 space-y-6">
              <TabsContent value="overview" className="mt-0 space-y-6">
                <Card className="shadow-sm">
                  <CardHeader className="p-4">
                    <CardTitle className="text-base font-semibold flex items-center">
                      Resumen de la llamada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-5">
                    <div className="grid gap-x-6 gap-y-2 grid-cols-1 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Estado</Label>
                        <div className="flex items-center">
                          <Badge variant={call?.call_successful === 'success' ? 'secondary' : 'destructive'}>
                            {call?.call_successful === 'success' ? 'Exitosa' : 'Fallida'}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Agente</Label>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src="" alt={call.metadata.agent_name || 'Agente'} />
                            <AvatarFallback className="text-xs">
                              {call.metadata.agent_name ? call.metadata.agent_name.charAt(0).toUpperCase() : 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-zinc-800">{call.metadata.agent_name || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h4 className="text-base font-semibold flex items-center">
                            Evaluación y feedback
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Calidad basada en el éxito de la llamada y feedback manual.
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-2 items-start">
                                                        <div>
                              <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Puntuación</Label>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center space-x-1">
                                      {[1, 2, 3].map((i) => {
                                        const isFilled = i === 1 || (Boolean(call.call_successful) && call.call_successful === 'success' && i <= 3);
                                        return (
                                          <Star 
                                            key={i} 
                                            className={cn(
                                              "w-5 h-5",
                                              isFilled ? "text-yellow-400 fill-yellow-400" : "text-zinc-300"
                                            )}
                                          />
                                        );
                                       })}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Puntuación basada en el resultado de la llamada</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                             </div>
                            <div>
                              <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Estado atención</Label>
                              <Badge variant={call.call_successful === 'success' ? 'secondary' : 'destructive'}>
                                 {call.call_successful === 'success' ? 'Atención Exitosa' : 'Atención Fallida'}
                              </Badge>
                            </div>
                          </div>

                        <Separator className="my-4" />

                       <div>
                         <Label className="text-sm font-medium text-zinc-700 mb-1.5 block">Feedback rápido (manual)</Label>
                         <div className="flex space-x-2">
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <Button
                                   variant={manualFeedback === 'like' ? 'secondary' : 'outline'}
                                   size="icon"
                                   className="h-9 w-9 border-zinc-200 rounded-full"
                                   onClick={() => handleManualFeedback('like')}
                                 >
                                   <ThumbsUp className="h-4 w-4" />
                                 </Button>
                               </TooltipTrigger>
                               <TooltipContent>
                                 <p>Marcar como positivo</p>
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <Button
                                   variant={manualFeedback === 'dislike' ? 'secondary' : 'outline'}
                                   size="icon"
                                   className="h-9 w-9 border-zinc-200 rounded-full"
                                   onClick={() => handleManualFeedback('dislike')}
                                 >
                                   <ThumbsDown className="h-4 w-4" />
                                 </Button>
                               </TooltipTrigger>
                               <TooltipContent>
                                 <p>Marcar como negativo</p>
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         </div>
                       </div>
                    </div>
                  
                    {/* Moved Audio Player Section - START */}
                    {audioUrl ? (
                      <>
                        <Separator className="my-4" />
                        <Card className="shadow-none border-0 bg-transparent">
                          <CardHeader className="p-0 pb-2">
                             <CardTitle className="text-base font-semibold flex items-center">
                                Reproductor de audio
                             </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                             {isLoadingAudio ? (
                               <div className="space-y-4">
                                 <div className="flex items-center space-x-3">
                                   <Skeleton className="h-9 w-9 rounded-full" />
                                   <Skeleton className="h-4 w-12" />
                                   <Skeleton className="h-2 flex-1" />
                                   <Skeleton className="h-4 w-12" />
                                   <div className="flex items-center space-x-2">
                                     <Skeleton className="h-9 w-9 rounded-full" />
                                     <Skeleton className="h-2 w-20" />
                                     <Skeleton className="h-9 w-9 rounded-full" />
                                   </div>
                                 </div>
                               </div>
                             ) : (
                               <div className="space-y-4">
                                  <audio
                                    ref={audioRef}
                                    src={audioUrl}
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onEnded={() => setIsPlaying(false)}
                                    onError={(e) => console.error("Audio Error:", e)}
                                  />
                                  <div className="flex items-center space-x-3">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={handlePlayPause}
                                      className="h-9 w-9 flex-shrink-0 rounded-full text-muted-foreground hover:bg-zinc-100" 
                                      disabled={!duration}
                                    >
                                      {isPlaying ? (
                                        <Pause className="h-5 w-5" />
                                      ) : (
                                        <Play className="h-5 w-5" />
                                      )}
                                    </Button>
                                    
                                    <span className="text-xs w-10 text-muted-foreground font-mono">{formatTime(currentTime)}</span>

                                    <div className="flex-1">
                                      <Slider
                                        value={[currentTime]}
                                        max={duration || 1} 
                                        step={0.1}
                                        onValueChange={handleSeek}
                                        className="w-full"
                                        disabled={!duration}
                                      />
                                    </div>
                                    
                                    <span className="text-xs w-10 text-muted-foreground font-mono text-right">{formatTime(duration)}</span>

                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={toggleMute}
                                        className="h-9 w-9 text-muted-foreground hover:bg-zinc-100 rounded-full"
                                         disabled={!duration}
                                      >
                                        {isMuted || volume === 0 ? (
                                          <VolumeX className="h-4 w-4" />
                                        ) : volume < 0.5 ? (
                                          <Volume1 className="h-4 w-4" />
                                        ) : (
                                          <Volume2 className="h-4 w-4" />
                                        )}
                                      </Button>
                                      <div className="w-20">
                                        <Slider
                                          value={[isMuted ? 0 : volume]}
                                          max={1}
                                          step={0.05}
                                          onValueChange={handleVolumeChange}
                                          disabled={!duration}
                                        />
                                      </div>
                                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-zinc-100 rounded-full" disabled={!audioUrl} onClick={() => window.open(audioUrl, '_blank')}>
                                          <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                             )}
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <>
                        <Separator className="my-4" />
                        <Card className="shadow-none border-0 bg-transparent">
                          <CardHeader className="p-0 pb-2">
                             <CardTitle className="text-base font-semibold flex items-center">
                                <Music className="h-4 w-4 mr-2 text-muted-foreground" />
                                Audio
                             </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="flex items-center justify-center h-20 bg-zinc-50 rounded-lg border">
                              <Info className="h-5 w-5 text-muted-foreground mr-2" />
                              <span className="text-sm text-muted-foreground">El audio de la llamada no está disponible en este momento.</span>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                    {/* Moved Audio Player Section - END */}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transcription" className="mt-0">
                 <Card className="shadow-sm">
                    <CardHeader>
                       <div className="flex items-center justify-between">
                         <CardTitle className="text-base font-semibold flex items-center">
                           <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                            Transcripción
                         </CardTitle>
                         <div className="flex items-center space-x-2">
                           {transcript.length > 0 && (
                             <>
                              <Button
                                variant={transcriptionView === 'chat' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setTranscriptionView('chat')}
                                className={cn("h-8 px-2.5", transcriptionView !== 'chat' && "text-muted-foreground")}
                              >
                                <MessageSquare className="h-4 w-4 mr-1.5" />
                                Chat
                              </Button>
                              <Button
                                variant={transcriptionView === 'raw' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setTranscriptionView('raw')}
                                className={cn("h-8 px-2.5", transcriptionView !== 'raw' && "text-muted-foreground")}
                              >
                                <AlignLeft className="h-4 w-4 mr-1.5" />
                                Raw
                              </Button>
                            </>
                           )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                     {isLoadingTranscript ? (
                      <div className="p-4 space-y-4">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 justify-end">
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-2/3 ml-auto" />
                            <Skeleton className="h-3 w-1/3 ml-auto" />
                          </div>
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-4/5" />
                            <Skeleton className="h-3 w-3/5" />
                          </div>
                        </div>
                      </div>
                    ) : transcriptionView === 'chat' ? (
                       <div className="space-y-5 p-4">
                         {transcript.length > 0 ? (
                           <>
                             <div className="mb-4 flex items-center justify-between">
                               <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                 <Info className="h-4 w-4" />
                                 <span>
                                   {call.metadata.is_transcript_complete ? 
                                     'Transcripción completa' : 
                                     'Transcripción parcial'} • {transcript.length} mensajes
                                 </span>
                               </div>
                               {call.metadata.language && (
                                 <Badge variant="outline" className="text-xs">
                                   Idioma: {call.metadata.language}
                                 </Badge>
                               )}
                             </div>
                             {transcript.map((message, index) => {
                               const isAgent = message.role === 'agent';
                               const confidence = message.metadata?.confidence || 1.0;
                               const confidenceClass = confidence >= 0.8 ? 'bg-green-50' : 
                                                   confidence >= 0.6 ? 'bg-yellow-50' : 'bg-red-50';
                               
                               return (
                                 <div 
                                   key={index} 
                                   className={cn("flex w-full", isAgent ? "justify-start" : "justify-end")}
                                 >
                                   <div className={cn(
                                     "flex flex-col max-w-[80%]", 
                                     isAgent ? "items-start" : "items-end"
                                   )}>
                                     <div className={cn(
                                       "flex items-center space-x-2 mb-1.5", 
                                       !isAgent && "flex-row-reverse space-x-reverse"
                                     )}>
                                       <Avatar className="h-6 w-6">
                                         <AvatarImage src="" alt={isAgent ? 'Agente' : 'Cliente'} />
                                         <AvatarFallback className={cn(
                                           "text-xs",
                                           isAgent ? "bg-zinc-100 text-zinc-600" : "bg-zinc-800 text-white"
                                         )}>
                                           {isAgent ? 'A' : 'C'}
                                         </AvatarFallback>
                                       </Avatar>
                                       <div className="text-xs text-muted-foreground">
                                         {formatTime(message.time_in_call_secs)}
                                       </div>
                                     </div>
                                     <div className={cn(
                                       "rounded-lg px-4 py-2 text-sm break-words",
                                       confidenceClass,
                                       isAgent ? "rounded-tl-none" : "rounded-tr-none"
                                     )}>
                                       {message.message}
                                       {message.metadata?.confidence && confidence < 0.8 && (
                                         <div className="text-xs text-muted-foreground mt-1">
                                           Confianza: {Math.round(confidence * 100)}%
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                 </div>
                               );
                             })}
                           </>
                         ) : (
                           <Alert>
                             <MessageSquare className="h-4 w-4" />
                             <AlertDescription>
                               No hay transcripción disponible para esta llamada.
                             </AlertDescription>
                           </Alert>
                         )}
                       </div>
                    ) : (
                       <div className="text-sm font-mono p-4 space-y-3">
                         {transcript.length > 0 ? transcript.map((msg, index) => {
                           const isAgent = msg.role === 'agent';
                           const confidence = msg.metadata?.confidence || 1.0;
                           return (
                             <div key={index} className="flex items-start space-x-2">
                               <span className={cn(
                                 "font-semibold whitespace-nowrap",
                                 isAgent ? "text-zinc-800" : "text-zinc-600"
                               )}>
                                 [{formatTime(msg.time_in_call_secs)}] {isAgent ? 'Agente:' : 'Cliente:'}
                               </span>
                               <span className="text-zinc-800 flex-1">{msg.message}</span>
                               {msg.metadata?.confidence && (
                                 <span className="text-zinc-400 text-xs whitespace-nowrap">
                                   ({Math.round(confidence * 100)}% conf.)
                                 </span>
                               )}
                             </div>
                           );
                         }) : (
                           <Alert>
                             <AlertCircle className="h-4 w-4" />
                             <AlertDescription>
                               No hay transcripción disponible en formato raw.
                             </AlertDescription>
                           </Alert>
                         )}
                       </div>
                    )}
                    </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="analysis" className="mt-0 space-y-6">
                 <Card className="shadow-sm">
                     <CardHeader>
                       <CardTitle className="text-base font-semibold flex items-center">
                         <ClipboardCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                         Análisis detallado (Automático)
                       </CardTitle>
                       <CardDescription>
                         Intención, confianza y contexto detectados por el sistema.
                       </CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-4 pt-2">
                       {(analysisResult.status === 'loading' || isAnalyzing) && (
                         <div className="space-y-4">
                           <div className="flex items-center space-x-2">
                             <Skeleton className="h-6 w-24" />
                             <Skeleton className="h-6 w-20" />
                             <Skeleton className="h-6 w-16" />
                           </div>
                           <div className="space-y-2">
                             <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-5/6" />
                             <Skeleton className="h-4 w-4/6" />
                           </div>
                           <div className="space-y-2">
                             <Skeleton className="h-4 w-3/4" />
                             <Skeleton className="h-4 w-2/3" />
                           </div>
                         </div>
                       )}
                       {analysisResult.status === 'idle' && !isLoadingTranscript && !isAnalyzing && (
                         <Alert>
                           <Info className="h-4 w-4" />
                           <AlertDescription>
                             {transcript.length === 0 ? "Se requiere transcripción para el análisis." : "Análisis no iniciado o pendiente."}
                           </AlertDescription>
                         </Alert>
                       )}
                       {analysisResult.status === 'error' && (
                         <Alert variant="destructive">
                           <AlertCircle className="h-4 w-4" />
                           <AlertDescription>
                             <p className="font-medium mb-1">Error en el análisis automático</p>
                             <p className="text-sm">{analysisResult.error}</p>
                           </AlertDescription>
                         </Alert>
                       )}
                       {analysisResult.status === 'success' && analysisResult.action && (
                         <Card>
                           <CardHeader className="pb-3">
                             <div className="flex items-center justify-between flex-wrap gap-2">
                               <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                 <Badge variant="secondary">
                                   Intención: {formatTicketType(analysisResult.action.type)}
                                 </Badge>
                                 <TooltipProvider>
                                   <Tooltip>
                                     <TooltipTrigger asChild>
                                       <Badge variant="outline">
                                         Confianza: {Math.round(analysisResult.action.confidence * 100)}%
                                       </Badge>
                                     </TooltipTrigger>
                                     <TooltipContent>
                                       <p>Nivel de confianza del análisis automático</p>
                                     </TooltipContent>
                                   </Tooltip>
                                 </TooltipProvider>
                               </div>
                               <Badge 
                                 variant={analysisResult.action.details.priority === 'high' ? 'destructive' : 
                                         analysisResult.action.details.priority === 'medium' ? 'default' : 'secondary'}
                                 className="capitalize"
                               >
                                 {analysisResult.action.details.priority}
                               </Badge>
                             </div>
                           </CardHeader>
                           
                           <CardContent className="space-y-4">
                             <div>
                               <Label className="text-sm font-semibold text-zinc-800 mb-1">Resumen detectado</Label>
                               <p className="text-sm text-zinc-600 leading-relaxed">{analysisResult.action.summary || "-"}</p>
                             </div>

                            {analysisResult.action.details.context && (
                               <div>
                                 <Label className="text-sm font-semibold text-zinc-800 mb-1">Contexto relevante</Label>
                                 <p className="text-sm text-zinc-600 leading-relaxed">{analysisResult.action.details.context}</p>
                               </div>
                             )}

                             {analysisResult.action.details.requiredData && analysisResult.action.details.requiredData.length > 0 && (
                               <div>
                                 <Label className="text-sm font-semibold text-zinc-800 mb-1">Datos requeridos identificados</Label>
                                 <ul className="list-disc list-inside text-sm text-zinc-600 pl-1 space-y-0.5">
                                   {analysisResult.action.details.requiredData.map((data, index) => (
                                     <li key={index}>{data}</li>
                                   ))}
                                 </ul>
                               </div>
                             )}
                           </CardContent>
                         </Card>
                       )}
                     </CardContent>
                 </Card>
              </TabsContent>
              
              <TabsContent value="tickets" className="mt-0 space-y-6">
                <Card className="shadow-sm">
                  <CardHeader>
                     <div className="flex items-center justify-between flex-wrap gap-2">
                       <CardTitle className="text-base font-semibold flex items-center">
                         <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
                         Tickets Asociados
                       </CardTitle>
                       <Button
                           variant="default"
                           size="sm"
                           className="bg-zinc-900 text-white hover:bg-zinc-800 h-8 px-3 text-xs"
                           onClick={() => setIsCreateTicketOpen(true)}
                           disabled={!call?.conversation_id}
                       >
                           <Plus className="h-3.5 w-3.5 mr-1.5" />
                           Crear Nuevo Ticket
                       </Button>
                     </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                     {isLoadingTickets ? (
                       <div className="space-y-4">
                         <div className="px-4 py-3 border rounded-md">
                           <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center space-x-2">
                               <Skeleton className="h-5 w-20" />
                               <Skeleton className="h-5 w-16" />
                             </div>
                             <Skeleton className="h-5 w-14" />
                           </div>
                           <Skeleton className="h-4 w-full mb-1" />
                           <Skeleton className="h-3 w-32" />
                         </div>
                         <div className="px-4 py-3 border rounded-md">
                           <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center space-x-2">
                               <Skeleton className="h-5 w-20" />
                               <Skeleton className="h-5 w-16" />
                             </div>
                             <Skeleton className="h-5 w-14" />
                           </div>
                           <Skeleton className="h-4 w-5/6 mb-1" />
                           <Skeleton className="h-3 w-28" />
                         </div>
                       </div>
                     ) : tickets.length > 0 ? (
                       <div className="space-y-3">
                         {tickets.map(ticket => (
                           <Card key={ticket.id} className="hover:shadow-md transition-shadow duration-200">
                             <CardHeader className="pb-3">
                               <div className="flex items-center justify-between">
                                 <div className="flex items-center space-x-2">
                                   <Badge variant="outline" className="font-mono">
                                     #{ticket.id}
                                   </Badge>
                                   <Badge 
                                     variant={ticket.priority === 'high' ? 'destructive' : 
                                             ticket.priority === 'medium' ? 'default' : 'secondary'}
                                     className="capitalize"
                                   >
                                     {ticket.priority}
                                   </Badge>
                                 </div>
                                 <Badge variant="secondary" className="capitalize">
                                   {ticket.status}
                                 </Badge>
                               </div>
                             </CardHeader>
                             <CardContent className="pt-0">
                               <p className="text-sm text-zinc-600 mb-2">{ticket.description}</p>
                               <div className="flex items-center justify-between text-xs text-zinc-500">
                                 <span>Tipo: {formatTicketType(ticket.type as TicketActionType)}</span>
                                 <TooltipProvider>
                                   <Tooltip>
                                     <TooltipTrigger asChild>
                                                                               <span className="cursor-help">
                                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A'}
                                       </span>
                                     </TooltipTrigger>
                                     <TooltipContent>
                                       <p>Fecha de creación</p>
                                     </TooltipContent>
                                   </Tooltip>
                                 </TooltipProvider>
                               </div>
                             </CardContent>
                           </Card>
                         ))}
                       </div>
                     ) : (
                                                <Alert>
                           <CheckCircle2 className="h-4 w-4" />
                           <AlertDescription>
                             No hay tickets asociados a esta llamada.
                           </AlertDescription>
                         </Alert>
                     )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="client" className="mt-0">
                  <Card className="shadow-sm">
                    <CardHeader>
                       <CardTitle className="text-base font-semibold flex items-center">
                         <User2 className="h-4 w-4 mr-2 text-blue-600" />
                         Datos del Cliente (Placeholder)
                       </CardTitle>
                       <CardDescription>
                         Información relevante sobre el cliente (datos de ejemplo).
                       </CardDescription>
                     </CardHeader>
                  <CardContent className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Nombre</Label>
                          <p className="text-sm text-zinc-800">Carlos Martínez</p>
                        </div>
                         <div className="space-y-1">
                          <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Póliza</Label>
                          <p className="text-sm text-zinc-800">Adeslas Go (G-987654321)</p>
                        </div>
                         <div className="space-y-1">
                          <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Tipo de seguro</Label>
                          <p className="text-sm text-zinc-800">Seguro de Salud</p>
                        </div>
                         <div className="space-y-1">
                          <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Teléfono</Label>
                          <p className="text-sm text-zinc-800">+34 600 123 456</p>
                        </div>
                         <div className="space-y-1">
                          <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</Label>
                          <p className="text-sm text-zinc-800">c.martinez@ejemplo.com</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </div>

        <CreateTicketDialog
          open={isCreateTicketOpen}
          onOpenChange={setIsCreateTicketOpen}
          conversationId={call.conversation_id}
          initialData={analysisResult.status === 'success' ? { 
            type: analysisResult.action?.type, 
            summary: analysisResult.action?.summary,
            priority: analysisResult.action?.details.priority 
          } : undefined}
          onTicketCreated={handleTicketCreated}
        />
      </SheetContent>
    </Sheet>
  );
}