-- Add gender and citizenship analysis fields to candidates table
ALTER TABLE candidates 
ADD COLUMN gender text,
ADD COLUMN gender_confidence numeric,
ADD COLUMN gender_explanation text,
ADD COLUMN citizenship text,
ADD COLUMN citizenship_confidence numeric,
ADD COLUMN citizenship_explanation text;