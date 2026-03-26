-- Add new AI analysis fields to candidates table
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS overall_relevancy_score integer CHECK (overall_relevancy_score >= 0 AND overall_relevancy_score <= 100),
ADD COLUMN IF NOT EXISTS job_title_relevancy_score integer CHECK (job_title_relevancy_score >= 0 AND job_title_relevancy_score <= 100),
ADD COLUMN IF NOT EXISTS industry_relevancy_score integer CHECK (industry_relevancy_score >= 0 AND industry_relevancy_score <= 100),
ADD COLUMN IF NOT EXISTS years_relevant_experience numeric(4, 1),
ADD COLUMN IF NOT EXISTS ai_relevancy_analysis jsonb DEFAULT '{}'::jsonb;

-- Add index for filtering by relevancy scores
CREATE INDEX IF NOT EXISTS idx_candidates_overall_relevancy ON candidates(overall_relevancy_score);
CREATE INDEX IF NOT EXISTS idx_candidates_job_title_relevancy ON candidates(job_title_relevancy_score);
CREATE INDEX IF NOT EXISTS idx_candidates_industry_relevancy ON candidates(industry_relevancy_score);
CREATE INDEX IF NOT EXISTS idx_candidates_years_experience ON candidates(years_relevant_experience);

COMMENT ON COLUMN candidates.overall_relevancy_score IS 'Overall relevancy score (0-100) based on search criteria';
COMMENT ON COLUMN candidates.job_title_relevancy_score IS 'Job title relevancy score (0-100) - percentage of experience in target role';
COMMENT ON COLUMN candidates.industry_relevancy_score IS 'Industry relevancy score (0-100) - percentage of experience in target industry';
COMMENT ON COLUMN candidates.years_relevant_experience IS 'Years of relevant experience excluding volunteering, board positions, side hustles, consultations';
COMMENT ON COLUMN candidates.ai_relevancy_analysis IS 'Detailed AI analysis in Arabic with explanations';