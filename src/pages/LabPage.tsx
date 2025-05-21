import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { getAgentConfig, updateAgentConfig } from "@/lib/elevenlabs-api";

// Define the type for the form state (can be simpler than the full API response)
type LabFormState = {
  first_message: string;
  asr_quality: 'high' | 'low';
  turn_timeout: number;
  tts_stability: number;
  tts_similarity_boost: number;
};

const LabPage = () => {
  const { toast } = useToast();
  // Use the form state type
  const [config, setConfig] = useState<Partial<LabFormState>>({}); 
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    const fetchConfig = async () => {
      // setIsLoading(true); // Already set initially
      try {
        const agentDetails = await getAgentConfig();
        // Map the relevant fields from the nested API response to our flat state
        setConfig({
          first_message: agentDetails.conversation_config.agent.first_message,
          asr_quality: agentDetails.conversation_config.asr.quality,
          turn_timeout: agentDetails.conversation_config.turn.turn_timeout,
          tts_stability: agentDetails.conversation_config.tts.stability,
          tts_similarity_boost: agentDetails.conversation_config.tts.similarity_boost,
        });
      } catch (error) {
        console.error("Failed to load agent config:", error);
        toast({
          title: "Error al Cargar",
          description: "No se pudo obtener la configuración del agente. Verifica la consola.",
          variant: "destructive",
        });
        // Set default values or handle error state appropriately
        setConfig({}); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [toast]); // Add toast to dependency array

  const handleInputChange = (key: keyof LabFormState, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSliderChange = (key: keyof LabFormState, value: number[]) => {
    // Ensure the value is handled correctly (Slider passes an array)
    setConfig(prev => ({ ...prev, [key]: value[0] }));
  };

  const handleSave = async () => {
    // Ensure all necessary config values are present before saving
    if (config.first_message === undefined || config.asr_quality === undefined || config.turn_timeout === undefined || config.tts_stability === undefined || config.tts_similarity_boost === undefined) {
       toast({
         title: "Faltan Datos",
         description: "Por favor, completa todos los campos antes de guardar.",
         variant: "destructive",
       });
       return;
    }

    setIsSaving(true);
    
    // Construct the nested payload expected by the API
    // Ensure types match the expected payload structure (may need parseFloat etc. if inputs give strings)
    const payload = {
        conversation_config: {
            agent: {
                first_message: config.first_message,
            },
            asr: {
                quality: config.asr_quality,
            },
            turn: {
                // Ensure this is a number
                turn_timeout: typeof config.turn_timeout === 'string' ? parseFloat(config.turn_timeout) : config.turn_timeout,
            },
            tts: {
                // Ensure these are numbers
                stability: typeof config.tts_stability === 'string' ? parseFloat(config.tts_stability) : config.tts_stability,
                similarity_boost: typeof config.tts_similarity_boost === 'string' ? parseFloat(config.tts_similarity_boost) : config.tts_similarity_boost,
            },
        },
    };

    console.log("Saving config with payload:", payload);
    
    try {
      await updateAgentConfig(payload);
      toast({
        title: "Configuración guardada",
        description: "Los parámetros del agente han sido actualizados correctamente.",
      });
    } catch (error) {
      console.error("Error saving config:", error);
      toast({
        title: "Error al guardar",
        description: `No se pudo actualizar la configuración: ${error instanceof Error ? error.message : 'Error desconocido'}.`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          Cargando configuración del laboratorio...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Laboratorio del agente</h1>
        <p className="text-muted-foreground">
          Experimenta con parámetros avanzados del agente conversacional de ElevenLabs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parámetros configurables</CardTitle>
          <CardDescription>
            Modifica estos valores para ajustar el comportamiento y la voz del agente. Los cambios pueden tardar unos momentos en aplicarse.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* First Message */}
          <div className="space-y-2">
            <Label htmlFor="first_message">Primer mensaje del agente</Label>
            <Textarea
              id="first_message"
              placeholder="Escribe el mensaje inicial que dirá el agente..."
              value={config.first_message || ''} // Use updated state
              onChange={(e) => handleInputChange('first_message', e.target.value)}
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              El saludo o la pregunta inicial que el agente usará al comenzar la conversación.
            </p>
          </div>

          {/* ASR Quality */}
          <div className="space-y-2">
            <Label htmlFor="asr_quality">Calidad del reconocimiento de voz</Label>
            <Select 
              value={config.asr_quality || ''} // Use updated state
              onValueChange={(value: 'high' | 'low') => handleInputChange('asr_quality', value)}
            >
              <SelectTrigger id="asr_quality">
                <SelectValue placeholder="Selecciona la calidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Ajusta la precisión del reconocimiento de voz. 'Alta' es más precisa pero puede tener mayor latencia.
            </p>
          </div>

          {/* Turn Timeout */}
          <div className="space-y-2">
            <Label htmlFor="turn_timeout">Timeout de turno (segundos)</Label>
            <Input
              id="turn_timeout"
              type="number"
              step="0.1"
              min="0.5"
              max="15"
              value={config.turn_timeout ?? ''} // Use updated state, handle potential undefined
              onChange={(e) => handleInputChange('turn_timeout', e.target.value)} // Store as string, parse on save
              className="w-32"
            />
            <p className="text-sm text-muted-foreground">
              Tiempo máximo en segundos que el agente espera en silencio antes de considerar que el interlocutor ha terminado de hablar.
            </p>
          </div>

          {/* TTS Stability */}
          <div className="space-y-2">
            <Label htmlFor="tts_stability">Estabilidad de voz</Label>
            <Slider
              id="tts_stability"
              min={0}
              max={1}
              step={0.05}
              value={[config.tts_stability ?? 0.5]} // Default if undefined
              onValueChange={(value) => handleSliderChange('tts_stability', value)}
              // Make sure Slider component handles number[] correctly
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Más variable</span>
               {/* Display formatted value */}
              <span>{config.tts_stability !== undefined ? config.tts_stability.toFixed(2) : '-'}</span> 
              <span>Más estable</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Controla la variabilidad de la voz. Valores más altos la hacen más monótona pero consistente.
            </p>
          </div>

          {/* TTS Similarity Boost */}
          <div className="space-y-2">
            <Label htmlFor="tts_similarity">Claridad + similitud</Label>
            <Slider
              id="tts_similarity"
              min={0}
              max={1}
              step={0.05}
              value={[config.tts_similarity_boost ?? 0.5]} // Default if undefined
              onValueChange={(value) => handleSliderChange('tts_similarity_boost', value)}
               // Make sure Slider component handles number[] correctly
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Menos clara</span>
               {/* Display formatted value */}
              <span>{config.tts_similarity_boost !== undefined ? config.tts_similarity_boost.toFixed(2) : '-'}</span>
              <span>Más clara</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Aumenta la claridad y la similitud con la voz original. Puede afectar ligeramente la naturalidad si es muy alto.
            </p>
          </div>
          
          <div>
            <Button onClick={handleSave} disabled={isSaving || isLoading}>
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default LabPage; 