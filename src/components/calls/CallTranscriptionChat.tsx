import React, { useRef, useEffect } from 'react';
import { MessageCircle, Phone, Clock, Volume2, User } from 'lucide-react';
import { ChatMessage } from '../../services/voiceCallsRealDataService';

interface CallTranscriptionChatProps {
  messages: ChatMessage[];
  callDuration: number;
  conversationId: string;
}

export const CallTranscriptionChat: React.FC<CallTranscriptionChatProps> = ({
  messages,
  callDuration,
  conversationId
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!messages || messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No hay transcripción disponible</p>
          <p className="text-sm">La transcripción de esta llamada no está disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header del Chat */}
      <div className="p-4 bg-background border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-muted rounded-full">
              <Phone className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Transcripción de la llamada</h3>
              <p className="text-sm text-muted-foreground">ID: {conversationId.slice(-8)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(callDuration)}</span>
          </div>
        </div>
        
        {/* Estadísticas del Chat */}
        <div className="mt-3 flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-foreground rounded-full"></div>
            <span className="text-muted-foreground">
              Agente: {messages.filter(m => m.speaker === 'agent').length} mensajes
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
            <span className="text-muted-foreground">
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
                  ? 'bg-background border border-border text-foreground'
                  : 'bg-foreground text-background'
              }`}
            >
              {/* Contenido del mensaje */}
              <div className="space-y-2">
                {/* Avatar y label */}
                <div className={`flex items-center ${
                  message.speaker === 'user' ? 'justify-end' : 'justify-start'
                }`}>
                  <div className={`flex items-center space-x-2 ${
                    message.speaker === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`p-1.5 rounded-full ${
                      message.speaker === 'agent' 
                        ? 'bg-muted text-foreground' 
                        : 'bg-background text-foreground'
                    }`}>
                      {message.speaker === 'agent' ? (
                        <Volume2 className="w-3 h-3" />
                      ) : (
                        <User className="w-3 h-3" />
                      )}
                    </div>
                    <span className={`text-xs font-medium ${
                      message.speaker === 'agent' ? 'text-muted-foreground' : 'text-muted'
                    }`}>
                      {message.speaker === 'agent' ? 'Agente' : 'Cliente'}
                    </span>
                  </div>
                </div>

                {/* Texto del mensaje */}
                <p className={`text-sm leading-relaxed ${
                  message.speaker === 'agent' ? 'text-foreground' : 'text-background'
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer con resumen */}
      <div className="p-3 bg-muted border-t border-border">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span className="font-medium">
              Total: {messages.length} mensajes
            </span>
            <span>
              Duración: {formatDuration(callDuration)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-foreground rounded-full"></div>
            <span className="text-foreground font-medium">Transcripción completada</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 