# 🔄 MIGRACIÓN: TICKETS MÚLTIPLES Y CONEXIÓN FRONTEND-BACKEND

## 📅 Fecha: Diciembre 2024

## 🎯 Objetivo
Corregir el sistema para:
1. Conectar el frontend con el backend real (eliminar localStorage)
2. Soportar múltiples tickets por llamada
3. Mantener logs de todos los tickets sugeridos (incluso con score < 0.5)

## 🔧 Cambios Realizados

### 1. Frontend - Servicio de Tickets
**Archivo:** `src/services/ticketService.ts`

**Cambio:** Reemplazado completamente para usar Supabase en lugar de localStorage

```typescript
// ANTES: localStorage
private getTickets(): Ticket[] {
  const ticketsJson = localStorage.getItem(this.STORAGE_KEY);
  return ticketsJson ? JSON.parse(ticketsJson) : [];
}

// DESPUÉS: Supabase
async getTicketsByConversationId(conversationId: string): Promise<Ticket[]> {
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false });
  // ...
}
```

### 2. Base de Datos - Nueva Columna
**Migración:** `add_ticket_ids_array`

```sql
ALTER TABLE processed_calls
ADD COLUMN IF NOT EXISTS ticket_ids uuid[] DEFAULT '{}';

UPDATE processed_calls
SET ticket_ids = ARRAY[ticket_id]
WHERE ticket_id IS NOT NULL;
```

### 3. Backend - Procesamiento de Llamadas
**Archivo:** `server/src/services/call_processing_service.ts`

**Cambio:** Ahora guarda TODOS los tickets creados en un array

```typescript
// ANTES: Solo guardaba el primer ticket
if (!nogalCall.ticket_id) {
  nogalCall.ticket_id = internalTicket.id;
}

// DESPUÉS: Guarda todos los tickets
const createdTicketIds: string[] = [];
for (const suggestion of suggestionsToCreate) {
  // ... crear ticket ...
  createdTicketIds.push(internalTicket.id);
}
nogalCall.ticket_ids = createdTicketIds;
```

### 4. API - Consultas Actualizadas
**Archivo:** `server/src/api/v1/calls.controller.ts`

**Cambio:** Las consultas ahora devuelven arrays de tickets

```typescript
// ANTES: ticket singular
ticket: call.tickets ? {
  id: call.tickets.id,
  type: call.tickets.type,
  status: call.tickets.status
} : null

// DESPUÉS: array de tickets
tickets: call.tickets || [],
ticket_count: call.tickets?.length || 0,
ai_intent: call.ai_intent,
ticket_suggestions: call.ticket_suggestions
```

### 5. Tipos TypeScript
**Archivo:** `server/src/types/supabase.types.ts`

**Cambio:** Agregado `ticket_ids: string[] | null` a los tipos

## 📊 Estructura de Datos Actual

### Tabla: processed_calls
```
- id: uuid
- segurneo_external_call_id: text
- status: text
- ai_intent: jsonb (intención detectada por Gemini)
- ticket_suggestions: jsonb (TODAS las sugerencias, incluyendo score < 0.5)
- ticket_ids: uuid[] (array de tickets creados con score >= 0.5)
- ticket_id: uuid (DEPRECADO - mantener por compatibilidad)
```

### Tabla: tickets
```
- id: uuid
- conversation_id: uuid (FK → processed_calls.id)
- type: text
- status: text
- description: text
- priority: text
- metadata: jsonb (incluye score y externalTicketId)
```

## 🔍 Datos Disponibles en el Frontend

Ahora el frontend tiene acceso a:
1. **tickets[]**: Array de tickets creados (score >= 0.5)
2. **ticket_count**: Cantidad de tickets creados
3. **ai_intent**: Intención general detectada por Gemini
4. **ticket_suggestions[]**: TODAS las sugerencias (incluyendo score < 0.5)

## ⚠️ Consideraciones

1. **Compatibilidad**: Mantenemos `ticket_id` por ahora para no romper código existente
2. **Performance**: Las consultas usan el foreign key `tickets_conversation_id_fkey`
3. **Logs**: `ticket_suggestions` contiene TODAS las sugerencias para análisis posterior

## 🚀 Próximos Pasos Recomendados

1. **Eliminar `ticket_id`** cuando sea seguro (después de actualizar todo el código)
2. **Crear vista en UI** para mostrar sugerencias con score < 0.5
3. **Dashboard de métricas** para analizar la efectividad de la clasificación
4. **Configurar umbrales** de score por tipo de ticket

## 🧪 Testing

Para verificar que todo funciona:

```bash
# 1. Verificar que se crean múltiples tickets
SELECT id, ticket_ids, array_length(ticket_ids, 1) as ticket_count
FROM processed_calls
WHERE ticket_ids IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

# 2. Verificar relación con tickets
SELECT pc.id, pc.ticket_ids, t.id, t.type, t.metadata->>'score' as score
FROM processed_calls pc
JOIN tickets t ON t.conversation_id = pc.id
WHERE pc.ticket_ids IS NOT NULL
ORDER BY pc.created_at DESC;

# 3. Ver sugerencias no creadas (score < 0.5)
SELECT 
  id,
  jsonb_array_elements(ticket_suggestions) as suggestion
FROM processed_calls
WHERE ticket_suggestions IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
``` 