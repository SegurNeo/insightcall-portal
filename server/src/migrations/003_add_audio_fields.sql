-- 🎵 MIGRACIÓN 003: AÑADIR CAMPOS DE AUDIO A TABLA CALLS
-- Fecha: 2025-01-15
-- Descripción: Añadir soporte para URLs de audio y archivos de llamadas desde Segurneo Voice

-- 📁 Añadir campos de audio a la tabla calls
ALTER TABLE calls 
ADD COLUMN IF NOT EXISTS audio_download_url TEXT NULL,
ADD COLUMN IF NOT EXISTS audio_file_size BIGINT NULL CHECK (audio_file_size > 0),
ADD COLUMN IF NOT EXISTS fichero_llamada TEXT NULL;

-- 📋 Comentarios de documentación
COMMENT ON COLUMN calls.audio_download_url IS 'URL pública para descargar/reproducir el audio de la llamada (válida por 60 días)';
COMMENT ON COLUMN calls.audio_file_size IS 'Tamaño del archivo de audio en bytes';
COMMENT ON COLUMN calls.fichero_llamada IS 'URL del archivo de llamada para tickets (compatible con sistema existente)';

-- 📊 Crear índice para búsquedas de llamadas con audio
CREATE INDEX IF NOT EXISTS idx_calls_with_audio 
ON calls(audio_download_url) WHERE audio_download_url IS NOT NULL;

-- ✅ MIGRACIÓN COMPLETADA
-- Verificar que las columnas se añadieron correctamente:
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'calls' AND column_name IN ('audio_download_url', 'audio_file_size', 'fichero_llamada'); 