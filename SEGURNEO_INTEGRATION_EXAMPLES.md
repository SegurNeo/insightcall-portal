# 🛠️ Ejemplos de Implementación - Segurneo Integration

## 📋 **Overview**

Este documento contiene ejemplos prácticos de implementación para integrar con la API de InsightCall Portal desde diferentes lenguajes de programación.

---

## 🐍 **Python**

### **Implementación Básica**

```python
import requests
import uuid
from datetime import datetime, timedelta
import json

class SegurneoVoiceAPI:
    def __init__(self, base_url="https://insightcall-portal.onrender.com", api_key="segurneo"):
        self.base_url = base_url
        self.api_key = api_key
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
    
    def send_voice_call(self, call_data):
        """
        Envía una llamada de voz a InsightCall Portal
        """
        url = f"{self.base_url}/api/v1/nogal/calls"
        
        try:
            response = requests.post(url, json=call_data, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error enviando llamada: {e}")
            if hasattr(e.response, 'text'):
                print(f"Respuesta del servidor: {e.response.text}")
            raise
    
    def get_call_details(self, call_id):
        """
        Obtiene detalles de una llamada específica
        """
        url = f"{self.base_url}/api/v1/nogal/calls/{call_id}"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error obteniendo llamada: {e}")
            raise
    
    def health_check(self):
        """
        Verifica el estado del servicio
        """
        url = f"{self.base_url}/api/v1/nogal/calls/health"
        
        try:
            # Health check no requiere autenticación
            response = requests.get(url)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error en health check: {e}")
            raise

# Ejemplo de uso
def main():
    api = SegurneoVoiceAPI()
    
    # 1. Verificar estado del servicio
    print("🔍 Verificando estado del servicio...")
    health = api.health_check()
    print(f"Estado: {health.get('status')}")
    
    # 2. Crear datos de llamada de ejemplo
    call_data = {
        "call_id": str(uuid.uuid4()),
        "conversation_id": f"conv_{int(datetime.now().timestamp())}",
        "agent_id": "agent_python_001",
        "start_time": datetime.utcnow().isoformat() + "Z",
        "end_time": (datetime.utcnow() + timedelta(minutes=5)).isoformat() + "Z",
        "duration_seconds": 300,
        "status": "completed",
        "cost": 2.75,
        "termination_reason": "call_completed",
        "transcript_summary": "Cliente consultó sobre renovación de póliza",
        "call_successful": True,
        "participant_count": {
            "agent_messages": 10,
            "user_messages": 12,
            "total_messages": 22
        },
        "audio_available": True,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    
    # 3. Enviar llamada
    print(f"📞 Enviando llamada {call_data['call_id']}...")
    result = api.send_voice_call(call_data)
    print(f"✅ Llamada enviada: {result}")
    
    # 4. Verificar que se guardó correctamente
    print("🔍 Verificando llamada guardada...")
    saved_call = api.get_call_details(call_data['call_id'])
    print(f"✅ Llamada verificada: {saved_call['success']}")

if __name__ == "__main__":
    main()
```

### **Manejo de Errores Avanzado**

```python
import time
from typing import Optional, Dict, Any

class SegurneoVoiceAPIWithRetry(SegurneoVoiceAPI):
    def __init__(self, *args, max_retries=3, retry_delay=1, **kwargs):
        super().__init__(*args, **kwargs)
        self.max_retries = max_retries
        self.retry_delay = retry_delay
    
    def send_voice_call_with_retry(self, call_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Envía llamada con reintentos automáticos
        """
        for attempt in range(self.max_retries + 1):
            try:
                return self.send_voice_call(call_data)
            except requests.exceptions.HTTPError as e:
                if e.response.status_code in [400, 401, 409]:
                    # Errores que no se deben reintentar
                    print(f"❌ Error permanente: {e.response.status_code}")
                    print(f"Respuesta: {e.response.text}")
                    return None
                elif attempt < self.max_retries:
                    print(f"⚠️ Intento {attempt + 1} falló, reintentando en {self.retry_delay}s...")
                    time.sleep(self.retry_delay)
                else:
                    print(f"❌ Falló después de {self.max_retries} intentos")
                    raise
            except Exception as e:
                if attempt < self.max_retries:
                    print(f"⚠️ Error inesperado en intento {attempt + 1}: {e}")
                    time.sleep(self.retry_delay)
                else:
                    raise
        
        return None
```

