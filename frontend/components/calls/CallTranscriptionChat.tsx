import React, { useRef, useEffect, useState } from 'react';
import { MessageCircle, Phone, Clock, Volume2, User, Loader2 } from 'lucide-react';
import { voiceCallsRealDataService } from '../../services/voiceCallsRealDataService';

interface ChatMessage {
  id: string;
  speaker: 'agent' | 'user';
  text: string;
  timestamp: number;
  duration: number;
  confidence: number;
  formattedTime: string;
}

interface CallTranscriptionChatProps {
  conversationId: string;
}

export const CallTranscriptionChat: React.FC<CallTranscriptionChatProps> = ({
  conversationId
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadTranscripts();
  }, [conversationId]);

  const loadTranscripts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(`🔍 [CallTranscriptionChat] Cargando transcripts para: ${conversationId}`);

      // Obtener los transcripts desde la estructura unificada
      const transcripts = await voiceCallsRealDataService.getVoiceCallTranscripts(conversationId);
      
      if (!transcripts || transcripts.length === 0) {
        console.log('⚠️ [CallTranscriptionChat] No hay transcripts disponibles');
        setMessages([]);
        return;
      }

      // Convertir transcripts de Segurneo a formato ChatMessage
      const chatMessages: ChatMessage[] = transcripts.map((transcript, index) => {
        const startTime = transcript.segment_start_time || index * 3;
        const endTime = transcript.segment_end_time || startTime + 3;
        const duration = Math.max(endTime - startTime, 1);

        const minutes = Math.floor(startTime / 60);
        const seconds = Math.floor(startTime % 60);
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        return {
          id: transcript.sequence?.toString() || (index + 1).toString(),
          speaker: (transcript.speaker === 'agent' ? 'agent' : 'user') as 'agent' | 'user',
          text: transcript.text || transcript.message || '',
          timestamp: startTime,
          duration,
          confidence: transcript.confidence || 0.95,
          formattedTime
        };
      }).filter(msg => msg.text.trim().length > 0);

      // Calcular duración total de la llamada
      const totalDuration = chatMessages.length > 0 
        ? Math.max(...chatMessages.map(m => m.timestamp + m.duration))
        : 0;

      setMessages(chatMessages);
      setCallDuration(totalDuration);

      console.log(`✅ [CallTranscriptionChat] ${chatMessages.length} mensajes cargados`);

    } catch (error) {
      console.error('❌ [CallTranscriptionChat] Error cargando transcripts:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.95) return 'text-green-600';
    if (confidence >= 0.90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.95) return 'Alta';
    if (confidence >= 0.90) return 'Media';
    return 'Baja';
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
          <p className="text-sm">Cargando transcripción...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-red-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Error cargando transcripción</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No hay transcripción disponible</p>
          <p className="text-sm">La transcripción de esta llamada no está disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* Header del Chat */}
      <div className="p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Transcripción de la Llamada</h3>
              <p className="text-sm text-gray-500">ID: {conversationId.slice(-8)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(callDuration)}</span>
          </div>
        </div>
        
        {/* Estadísticas del Chat */}
        <div className="mt-3 flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">
              Agente: {messages.filter(m => m.speaker === 'agent').length} mensajes
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">
              Cliente: {messages.filter(m => m.speaker === 'user').length} mensajes
            </span>
          </div>
        </div>
      </div>

      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.speaker === 'agent' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                message.speaker === 'agent'
                  ? 'bg-white border border-gray-200 text-gray-900'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {/* Contenido del mensaje */}
              <div className="space-y-2">
                {/* Avatar y timestamp en la misma línea */}
                <div className={`flex items-center justify-between ${
                  message.speaker === 'agent' ? 'flex-row' : 'flex-row-reverse'
                }`}>
                  <div className={`flex items-center space-x-2 ${
                    message.speaker === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`p-1.5 rounded-full ${
                      message.speaker === 'agent' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-blue-500 text-white'
                    }`}>
                      {message.speaker === 'agent' ? (
                        <Volume2 className="w-3 h-3" />
                      ) : (
                        <User className="w-3 h-3" />
                      )}
                    </div>
                    <span className={`text-xs font-medium ${
                      message.speaker === 'agent' ? 'text-gray-700' : 'text-blue-100'
                    }`}>
                      {message.speaker === 'agent' ? 'Agente' : 'Cliente'}
                    </span>
                  </div>
                  <span className={`text-xs ${
                    message.speaker === 'agent' ? 'text-gray-500' : 'text-blue-100'
                  }`}>
                    {message.formattedTime}
                  </span>
                </div>

                {/* Texto del mensaje */}
                <p className={`text-sm leading-relaxed ${
                  message.speaker === 'agent' ? 'text-gray-800' : 'text-white'
                }`}>
                  {message.text}
                </p>

                {/* Metadatos técnicos */}
                <div className={`flex items-center justify-between text-xs ${
                  message.speaker === 'agent' ? 'text-gray-400' : 'text-blue-100'
                }`}>
                  <div className="flex items-center space-x-3">
                    <span>
                      {formatDuration(message.duration)}
                    </span>
                    <span className={`font-medium ${getConfidenceColor(message.confidence)}`}>
                      Precisión: {getConfidenceLabel(message.confidence)} ({Math.round(message.confidence * 100)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer con resumen */}
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span className="font-medium">
              Total: {messages.length} mensajes
            </span>
            <span>
              Duración promedio: {formatDuration(callDuration / messages.length)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-600 font-medium">Transcripción completada</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 