-- Add column to store all analyzed tweets (not just samples)
ALTER TABLE tweet_analyses 
ADD COLUMN all_tweets jsonb DEFAULT '[]'::jsonb;