---

## 🟨 **JavaScript/Node.js**

### **Implementación con Axios**

```javascript
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class SegurneoVoiceAPI {
    constructor(baseURL = 'https://insightcall-portal.onrender.com', apiKey = 'segurneo') {
        this.baseURL = baseURL;
        this.apiKey = apiKey;
        this.client = axios.create({
            baseURL: baseURL,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            timeout: 30000 // 30 segundos
        });
        
        // Interceptor para logging
        this.client.interceptors.request.use(
            config => {
                console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            error => Promise.reject(error)
        );
        
        this.client.interceptors.response.use(
            response => {
                console.log(`✅ ${response.status} ${response.config.url}`);
                return response;
            },
            error => {
                console.error(`❌ ${error.response?.status} ${error.config?.url}`);
                console.error('Error details:', error.response?.data);
                return Promise.reject(error);
            }
        );
    }
    
    async sendVoiceCall(callData) {
        try {
            const response = await this.client.post('/api/v1/nogal/calls', callData);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to send voice call: ${error.message}`);
        }
    }
    
    async getCallDetails(callId) {
        try {
            const response = await this.client.get(`/api/v1/nogal/calls/${callId}`);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get call details: ${error.message}`);
        }
    }
    
    async healthCheck() {
        try {
            // Health check no necesita autenticación
            const response = await axios.get(`${this.baseURL}/api/v1/nogal/calls/health`);
            return response.data;
        } catch (error) {
            throw new Error(`Health check failed: ${error.message}`);
        }
    }
    
    async getStats() {
        try {
            const response = await this.client.get('/api/v1/nogal/calls/stats');
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get stats: ${error.message}`);
        }
    }
}

// Ejemplo de uso
async function main() {
    const api = new SegurneoVoiceAPI();
    
    try {
        // 1. Health check
        console.log('🔍 Checking service health...');
        const health = await api.healthCheck();
        console.log('Service status:', health.status);
        
        // 2. Crear llamada de ejemplo
        const callData = {
            call_id: uuidv4(),
            conversation_id: `conv_js_${Date.now()}`,
            agent_id: 'agent_js_001',
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 4 * 60 * 1000).toISOString(), // +4 min
            duration_seconds: 240,
            status: 'completed',
            cost: 3.20,
            termination_reason: 'call_completed',
            transcript_summary: 'Cliente preguntó sobre cobertura de seguro',
            call_successful: true,
            participant_count: {
                agent_messages: 8,
                user_messages: 11,
                total_messages: 19
            },
            audio_available: true,
            created_at: new Date().toISOString()
        };
        
        // 3. Enviar llamada
        console.log(`📞 Sending call ${callData.call_id}...`);
        const result = await api.sendVoiceCall(callData);
        console.log('✅ Call sent successfully:', result);
        
        // 4. Verificar llamada
        console.log('🔍 Verifying saved call...');
        const savedCall = await api.getCallDetails(callData.call_id);
        console.log('✅ Call verified:', savedCall.success);
        
        // 5. Obtener estadísticas
        console.log('📊 Getting stats...');
        const stats = await api.getStats();
        console.log('Stats:', stats.data);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Ejecutar ejemplo
if (require.main === module) {
    main();
}

module.exports = SegurneoVoiceAPI;
```

### **Implementación con TypeScript**

```typescript
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface VoiceCallPayload {
    call_id: string;
    conversation_id: string;
    agent_id: string;
    start_time: string;
    end_time: string;
    duration_seconds: number;
    status: 'completed' | 'failed' | 'abandoned';
    cost: number;
    termination_reason?: string;
    transcript_summary?: string;
    call_successful: boolean;
    participant_count: {
        agent_messages: number;
        user_messages: number;
        total_messages: number;
    };
    audio_available: boolean;
    created_at: string;
}

interface VoiceCallResponse {
    success: boolean;
    message: string;
    call_id?: string;
    nogal_internal_id?: string;
    data?: any;
    errors?: string[];
}

interface HealthCheckResponse {
    status: string;
    timestamp: string;
    database: string;
    auth: string;
    version: string;
}

class SegurneoVoiceAPITS {
    private client: AxiosInstance;
    
    constructor(
        private baseURL: string = 'https://insightcall-portal.onrender.com',
        private apiKey: string = 'segurneo'
    ) {
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            timeout: 30000
        });
    }
    
    async sendVoiceCall(callData: VoiceCallPayload): Promise<VoiceCallResponse> {
        try {
            const response: AxiosResponse<VoiceCallResponse> = await this.client.post(
                '/api/v1/nogal/calls',
                callData
            );
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to send voice call: ${error.message}`);
        }
    }
    
    async getCallDetails(callId: string): Promise<VoiceCallResponse> {
        try {
            const response: AxiosResponse<VoiceCallResponse> = await this.client.get(
                `/api/v1/nogal/calls/${callId}`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get call details: ${error.message}`);
        }
    }
    
    async healthCheck(): Promise<HealthCheckResponse> {
        try {
            const response: AxiosResponse<HealthCheckResponse> = await axios.get(
                `${this.baseURL}/api/v1/nogal/calls/health`
            );
            return response.data;
        } catch (error: any) {
            throw new Error(`Health check failed: ${error.message}`);
        }
    }
}

