-- Añadir campos ai_intent y ticket_suggestions a la tabla processed_calls
ALTER TABLE processed_calls
ADD COLUMN ai_intent JSONB,
ADD COLUMN ticket_suggestions JSONB; 