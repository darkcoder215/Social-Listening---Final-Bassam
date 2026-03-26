-- Add main_issues column to store AI-generated complaints and issues
ALTER TABLE public.tweet_analyses 
ADD COLUMN main_issues text;