
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Phone, PhoneOff, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Este componente incluye comentarios de código que usaría la biblioteca @11labs/react
// cuando esté completamente implementado

const ElevenLabsConversation = () => {
  const [apiKey, setApiKey] = useState("");
  const [agentId, setAgentId] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversation, setConversation] = useState<any>(null);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Cuando implementemos completamente, usaríamos:
  // const conversation = useConversation({
  //   clientTools: {
  //     displayMessage: (parameters: {text: string}) => {
  //       toast({
  //         title: "Mensaje del asistente",
  //         description: parameters.text
  //       });
  //       return "Mensaje mostrado";
  //     }
  //   },
  //   overrides: {
  //     agent: {
  //       language: "es",
  //     },
  //     tts: {
  //       voiceId: "pFZP5JQG7iQjIQuC4Bku" // Lily (español)
  //     },
  //   },
  //   onConnect: () => setIsConnected(true),
  //   onDisconnect: () => setIsConnected(false),
  //   onMessage: (message) => console.log("Mensaje recibido:", message),
  //   onError: (error) => {
  //     console.error("Error en la conversación:", error);
  //     toast({
  //       title: "Error de conexión",
  //       description: "Ha ocurrido un error en la comunicación con ElevenLabs",
  //       variant: "destructive"
  //     });
  //   }
  // });

  const checkMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission(true);
      return true;
    } catch (error) {
      console.error("Error al solicitar permisos de micrófono:", error);
      setMicPermission(false);
      toast({
        title: "Permiso denegado",
        description: "Necesitamos acceso al micrófono para usar el asistente virtual",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleConfigure = () => {
    if (!apiKey || !agentId) {
      toast({
        title: "Configuración incompleta",
        description: "Por favor, introduce tu API Key y ID del agente",
        variant: "destructive",
      });
      return;
    }

    // Almacenar la configuración (en producción, habría que hacerlo de forma segura)
    localStorage.setItem("elevenLabsApiKey", apiKey);
    localStorage.setItem("elevenLabsAgentId", agentId);
    
    setIsConfigured(true);
    toast({
      title: "Configuración guardada",
      description: "La configuración del asistente ha sido guardada"
    });
  };

  const handleStartConversation = async () => {
    const hasPermission = await checkMicrophonePermission();
    if (!hasPermission) return;
    
    // Simulamos la conexión, en la implementación real usaríamos:
    // const conversationId = await conversation.startSession({ 
    //   agentId: agentId 
    // });
    
    setIsConnected(true);
    toast({
      title: "Conexión establecida",
      description: "El asistente virtual está listo para conversar"
    });
  };

  const handleEndConversation = () => {
    // En la implementación real: await conversation.endSession();
    setIsConnected(false);
    setIsSpeaking(false);
    toast({
      title: "Conversación finalizada",
      description: "Se ha desconectado del asistente virtual"
    });
  };

  const toggleMicrophone = () => {
    setIsSpeaking(!isSpeaking);
    // En la implementación real manejaríamos el volumen:
    // if (!isSpeaking) {
    //   conversation.setVolume({ volume: 1.0 });
    // } else {
    //   conversation.setVolume({ volume: 0 });
    // }
    
    toast({
      title: isSpeaking ? "Micrófono desactivado" : "Micrófono activado",
      description: isSpeaking 
        ? "Ya no estás enviando audio al asistente" 
        : "El asistente está escuchando"
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Phone className="h-5 w-5 mr-2 text-primary" />
          Asistente Virtual ElevenLabs
        </CardTitle>
        <CardDescription>
          Conversación en tiempo real con IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConfigured ? (
          <>
            <div className="space-y-2">
              <label htmlFor="api-key" className="text-sm font-medium">API Key</label>
              <Input
                id="api-key"
                type="password"
                placeholder="Introduce tu API Key de ElevenLabs"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Puedes obtener tu API Key en tu cuenta de ElevenLabs
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="agent-id" className="text-sm font-medium">ID del Agente</label>
              <Input
                id="agent-id"
                placeholder="ID del agente conversacional"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Encontrarás este ID en la configuración de tu agente en ElevenLabs
              </p>
            </div>
          </>
        ) : !isConnected ? (
          <>
            <Alert>
              <AlertDescription>
                Configuración guardada. Haz clic en "Iniciar conversación" para comenzar.
              </AlertDescription>
            </Alert>
            
            <div className="text-sm space-y-4">
              <p>
                Cuando inicies la conversación, se te pedirá permiso para acceder al micrófono.
                Esto es necesario para que el asistente pueda escucharte.
              </p>
              
              <h3 className="font-medium">Recomendaciones:</h3>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>Habla claramente y a un ritmo normal</li>
                <li>Reduce el ruido de fondo cuando sea posible</li>
                <li>Haz preguntas o solicitudes específicas</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="text-center space-y-6 py-4">
            <div className={`mx-auto h-32 w-32 rounded-full flex items-center justify-center ${isSpeaking ? 'bg-primary/10 text-primary animate-pulse' : 'bg-muted'}`}>
              {isSpeaking ? (
                <Mic className="h-16 w-16" />
              ) : (
                <MicOff className="h-16 w-16" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium">
                {isSpeaking ? "Asistente escuchando..." : "Micrófono en pausa"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isSpeaking 
                  ? "Habla con claridad para que el asistente te entienda" 
                  : "Activa el micrófono para hablar con el asistente"}
              </p>
            </div>
            
            {/* Aquí podríamos mostrar una transcripción de lo que se está diciendo */}
            {/* {isSpeaking && (
              <div className="bg-muted p-4 rounded-md text-sm">
                "Transcripción en tiempo real aparecería aquí..."
              </div>
            )} */}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!isConfigured ? (
          <Button onClick={handleConfigure} className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Guardar configuración
          </Button>
        ) : !isConnected ? (
          <div className="flex w-full space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setIsConfigured(false)} 
              className="w-1/2"
            >
              <Settings className="h-4 w-4 mr-2" />
              Editar configuración
            </Button>
            <Button 
              onClick={handleStartConversation} 
              className="w-1/2"
            >
              <Phone className="h-4 w-4 mr-2" />
              Iniciar conversación
            </Button>
          </div>
        ) : (
          <div className="flex w-full space-x-4">
            <Button 
              variant="outline" 
              onClick={handleEndConversation} 
              className="w-1/2"
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              Finalizar
            </Button>
            <Button 
              onClick={toggleMicrophone}
              variant={isSpeaking ? "destructive" : "default"}
              className="w-1/2"
            >
              {isSpeaking ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Pausar micrófono
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Activar micrófono
                </>
              )}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ElevenLabsConversation;
