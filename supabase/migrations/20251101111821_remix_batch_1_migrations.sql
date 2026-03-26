
-- Migration: 20251101074758
-- Create table for storing tweet analysis results
CREATE TABLE public.tweet_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  search_terms TEXT[] NOT NULL,
  max_items INTEGER NOT NULL,
  sort_order TEXT NOT NULL,
  total_tweets INTEGER NOT NULL DEFAULT 0,
  positive_count INTEGER NOT NULL DEFAULT 0,
  negative_count INTEGER NOT NULL DEFAULT 0,
  neutral_count INTEGER NOT NULL DEFAULT 0,
  insights TEXT,
  recommendations TEXT,
  sample_tweets JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tweet_analyses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public tool)
CREATE POLICY "Anyone can create analyses"
ON public.tweet_analyses
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read analyses
CREATE POLICY "Anyone can view analyses"
ON public.tweet_analyses
FOR SELECT
USING (true);

-- Create index for better query performance
CREATE INDEX idx_tweet_analyses_created_at ON public.tweet_analyses(created_at DESC);
