-- Fix RLS policies for tweet_analyses table to require authentication

-- Drop existing insecure policies
DROP POLICY IF EXISTS "Anyone can view analyses" ON public.tweet_analyses;
DROP POLICY IF EXISTS "Anyone can create analyses" ON public.tweet_analyses;

-- Create secure policies that require authentication
CREATE POLICY "Authenticated users can view analyses"
ON public.tweet_analyses
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create analyses"
ON public.tweet_analyses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Add policy for updates (optional but recommended)
CREATE POLICY "Authenticated users can update their analyses"
ON public.tweet_analyses
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Add policy for deletes (optional but recommended)
CREATE POLICY "Authenticated users can delete their analyses"
ON public.tweet_analyses
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);