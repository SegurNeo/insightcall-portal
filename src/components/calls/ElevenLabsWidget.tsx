
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ElevenLabsWidget = () => {
  const [apiKey, setApiKey] = useState("");
  const [agentId, setAgentId] = useState("");
  const [voiceId, setVoiceId] = useState("pFZP5JQG7iQjIQuC4Bku"); // Lily por defecto
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();

  const handleConnect = () => {
    if (!apiKey || !agentId) {
      toast({
        title: "Error de conexión",
        description: "Por favor, introduce tu API Key y ID del agente",
        variant: "destructive",
      });
      return;
    }

    // Aquí iría la lógica real de conexión con ElevenLabs
    toast({
      title: "Conexión establecida",
      description: "Se ha conectado correctamente con ElevenLabs",
    });
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    // Aquí iría la lógica real de desconexión
    setIsConnected(false);
    setIsSpeaking(false);
    toast({
      title: "Desconectado",
      description: "Se ha desconectado de ElevenLabs",
    });
  };

  const toggleSpeaking = () => {
    setIsSpeaking(!isSpeaking);
    toast({
      title: isSpeaking ? "Micrófono desactivado" : "Micrófono activado",
      description: isSpeaking 
        ? "Ya no estás enviando audio a ElevenLabs" 
        : "Enviando audio a ElevenLabs",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Phone className="h-5 w-5 mr-2 text-primary" />
          ElevenLabs Asistente Virtual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
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
            </div>
            <div className="space-y-2">
              <label htmlFor="agent-id" className="text-sm font-medium">ID del Agente</label>
              <Input
                id="agent-id"
                placeholder="ID del agente conversacional"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="voice" className="text-sm font-medium">Voz</label>
              <Select value={voiceId} onValueChange={setVoiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una voz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pFZP5JQG7iQjIQuC4Bku">Lily (Español)</SelectItem>
                  <SelectItem value="EXAVITQu4vr4xnSDxMaL">Sarah (Inglés)</SelectItem>
                  <SelectItem value="TX3LPaxmHKxFdv7VOQHJ">Liam (Inglés)</SelectItem>
                  <SelectItem value="XB0fDUnXU5powFXDhCwa">Charlotte (Inglés)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className={`mx-auto h-24 w-24 rounded-full flex items-center justify-center ${isSpeaking ? 'bg-primary/10 text-primary animate-pulse' : 'bg-muted'}`}>
              {isSpeaking ? (
                <Mic className="h-12 w-12" />
              ) : (
                <MicOff className="h-12 w-12" />
              )}
            </div>
            <div className="text-sm">
              {isSpeaking 
                ? "Asistente escuchando..." 
                : "Haz clic en el botón para activar el micrófono"}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {isConnected ? (
          <>
            <Button variant="outline" onClick={handleDisconnect} className="w-1/2">
              <PhoneOff className="h-4 w-4 mr-2" />
              Desconectar
            </Button>
            <Button 
              onClick={toggleSpeaking}
              variant={isSpeaking ? "destructive" : "default"}
              className="w-1/2 ml-2"
            >
              {isSpeaking ? (
                <>
                  <MicOff className="h-4 w-4 mr-2" />
                  Detener
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Hablar
                </>
              )}
            </Button>
          </>
        ) : (
          <Button onClick={handleConnect} className="w-full">
            <Phone className="h-4 w-4 mr-2" />
            Conectar con ElevenLabs
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ElevenLabsWidget;
