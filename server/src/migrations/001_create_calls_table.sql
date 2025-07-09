-- 🎯 MIGRACIÓN 001: CREAR TABLA CALLS OPTIMIZADA
-- Estructura única y simple para todas las llamadas
-- Fecha: 2025-01-08
-- Descripción: Reemplaza processed_calls y voice_calls con estructura unificada

-- 🗑️ PASO 1: Limpiar tablas legacy si existen (comentado por seguridad)
-- DROP TABLE IF EXISTS voice_calls CASCADE;
-- DROP TABLE IF EXISTS processed_calls CASCADE;

-- 📞 PASO 2: Crear tabla principal optimizada
CREATE TABLE IF NOT EXISTS calls (
  -- 🆔 Identificadores únicos
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segurneo_call_id TEXT NOT NULL,
  conversation_id TEXT UNIQUE NOT NULL,
  
  -- 👤 Información del agente
  agent_id TEXT NOT NULL,
  
  -- ⏱️ Información temporal
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 0),
  
  -- 📊 Estado y resultado de la llamada
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed', 'in_progress')),
  call_successful BOOLEAN NOT NULL,
  termination_reason TEXT,
  
  -- 💰 Información económica
  cost_cents INTEGER NOT NULL DEFAULT 0 CHECK (cost_cents >= 0),
  
  -- 📈 Métricas de participación
  agent_messages INTEGER NOT NULL DEFAULT 0 CHECK (agent_messages >= 0),
  user_messages INTEGER NOT NULL DEFAULT 0 CHECK (user_messages >= 0),
  total_messages INTEGER NOT NULL DEFAULT 0 CHECK (total_messages >= 0),
  
  -- 📝 Contenido de la llamada
  transcript_summary TEXT NOT NULL DEFAULT '',
  transcripts JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- 🧠 Análisis de IA
  analysis_completed BOOLEAN NOT NULL DEFAULT FALSE,
  ai_analysis JSONB NULL,
  
  -- 🎫 Gestión de tickets
  tickets_created INTEGER NOT NULL DEFAULT 0 CHECK (tickets_created >= 0),
  ticket_ids TEXT[] NOT NULL DEFAULT '{}',
  
  -- 🕐 Timestamps del sistema
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- ✅ Constraints adicionales
  CONSTRAINT calls_duration_positive CHECK (duration_seconds >= 0),
  CONSTRAINT calls_cost_positive CHECK (cost_cents >= 0),
  CONSTRAINT calls_messages_consistent CHECK (
    total_messages = agent_messages + user_messages
  ),
  CONSTRAINT calls_processed_after_received CHECK (
    processed_at IS NULL OR processed_at >= received_at
  )
);

-- 📚 PASO 3: Crear índices para rendimiento óptimo
-- Índice principal para búsquedas por conversation_id (webhook duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_calls_conversation_id 
ON calls(conversation_id);

-- Índice para listado cronológico (frontend principal)
CREATE INDEX IF NOT EXISTS idx_calls_received_at_desc 
ON calls(received_at DESC);

-- Índice para filtros de estado
CREATE INDEX IF NOT EXISTS idx_calls_status 
ON calls(status);

-- Índice para análisis completados
CREATE INDEX IF NOT EXISTS idx_calls_analysis_completed 
ON calls(analysis_completed);

-- Índice para búsquedas por agente
CREATE INDEX IF NOT EXISTS idx_calls_agent_id 
ON calls(agent_id);

-- Índice para búsquedas por fecha y estado (consultas complejas)
CREATE INDEX IF NOT EXISTS idx_calls_received_status 
ON calls(received_at DESC, status);

-- Índice para tickets activos
CREATE INDEX IF NOT EXISTS idx_calls_tickets_created 
ON calls(tickets_created) WHERE tickets_created > 0;

-- 🔧 PASO 4: Función de actualización automática de updated_at
CREATE OR REPLACE FUNCTION update_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS trigger_calls_updated_at ON calls;
CREATE TRIGGER trigger_calls_updated_at
  BEFORE UPDATE ON calls
  FOR EACH ROW
  EXECUTE FUNCTION update_calls_updated_at();

-- 📊 PASO 5: Crear vista para estadísticas rápidas
CREATE OR REPLACE VIEW calls_stats AS
SELECT 
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE analysis_completed = true) as analyzed_calls,
  ROUND(AVG(duration_seconds)) as average_duration,
  ROUND(SUM(cost_cents)::decimal / 100, 2) as total_cost_euros,
  ROUND(
    (COUNT(*) FILTER (WHERE analysis_completed = true)::decimal / COUNT(*) * 100), 
    1
  ) as analysis_success_rate,
  MAX(received_at) as last_call_received,
  COUNT(*) FILTER (WHERE received_at >= NOW() - INTERVAL '24 hours') as calls_today,
  COUNT(*) FILTER (WHERE received_at >= NOW() - INTERVAL '7 days') as calls_this_week
FROM calls;

-- 🔍 PASO 6: Función para validar estructura de transcripts
CREATE OR REPLACE FUNCTION validate_transcripts_structure(transcripts_json JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validar que es un array
  IF jsonb_typeof(transcripts_json) != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Validar estructura de cada elemento (opcional, para datos críticos)
  -- Se puede expandir según necesidades
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 🔍 PASO 7: Función para validar estructura de ai_analysis
CREATE OR REPLACE FUNCTION validate_ai_analysis_structure(analysis_json JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Si es null, es válido
  IF analysis_json IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Validar que tiene los campos requeridos
  IF analysis_json ? 'incident_type' AND 
     analysis_json ? 'management_reason' AND
     analysis_json ? 'confidence' AND
     analysis_json ? 'priority' AND
     analysis_json ? 'summary' AND
     analysis_json ? 'extracted_data' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ✅ PASO 8: Comentarios de documentación
COMMENT ON TABLE calls IS 'Tabla principal unificada para todas las llamadas del sistema. Reemplaza processed_calls y voice_calls.';
COMMENT ON COLUMN calls.conversation_id IS 'ID único de ElevenLabs. Clave natural para prevenir duplicados.';
COMMENT ON COLUMN calls.transcript_summary IS 'Resumen de la llamada, siempre traducido al español.';
COMMENT ON COLUMN calls.transcripts IS 'Array JSON con la conversación completa segmentada.';
COMMENT ON COLUMN calls.ai_analysis IS 'Resultado del análisis de IA en formato JSON estructurado.';
COMMENT ON COLUMN calls.cost_cents IS 'Coste de la llamada en céntimos (1€ = 100 cents).';

-- 🎉 MIGRACIÓN COMPLETADA
-- Verificar que la tabla se creó correctamente:
-- SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name = 'calls' ORDER BY ordinal_position; 