-- Add enriched profile data column to candidates table
ALTER TABLE public.candidates 
ADD COLUMN enriched_profile jsonb DEFAULT NULL;