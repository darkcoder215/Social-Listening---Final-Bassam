-- Add emotional analysis columns to commentary_analyses table
ALTER TABLE commentary_analyses 
ADD COLUMN IF NOT EXISTS emotional_analysis jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS emotional_timeline jsonb DEFAULT '[]'::jsonb;