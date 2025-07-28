-- 📞 Agregar campo caller_id a la tabla calls
-- Almacena el número desde el cual se realizó la llamada

ALTER TABLE calls 
ADD COLUMN caller_id VARCHAR(20) NULL;

-- Crear índice para búsquedas por caller_id
CREATE INDEX idx_calls_caller_id ON calls(caller_id);

-- Comentario para documentación
COMMENT ON COLUMN calls.caller_id IS 'Número de teléfono desde el cual se realizó la llamada (caller ID)'; 