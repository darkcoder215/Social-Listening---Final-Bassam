-- Fix commentary_analyses.overall_score to support decimal values
ALTER TABLE public.commentary_analyses
ALTER COLUMN overall_score TYPE real USING overall_score::real;