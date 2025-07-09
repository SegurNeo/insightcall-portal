// src/lib/elevenlabs-api.ts

// Accede a las variables de entorno usando import.meta.env para Vite
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY; 
// Asegúrate de renombrar NEXT_PUBLIC_ELEVENLABS_AGENT_ID a VITE_ELEVENLABS_AGENT_ID en tu .env
const ELEVENLABS_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID; 
const API_BASE_URL = "https://api.elevenlabs.io/v1/convai/agents";

interface AgentConfigPayload {
  conversation_config?: {
    agent?: {
      first_message?: string;
    };
    asr?: {
      quality?: 'high' | 'low';
    };
    turn?: {
      turn_timeout?: number;
    };
    tts?: {
      stability?: number;
      similarity_boost?: number;
    };
  };
  // Include other top-level fields from the API if needed, like 'name'
  // name?: string; 
}

// Define a more detailed type based on the API response if necessary
// This might involve nesting based on the GET response structure
interface AgentDetails {
   agent_id: string;
   name: string;
   conversation_config: {
     agent: {
       first_message: string;
       language: string; 
     };
     asr: {
       quality: 'high' | 'low';
       provider: string;
       // ... other asr fields
     };
     turn: {
       turn_timeout: number;
       mode: string;
     };
     tts: {
       model_id: string;
       voice_id: string;
       stability: number;
       similarity_boost: number;
       // ... other tts fields
     };
     // ... other conversation_config fields
   };
   // ... other top-level fields from the GET response
}


export const getAgentConfig = async (): Promise<AgentDetails> => {
  if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID) {
    // Updated error message slightly for clarity
    throw new Error("ElevenLabs API Key or Agent ID is missing in environment variables (VITE_ELEVENLABS_API_KEY, VITE_ELEVENLABS_AGENT_ID).");
  }

  const response = await fetch(`${API_BASE_URL}/${ELEVENLABS_AGENT_ID}`, {
    method: 'GET',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error fetching agent config:", errorData);
    throw new Error(`Failed to fetch agent config: ${response.statusText}`);
  }

  return response.json();
};

export const updateAgentConfig = async (payload: AgentConfigPayload): Promise<void> => {
  if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID) {
     // Updated error message slightly for clarity
    throw new Error("ElevenLabs API Key or Agent ID is missing in environment variables (VITE_ELEVENLABS_API_KEY, VITE_ELEVENLABS_AGENT_ID).");
  }

  const response = await fetch(`${API_BASE_URL}/${ELEVENLABS_AGENT_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
     const errorData = await response.json();
     console.error("Error updating agent config:", errorData);
     throw new Error(`Failed to update agent config: ${response.statusText}`);
  }
  
  // The API returns 200 OK with an empty body on successful update
  // console.log("Agent config updated successfully."); 
}; 