export { SegurneoVoiceAPITS, VoiceCallPayload, VoiceCallResponse, HealthCheckResponse };
```

---

## ☕ **Java**

### **Implementación con OkHttp**

```java
import okhttp3.*;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.IOException;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

public class SegurneoVoiceAPI {
    private static final String BASE_URL = "https://insightcall-portal.onrender.com";
    private static final String API_KEY = "segurneo";
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    
    private final OkHttpClient client;
    private final Gson gson;
    private final String baseUrl;
    private final String apiKey;
    
    public SegurneoVoiceAPI() {
        this(BASE_URL, API_KEY);
    }
    
    public SegurneoVoiceAPI(String baseUrl, String apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.gson = new GsonBuilder()
            .setPrettyPrinting()
            .create();
        
        this.client = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(new LoggingInterceptor())
            .build();
    }
    
    public VoiceCallResponse sendVoiceCall(VoiceCallPayload callData) throws IOException {
        String json = gson.toJson(callData);
        RequestBody body = RequestBody.create(json, JSON);
        
        Request request = new Request.Builder()
            .url(baseUrl + "/api/v1/nogal/calls")
            .post(body)
            .addHeader("Authorization", "Bearer " + apiKey)
            .addHeader("Content-Type", "application/json")
            .build();
        
        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body().string();
            
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected response: " + response.code() + " " + responseBody);
            }
            
