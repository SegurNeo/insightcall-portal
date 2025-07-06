# 🎵 GUÍA DE PRUEBAS CON ARCHIVOS MP3

Esta guía te ayudará a probar el sistema de procesamiento de llamadas usando archivos MP3 reales.

## 🎯 ¿Qué hace este sistema?

1. **Transcribe** archivos MP3 usando Whisper de OpenAI
2. **Simula** el webhook del Gateway de Segurneo Voice
3. **Procesa** las llamadas con el pipeline completo:
   - Análisis con Gemini
   - Clasificación de tickets
   - Creación automática en Nogal (si score ≥ 0.5)
4. **Guarda** las transcripciones para revisión

## 📋 Requisitos Previos

### 1. API Keys necesarias:
```bash
# OpenAI (para transcribir MP3)
export OPENAI_API_KEY="sk-..."

# Gemini (para análisis - ya debería estar configurada)
export GEMINI_API_KEY="..."

# Segurneo (opcional, usa default si no está)
export SEGURNEO_API_KEY="..."
```

### 2. Backend corriendo:
```bash
cd server
npm install
npm run dev
```

### 3. Instalar dependencias (si no lo has hecho):
```bash
cd server
npm install
```

## 🚀 Cómo Usar

### Opción 1: Script Simplificado (Recomendado)
```bash
cd server
chmod +x test-mp3.sh
./test-mp3.sh /ruta/a/tu/carpeta/con/mp3s
```

### Opción 2: Comando Directo
```bash
cd server
npm run process-mp3 /ruta/a/tu/carpeta/con/mp3s
```

### Opción 3: Node.js Directo
```bash
cd server
npx ts-node -r tsconfig-paths/register src/test/process-mp3-files.ts /ruta/a/carpeta
```

## 📁 Estructura de Salida

Por cada archivo MP3 procesado, se creará:
```
carpeta/
├── llamada1.mp3
├── llamada1_transcription.json    # Transcripción y payload enviado
├── llamada2.mp3
├── llamada2_transcription.json
└── ...
```

## 🔍 Qué Esperar

### 1. Durante el Procesamiento:
```
🎵 Procesando archivo: llamada1.mp3
   ✅ Transcripción completada: 45 segmentos
   ✅ Payload formateado para llamada: a1b2c3d4e5f6g7h8i9j0
   ✅ Respuesta del backend: { message: 'Llamada de prueba procesada correctamente' }
   ✅ Procesamiento completado
   📄 Transcripción guardada en: llamada1_transcription.json
```

### 2. En el Dashboard:
- Las llamadas aparecerán con estado "completed"
- Los tickets se crearán automáticamente si detecta incidencias
- Podrás ver las transcripciones y análisis

### 3. En la Base de Datos:
- `processed_calls`: Nueva entrada con la llamada
- `tickets`: Tickets creados (si aplica)
- `ai_intent` y `ticket_suggestions`: Análisis de Gemini

## ⚙️ Personalización

### Modificar Datos del Cliente
En `server/src/test/process-mp3-files.ts`, línea ~104:
```typescript
clientData: {
  phone: '+34600123456',      // Cambiar teléfono
  name: 'Cliente de Prueba',  // Cambiar nombre
  dni: '12345678A',          // Cambiar DNI
  polizas: [...]             // Modificar pólizas
}
```

### Ajustar Detección de Speakers
Por defecto alterna agent/user. Para mejorar esto, modifica línea ~70:
```typescript
// En lugar de:
speaker: index % 2 === 0 ? 'agent' : 'user'

// Podrías usar lógica más sofisticada basada en el contenido
```

## 🐛 Solución de Problemas

### Error: "OPENAI_API_KEY no está configurada"
```bash
export OPENAI_API_KEY="tu-api-key-de-openai"
```

### Error: "El backend no está respondiendo"
```bash
# En otra terminal:
cd server
npm run dev
```

### Error: "No se encontraron archivos MP3"
- Verifica la ruta
- Asegúrate de que los archivos tengan extensión `.mp3`

### Los tickets no se crean
- Revisa el archivo `_transcription.json` generado
- Verifica que el contenido coincida con tipos del CSV
- Revisa los logs del backend

## 📊 Verificar Resultados

### 1. En el Dashboard Web:
- Ve a http://localhost:5173
- Las llamadas procesadas aparecerán en la lista
- Click en una llamada para ver detalles

### 2. En Supabase:
```sql
-- Ver llamadas procesadas
SELECT id, segurneo_external_call_id, ticket_ids, ai_intent
FROM processed_calls
WHERE metadata->>'source' = 'mp3-test'
ORDER BY created_at DESC;

-- Ver tickets creados
SELECT t.*, pc.segurneo_external_call_id
FROM tickets t
JOIN processed_calls pc ON pc.id = t.conversation_id
WHERE pc.metadata->>'source' = 'mp3-test';
```

### 3. En los Archivos JSON:
Cada `*_transcription.json` contiene:
- `payload`: Datos enviados al backend
- `transcription`: Transcripción completa

## 💡 Tips

1. **Prueba con pocos archivos primero** (2-3) para verificar que todo funcione
2. **Revisa las transcripciones** para asegurar calidad
3. **Monitorea los logs del backend** para ver el procesamiento
4. **Ajusta el score mínimo** si necesitas más/menos tickets automáticos

## 🚨 Importante

- Las transcripciones cuestan dinero en OpenAI (~$0.006 por minuto)
- El procesamiento puede tomar tiempo (1-2 min por archivo)
- Los datos del cliente son simulados (no se hace búsqueda real)

## 🤝 Soporte

Si encuentras problemas:
1. Revisa los logs del backend
2. Verifica las transcripciones generadas
3. Consulta `MIGRACION_TICKETS_MULTIPLES.md` para detalles técnicos

---

## 🚀 ALTERNATIVA: Transcripción Manual (Sin OpenAI)

Si no tienes API key de OpenAI o prefieres transcribir manualmente:

### 1. Crear archivo de ejemplo:
```bash
cd server
npm run process-manual example
```

Esto crea `ejemplo_transcripcion.json` con el formato esperado.

### 2. Editar el archivo con tu transcripción:
```json
{
  "fileName": "llamada_real.mp3",
  "duration": 120,  // duración en segundos
  "messages": [
    {
      "speaker": "agent",
      "text": "Buenos días, ¿en qué puedo ayudarle?"
    },
    {
      "speaker": "user", 
      "text": "Quiero cancelar mi póliza"
    }
    // ... más mensajes
  ],
  "clientData": {
    "phone": "+34600123456",
    "name": "Nombre Cliente",
    "dni": "12345678A"
  }
}
```

### 3. Procesar la transcripción:
```bash
npm run process-manual mi_transcripcion.json
```

### 4. Procesar múltiples transcripciones:
```bash
npm run process-manual /carpeta/con/jsons
```

### Ventajas de la transcripción manual:
- ✅ No requiere OpenAI API key
- ✅ Control total sobre el contenido
- ✅ Puedes especificar datos exactos del cliente
- ✅ Útil para casos de prueba específicos
- ✅ Gratis

### Desventajas:
- ❌ Requiere transcribir manualmente
- ❌ Más tiempo de preparación 