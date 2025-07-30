# 📊 Funcionalidad de Exportación

## 🎯 Descripción General

Sistema completo de exportación de datos que combina información de **llamadas**, **tickets** y **clientes** en formatos CSV y Excel. Permite exportar todos los datos relevantes para análisis externo y reportes.

## 📋 Datos Exportados

### 📞 **Información de Llamadas**
- **ID Conversación**: Identificador único de la llamada
- **Fecha**: Fecha formateada (dd MMM yyyy)
- **Hora**: Hora de inicio (HH:mm)
- **Duración**: Formato legible (Xm Ys) y segundos totales
- **Estado**: Status de la llamada (completed, failed, etc.)
- **Razón Finalización**: Motivo por el que terminó la llamada
- **Agente ID**: Identificador del agente

### 💬 **Datos de Interacción**
- **Mensajes Agente**: Número de mensajes del agente
- **Mensajes Usuario**: Número de mensajes del usuario
- **Total Mensajes**: Suma total de mensajes
- **% Agente**: Porcentaje de participación del agente
- **Resumen Transcripción**: Resumen generado por IA

### 🎫 **Información de Tickets**
- **Tickets Creados**: Cantidad de tickets generados
- **Ticket IDs**: Lista de IDs de tickets (separados por comas)
- **Tipo Ticket**: Tipo de incidencia
- **Motivo Ticket**: Motivo de la incidencia
- **Prioridad**: Nivel de prioridad del ticket
- **Estado Ticket**: Estado actual del ticket
- **Enviado a Nogal**: Sí/No si se envió exitosamente
- **Nogal Ticket ID**: ID del ticket en sistema Nogal
- **Estado Nogal**: Estado específico del envío (Enviado Exitosamente, Error al Enviar, No Enviado)

### 👤 **Datos de Cliente**
- **Nombre Cliente**: Nombre extraído por IA o herramientas
- **Email Cliente**: Email del cliente
- **Teléfono Cliente**: Número de teléfono
- **Código Cliente**: ID del cliente en el sistema
- **Dirección Cliente**: Dirección si está disponible

### 🧠 **Análisis de IA**
- **Tipo Incidencia (IA)**: Clasificación automática de la incidencia
- **Motivo Gestión (IA)**: Razón de gestión determinada por IA
- **Confianza IA**: Nivel de confianza del análisis (0-1)
- **Requiere Ticket**: Sí/No si la IA determinó que requiere ticket

### 💰 **Información de Costos**
- **Costo (centavos)**: Costo en centavos
- **Costo (euros)**: Costo formateado en euros

### 🎵 **Datos de Audio**
- **Audio Disponible**: Sí/No si hay audio
- **URL Audio**: URL de descarga (opcional)
- **Tamaño Audio**: Tamaño del archivo en MB

## 🚀 Formatos de Exportación

### 📄 **CSV (Archivo Único)**
- Archivo plano con todos los datos
- Headers en español
- Separación por comas
- Encoding UTF-8
- Ideal para: Análisis en Excel, hojas de cálculo, herramientas de BI

**Nombres de archivo**:
- **Masivo**: `llamadas_tickets_YYYY-MM-DD_HH-mm.csv`
- **Individual**: `llamada_XXXXXXXX_YYYY-MM-DD_HH-mm.csv`

### 📊 **Excel (Múltiples Hojas)**

#### **🔸 Exportación Masiva (Múltiples Llamadas)**
- **Hoja 1 - "Llamadas y Tickets"**: Datos principales resumidos
- **Hoja 2 - "Detalles Técnicos"**: Información técnica y métricas
- **Hoja 3 - "IA y Clientes"**: Análisis de IA y datos de clientes detallados

#### **🔸 Exportación Individual (Una Llamada)**
- **Hoja 1 - "Información General"**: Datos básicos de la llamada
- **Hoja 2 - "Cliente y Ticket"**: Información completa del cliente y tickets
- **Hoja 3 - "Análisis e Interacción"**: Métricas de IA y transcripción

**Nombres de archivo**:
- **Masivo**: `llamadas_tickets_completo_YYYY-MM-DD_HH-mm.xlsx`
- **Individual**: `llamada_detallada_XXXXXXXX_YYYY-MM-DD_HH-mm.xlsx`

#### 📋 **Contenido por Hoja:**

**🔸 Hoja 1 - Llamadas y Tickets (Vista Ejecutiva)**
```
ID Conversación | Fecha | Hora | Duración | Estado | Agente | Mensajes | 
Nombre Cliente | Email Cliente | Teléfono | Ticket Enviado | Estado Nogal | 
Nogal ID | Tipo Incidencia | Costo
```

**🔸 Hoja 2 - Detalles Técnicos (Vista Técnica)**
```
ID Conversación | Duración (seg) | Razón Finalización | Mensajes Agente | 
Mensajes Usuario | Total Mensajes | Tickets Creados | Ticket IDs | 
Prioridad Ticket | Estado Ticket | Confianza IA | Requiere Ticket | 
Costo (centavos) | Audio Disponible | Tamaño Audio
```

**🔸 Hoja 3 - IA y Clientes (Vista de Análisis)**
```
ID Conversación | Nombre Cliente | Email Cliente | Teléfono Cliente | 
Código Cliente | Dirección Cliente | Tipo Incidencia (IA) | 
Motivo Gestión (IA) | Confianza IA | Resumen Transcripción
```

## 🎛️ Filtros de Exportación

### 📅 **Filtros de Período**
- `all`: Todas las llamadas
- `today`: Solo hoy
- `week`: Última semana
- `month`: Último mes