            return gson.fromJson(responseBody, VoiceCallResponse.class);
        }
    }
    
    public VoiceCallResponse getCallDetails(String callId) throws IOException {
        Request request = new Request.Builder()
            .url(baseUrl + "/api/v1/nogal/calls/" + callId)
            .get()
            .addHeader("Authorization", "Bearer " + apiKey)
            .build();
        
        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body().string();
            
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected response: " + response.code() + " " + responseBody);
            }
            
            return gson.fromJson(responseBody, VoiceCallResponse.class);
        }
    }
    
    public HealthCheckResponse healthCheck() throws IOException {
        Request request = new Request.Builder()
            .url(baseUrl + "/api/v1/nogal/calls/health")
            .get()
            .build();
        
        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body().string();
            
            if (!response.isSuccessful()) {
                throw new IOException("Health check failed: " + response.code() + " " + responseBody);
            }
            
            return gson.fromJson(responseBody, HealthCheckResponse.class);
        }
    }
    
    // Clases de datos
    public static class VoiceCallPayload {
        public String call_id;
        public String conversation_id;
        public String agent_id;
        public String start_time;
        public String end_time;
        public int duration_seconds;
        public String status;
        public double cost;
        public String termination_reason;
        public String transcript_summary;
        public boolean call_successful;
        public ParticipantCount participant_count;
        public boolean audio_available;
        public String created_at;
        
        public static class ParticipantCount {
            public int agent_messages;
            public int user_messages;
            public int total_messages;
        }
    }
    
    public static class VoiceCallResponse {
        public boolean success;
        public String message;
        public String call_id;
        public String nogal_internal_id;
        public Object data;
        public String[] errors;
    }
    
    public static class HealthCheckResponse {
        public String status;
        public String timestamp;
        public String database;
        public String auth;
        public String version;
    }
    
    // Interceptor para logging
    private static class LoggingInterceptor implements Interceptor {
        @Override
        public Response intercept(Chain chain) throws IOException {
            Request request = chain.request();
            System.out.println("🚀 " + request.method() + " " + request.url());
            
            Response response = chain.proceed(request);
            System.out.println("✅ " + response.code() + " " + request.url());
            
            return response;
        }
    }
    
    // Ejemplo de uso
    public static void main(String[] args) {
        SegurneoVoiceAPI api = new SegurneoVoiceAPI();
        
        try {
            // 1. Health check
            System.out.println("🔍 Checking service health...");
            HealthCheckResponse health = api.healthCheck();
            System.out.println("Service status: " + health.status);
            
            // 2. Crear llamada de ejemplo
            VoiceCallPayload callData = new VoiceCallPayload();
            callData.call_id = UUID.randomUUID().toString();
            callData.conversation_id = "conv_java_" + System.currentTimeMillis();
            callData.agent_id = "agent_java_001";
            callData.start_time = Instant.now().toString();
            callData.end_time = Instant.now().plusSeconds(300).toString();
            callData.duration_seconds = 300;
            callData.status = "completed";
            callData.cost = 2.95;
            callData.termination_reason = "call_completed";
            callData.transcript_summary = "Cliente preguntó sobre deducible";
            callData.call_successful = true;
            callData.participant_count = new VoiceCallPayload.ParticipantCount();
            callData.participant_count.agent_messages = 9;
            callData.participant_count.user_messages = 13;
            callData.participant_count.total_messages = 22;
            callData.audio_available = true;
            callData.created_at = Instant.now().toString();
            
            // 3. Enviar llamada
            System.out.println("📞 Sending call " + callData.call_id + "...");
            VoiceCallResponse result = api.sendVoiceCall(callData);
            System.out.println("✅ Call sent successfully: " + result.success);
            
            // 4. Verificar llamada
            System.out.println("🔍 Verifying saved call...");
            VoiceCallResponse savedCall = api.getCallDetails(callData.call_id);
            System.out.println("✅ Call verified: " + savedCall.success);
            
        } catch (IOException e) {
            System.err.println("❌ Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
```

---

## 🧪 **Script de Testing Rápido**

### **Bash/cURL**

```bash
#!/bin/bash

# Configuración
BASE_URL="https://insightcall-portal.onrender.com"
API_KEY="segurneo"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Segurneo Voice API Integration Test"
echo "======================================"

# 1. Health Check
echo -e "\n${YELLOW}1. Health Check${NC}"
health_response=$(curl -s -X GET "$BASE_URL/api/v1/nogal/calls/health")
health_status=$(echo "$health_response" | jq -r '.status // "unknown"')

if [ "$health_status" = "healthy" ]; then
    echo -e "${GREEN}✅ Service is healthy${NC}"
else
    echo -e "${RED}❌ Service health check failed${NC}"
    echo "$health_response"
    exit 1
fi

# 2. Generate test data
CALL_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
CONV_ID="conv_test_$(date +%s)"
START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
END_TIME=$(date -u -d "+5 minutes" +"%Y-%m-%dT%H:%M:%S.000Z")

echo -e "\n${YELLOW}2. Sending Test Call${NC}"
echo "Call ID: $CALL_ID"

# 3. Send voice call
call_payload='{
    "call_id": "'$CALL_ID'",
    "conversation_id": "'$CONV_ID'",
    "agent_id": "agent_test_001",
    "start_time": "'$START_TIME'",
    "end_time": "'$END_TIME'",
    "duration_seconds": 300,
    "status": "completed",
    "cost": 1.99,
    "termination_reason": "call_completed",
    "transcript_summary": "Test call from bash script",
    "call_successful": true,
    "participant_count": {
        "agent_messages": 6,
        "user_messages": 9,
        "total_messages": 15
    },
    "audio_available": false,
    "created_at": "'$START_TIME'"
}'

send_response=$(curl -s -X POST "$BASE_URL/api/v1/nogal/calls" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d "$call_payload")

send_success=$(echo "$send_response" | jq -r '.success // false')

if [ "$send_success" = "true" ]; then
    echo -e "${GREEN}✅ Call sent successfully${NC}"
    nogal_id=$(echo "$send_response" | jq -r '.nogal_internal_id // "unknown"')
    echo "Nogal Internal ID: $nogal_id"
else
    echo -e "${RED}❌ Failed to send call${NC}"
    echo "$send_response" | jq '.'
    exit 1
fi

# 4. Verify call was saved
echo -e "\n${YELLOW}3. Verifying Saved Call${NC}"
sleep 2  # Wait a bit for processing

verify_response=$(curl -s -X GET "$BASE_URL/api/v1/nogal/calls/$CALL_ID" \
    -H "Authorization: Bearer $API_KEY")

verify_success=$(echo "$verify_response" | jq -r '.success // false')

if [ "$verify_success" = "true" ]; then
    echo -e "${GREEN}✅ Call verified successfully${NC}"
    echo "Call data retrieved and confirmed"
else
    echo -e "${RED}❌ Failed to verify call${NC}"
    echo "$verify_response" | jq '.'
fi

# 5. Get stats
echo -e "\n${YELLOW}4. Getting Statistics${NC}"
stats_response=$(curl -s -X GET "$BASE_URL/api/v1/nogal/calls/stats" \
    -H "Authorization: Bearer $API_KEY")

stats_success=$(echo "$stats_response" | jq -r '.success // false')

if [ "$stats_success" = "true" ]; then
    echo -e "${GREEN}✅ Stats retrieved successfully${NC}"
    echo "$stats_response" | jq '.data'
else
    echo -e "${YELLOW}⚠️  Stats endpoint may not be fully implemented${NC}"
fi

echo -e "\n${GREEN}🎉 Integration test completed successfully!${NC}"
echo "======================================"
```

---

## 📋 **Checklist de Implementación**

### **Antes de Empezar**
- [ ] Verificar conectividad con `curl -X GET https://insightcall-portal.onrender.com/api/v1/nogal/calls/health`
- [ ] Confirmar API key: `segurneo`
- [ ] Revisar documentación en `SEGURNEO_API_INTEGRATION.md`

### **Durante la Implementación**
- [ ] Implementar autenticación con Bearer token
- [ ] Manejar respuestas de error (400, 401, 409, 500)
- [ ] Implementar reintentos para errores 5xx
- [ ] Validar payload antes de enviar
- [ ] Loggear requests y responses para debugging

### **Testing**
- [ ] Probar con datos válidos
- [ ] Probar con datos inválidos (validación)
- [ ] Probar duplicados (409 Conflict)
- [ ] Probar sin autenticación (401)
- [ ] Verificar que las llamadas se guardan correctamente

### **Producción**
- [ ] Configurar timeouts apropiados (30s recomendado)
- [ ] Implementar monitoring de requests fallidas
- [ ] Configurar alertas para errores frecuentes
- [ ] Documentar el proceso para el equipo

---

## 🆘 **Soporte**

Si necesitas ayuda con la implementación:

1. **Revisar logs** del servidor para más detalles sobre errores
2. **Usar health check** para verificar conectividad
3. **Contactar a Pablo Senabre** con detalles específicos del error

**Happy coding! 🚀** 