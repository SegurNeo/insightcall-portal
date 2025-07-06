-- Create processed_calls table
CREATE TABLE IF NOT EXISTS processed_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segurneo_external_call_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending_sync', 'pending_analysis', 'processing', 'completed', 'error')),
  segurneo_call_details JSONB,
  segurneo_transcripts JSONB,
  analysis_results JSONB,
  ticket_ids TEXT[],
  ticket_id UUID,
  processing_error TEXT,
  processing_log TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Create index for faster lookups by external ID
CREATE INDEX IF NOT EXISTS idx_processed_calls_external_id ON processed_calls(segurneo_external_call_id);

-- Create index for status-based queries
CREATE INDEX IF NOT EXISTS idx_processed_calls_status ON processed_calls(status);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_processed_calls_updated_at
  BEFORE UPDATE ON processed_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 