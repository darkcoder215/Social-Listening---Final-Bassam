-- Add saved field to candidates table
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS saved BOOLEAN DEFAULT false;

-- Add qualification_status field to store AI assessment
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS qualification_status TEXT CHECK (qualification_status IN ('overqualified', 'qualified', 'underqualified', 'pending'));

-- Add total_years_experience field to track total career experience
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS total_years_experience NUMERIC;