-- Drop and recreate columns as JSONB to store full criterion objects
ALTER TABLE commentary_analyses 
  DROP COLUMN IF EXISTS clarity,
  DROP COLUMN IF EXISTS enthusiasm,
  DROP COLUMN IF EXISTS accuracy,
  DROP COLUMN IF EXISTS timing,
  DROP COLUMN IF EXISTS terminology,
  DROP COLUMN IF EXISTS event_reaction,
  DROP COLUMN IF EXISTS style_variety;

-- Add new JSONB columns with default structure
ALTER TABLE commentary_analyses 
  ADD COLUMN clarity jsonb DEFAULT '{"score": 0, "explanation": "", "quotes": []}'::jsonb,
  ADD COLUMN enthusiasm jsonb DEFAULT '{"score": 0, "explanation": "", "quotes": []}'::jsonb,
  ADD COLUMN accuracy jsonb DEFAULT '{"score": 0, "explanation": "", "quotes": []}'::jsonb,
  ADD COLUMN timing jsonb DEFAULT '{"score": 0, "explanation": "", "quotes": []}'::jsonb,
  ADD COLUMN terminology jsonb DEFAULT '{"score": 0, "explanation": "", "quotes": []}'::jsonb,
  ADD COLUMN event_reaction jsonb DEFAULT '{"score": 0, "explanation": "", "quotes": []}'::jsonb,
  ADD COLUMN style_variety jsonb DEFAULT '{"score": 0, "explanation": "", "quotes": []}'::jsonb;