### 🔍 **Filtro de Búsqueda**
- Busca en: ID de conversación, ID de Segurneo, ID de agente

### 🎫 **Filtro de Estado de Tickets**
- `all`: Todos los estados
- `sent`: Solo tickets enviados exitosamente
- `failed`: Solo tickets con errores
- `none`: Solo llamadas sin tickets

### 🎵 **Opciones Adicionales**
- `includeAudio`: Incluir URLs de audio en la exportación

## 🔧 Implementación Técnica

### 📁 **Archivos Principales**
- `src/services/exportService.ts`: Servicio principal de exportación
- `src/pages/CallsPage.tsx`: Integración en la UI

### 🔄 **Flujo de Exportación**
1. **Obtener datos**: Consulta paginada con filtros aplicados
2. **Enriquecer información**: Combina datos de calls, tickets y análisis IA
3. **Extraer datos de cliente**: De tool_results y análisis IA
4. **Formatear datos**: Aplicar formatos legibles
5. **Generar archivo**: CSV o Excel según selección
6. **Descargar**: Automáticamente al navegador

### 📊 **Consultas Optimizadas**
```typescript
// 1. Llamadas base con filtros
const { calls } = await voiceCallsRealDataService.getVoiceCallsPaginated(1, 1000, filters);

// 2. Tickets relacionados (1 consulta para todos)
const { data: tickets } = await supabase.from('tickets').select('*').in('id', allTicketIds);

// 3. Análisis IA y datos adicionales
const { data: analysis } = await supabase.from('calls').select('ai_analysis, transcripts, cost_cents');
```

### 🎯 **Extracción de Datos de Cliente**
```typescript
// Prioridad: tool_results > extracted_data
const clientData = { ...extractedData, ...clientDataFromTools };

// Fuentes de datos:
// 1. transcript.tool_results.buscar_cliente (más confiable)
// 2. ai_analysis.extracted_data (análisis IA)
// 3. ai_analysis.datos_extraidos (formato alternativo)
```

## 📈 Limitaciones Actuales

### 🔢 **Volumen de Datos**
- **Máximo**: 1000 llamadas por exportación
- **Recomendado**: Usar filtros para conjuntos más pequeños

### ⚡ **Rendimiento**
- Consultas múltiples para enriquecer datos
- Tiempo de procesamiento proporcional al número de llamadas

### 🔍 **Datos de Cliente**
- Dependiente de la calidad del análisis IA
- Algunos campos pueden estar vacíos si no se detectaron

## 🚀 Mejoras Futuras

### 📋 **TODO List**
- ✅ **Implementación básica** - Completado
- ⏳ **Testing con datos reales** - Pendiente
- ⏳ **Optimización para grandes volúmenes** - Pendiente  
- ⏳ **Filtros avanzados** - Pendiente

### 🎯 **Mejoras Planificadas**
1. **Exportación por streaming** para grandes volúmenes
2. **Filtros de fecha personalizados** (rango específico)
3. **Opciones de formato** (incluir/excluir campos específicos)
4. **Programación de exportaciones** automáticas
5. **Compresión** para archivos grandes
6. **Notificaciones** de progreso para exportaciones largas

## 💡 Uso Recomendado

### 👥 **Para Equipos de Gestión**
- **Masivo**: Usar **Excel** con vista ejecutiva y filtros por período
- **Individual**: Exportar llamadas específicas problemáticas para análisis detallado
- Enfoque en métricas de tickets enviados

### 🔧 **Para Equipos Técnicos**
- **Masivo**: Usar **CSV** para análisis programático de tendencias
- **Individual**: Exportar llamadas específicas para debugging
- Usar para optimización de procesos

### 📊 **Para Análisis de BI**
- **Masivo**: Exportar **CSV** con todos los filtros para importar a herramientas especializadas
- **Individual**: Casos de estudio específicos
- Combinar con otras fuentes de datos

### 🆘 **Para Soporte y Resolución de Problemas**
- **Individual**: Exportar llamadas que fallaron para análisis detallado
- Usar formato Excel para facilitar el análisis manual
- Incluir datos de audio si es necesario

## 🎯 Casos de Uso

### 📈 **Reportes Ejecutivos (Masivo)**
```
Filtros: period='month', ticket_status='all'
Formato: Excel - Hoja "Llamadas y Tickets"
Métricas: Tickets enviados, costos, satisfacción
```

### 🔍 **Análisis de Calidad (Masivo)**
```
Filtros: period='week', includeAudio=false
Formato: CSV completo
Enfoque: Confianza IA, tipos de incidencia, escalación
```

### 🎫 **Seguimiento de Tickets (Masivo)**
```
Filtros: ticket_status='failed'
Formato: Excel - Todas las hojas
Objetivo: Identificar y corregir fallos en el proceso
```

### 🆘 **Resolución de Problemas (Individual)**
```
Llamada específica: ID de conversación problemática
Formato: Excel detallado (3 hojas especializadas)
Objetivo: Análisis profundo de casos específicos
```

### 📋 **Auditoría de Llamada (Individual)**
```
Llamada específica: Para compliance o revisión
Formato: CSV con todos los datos
Objetivo: Documentación completa de la interacción
```

## 📍 Ubicaciones en la UI

### 🌐 **Exportación Masiva**
```
Página Llamadas → Botón "..." (Más Acciones) → Exportar CSV/Excel
```

### 🎯 **Exportación Individual**
```
Página Llamadas → Cada fila de la tabla → Botón "↓" (Download) → Exportar CSV/Excel
Página Llamadas → Vista de cards → Botón "Exportar" → Exportar CSV/Excel
```

---

**✅ La funcionalidad de exportación está lista para usar tanto de forma masiva como individual** 