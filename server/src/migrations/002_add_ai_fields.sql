-- Add AI-related fields to processed_calls
ALTER TABLE processed_calls
ADD COLUMN IF NOT EXISTS ai_intent JSONB,
ADD COLUMN IF NOT EXISTS ticket_suggestions JSONB;

-- Drop ticket_id as we're using ticket_ids array
ALTER TABLE processed_calls
DROP COLUMN IF EXISTS ticket_id; 