-- Add columns to store all search parameters
ALTER TABLE candidate_searches 
ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS experience_level text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS education text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS exclude_terms text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS job_titles text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cities text[] DEFAULT '{}';