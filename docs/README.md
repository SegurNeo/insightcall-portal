w# 📚 Documentación InsightCall Portal

## 📁 Estructura de Documentación

### 🔌 APIs
- [API de Nogal](api/nogal-api.md) - Documentación completa de la API de Seguros Nogal
- [API de Segurneo Voice](api/segurneo_voice_api.md) - Documentación del Gateway de voz

### 🛠️ Implementación
- [Guía de Implementación](implementation/implementation.md) - Arquitectura y diseño del sistema
- [Plan del Proyecto](implementation/PROJECT_PLAN.md) - Roadmap y fases de desarrollo
- [Guía de Pruebas MP3](implementation/GUIA_PRUEBAS_MP3.md) - Cómo probar con archivos de audio

### 🔄 Migraciones
- [Migración a Tickets Múltiples](migrations/MIGRACION_TICKETS_MULTIPLES.md) - Cambios para soportar múltiples tickets por llamada
- [Plan de Tickets Reales](migrations/PLAN_TICKETS_REALES.md) - Estrategia de implementación de tickets

### 📊 Datos de Ejemplo
- [Tickets de Nogal](tickets_nogal.csv) - Archivo CSV con ejemplos de tickets

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────┐
│    Cliente llama        │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│      PBX Nogal          │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│    Eleven Labs (IA)     │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│  Segurneo Voice Gateway │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│  InsightCall Backend    │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│    Frontend Dashboard   │
└─────────────────────────┘
```

## 🔑 Conceptos Clave

- **Segurneo Voice Gateway**: Pasarela de seguridad entre Eleven Labs y nuestro sistema
- **Procesamiento de Llamadas**: Análisis automático con Google Gemini
- **Clasificación de Tickets**: Sistema de scoring para crear tickets automáticamente
- **Dashboard**: Interfaz en tiempo real para gestión y análisis 