# 🎵 Nuevos Campos de Audio - Dashboard Nogal

## 📋 **Resumen**
El middleware ahora incluye **3 campos nuevos** relacionados con audio de llamadas en el payload que se envía al dashboard.

## 🔄 **Flujo actualizado**
1. ElevenLabs envía transcripción → Middleware guarda en BD
2. ElevenLabs envía audio → Middleware procesa audio + envía llamada COMPLETA a Nogal
3. Dashboard recibe llamada con audio listo para usar

## 📦 **Nuevos campos en el payload**

### **1. `audio_download_url`** (string | null)
```json
"audio_download_url": "https://audio-cdn.segurneo.com/audio/conv-12345-1738251234-abc123.mp3"
```
- **URL pública** para reproducir/descargar el audio
- **Validez**: 60 días
- **Uso**: Player HTML5 en dashboard, descargas directas

### **2. `audio_file_size`** (number | null)  
```json
"audio_file_size": 2847392
```
- **Tamaño en bytes** del archivo de audio
- **Uso**: Mostrar tamaño amigable en UI ("2.8 MB")

### **3. `ficheroLlamada`** (string | null)
```json
"ficheroLlamada": "https://audio-cdn.segurneo.com/audio/conv-12345-1738251234-abc123.mp3"
```
- **Misma URL** que `audio_download_url` 
- **Uso**: Compatible con sistema de tickets existente

## 📄 **Ejemplo de payload completo**
```json
{
  "conversation_id": "conv_01k04yrty2f129hdef526edy3d",
  "agent_id": "agent_01jym1fbthfhttdrgyqvdx5xtq",
  "start_time": "2025-01-15T10:30:00+01:00",
  "end_time": "2025-01-15T10:35:00+01:00", 
  "duration_seconds": 300,
  "status": "completed",
  "cost": 1250,
  "transcript_summary": "Consulta sobre póliza de seguro...",
  
  // 🎵 NUEVOS CAMPOS DE AUDIO:
  "audio_download_url": "https://audio-cdn.segurneo.com/audio/conv-12345-1738251234-abc123.mp3",
  "audio_file_size": 2847392,
  "ficheroLlamada": "https://audio-cdn.segurneo.com/audio/conv-12345-1738251234-abc123.mp3",
  
  "transcripts": [...]
}
```

## 🎯 **Casos de uso en el dashboard**

### **Player de audio**
```html
<audio controls>
  <source src="{{ audio_download_url }}" type="audio/mpeg">
</audio>
```

### **Enlace de descarga**
```html
<a href="{{ audio_download_url }}" download>
  Descargar ({{ formatFileSize(audio_file_size) }})
</a>
```

### **Creación de tickets** 
- El campo `ficheroLlamada` se incluye automáticamente
- No requiere cambios en el código de tickets existente

## ⚠️ **Consideraciones importantes**

1. **URLs válidas por 60 días** - Después expiran
2. **Pueden ser `null`** - Si no hay audio disponible
3. **Formato**: Siempre MP3
4. **Tamaño típico**: 1-5 MB por llamada de 2-3 minutos

## 🔧 **Implementación sugerida**

```javascript
// Verificar si hay audio disponible
if (callData.audio_download_url) {
  // Mostrar player y opciones de descarga
  showAudioPlayer(callData.audio_download_url);
  showDownloadLink(callData.audio_download_url, callData.audio_file_size);
} else {
  // Mostrar mensaje "Audio no disponible"
  showNoAudioMessage();
}

// Para tickets - el campo ya se incluye automáticamente
// No requiere cambios en código existente
``` 