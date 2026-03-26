-- Create candidate_searches table
CREATE TABLE public.candidate_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  city TEXT NOT NULL,
  companies TEXT[] DEFAULT '{}',
  search_query TEXT NOT NULL,
  total_results INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create candidates table
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  search_id UUID REFERENCES public.candidate_searches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  linkedin_url TEXT NOT NULL,
  profile_summary TEXT,
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'not_qualified')),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.candidate_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for candidate_searches
CREATE POLICY "Users can view their own searches"
  ON public.candidate_searches
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own searches"
  ON public.candidate_searches
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own searches"
  ON public.candidate_searches
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for candidates
CREATE POLICY "Users can view their own candidates"
  ON public.candidates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own candidates"
  ON public.candidates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own candidates"
  ON public.candidates
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own candidates"
  ON public.candidates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_candidates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_candidates_updated_at();

-- Create indexes for performance
CREATE INDEX idx_candidate_searches_user_id ON public.candidate_searches(user_id);
CREATE INDEX idx_candidate_searches_created_at ON public.candidate_searches(created_at DESC);
CREATE INDEX idx_candidates_search_id ON public.candidates(search_id);
CREATE INDEX idx_candidates_user_id ON public.candidates(user_id);
CREATE INDEX idx_candidates_status ON public.candidates(status);