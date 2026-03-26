-- Create commentary_analyses table
CREATE TABLE public.commentary_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  transcription TEXT NOT NULL,
  segments JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_score INTEGER NOT NULL,
  clarity TEXT,
  enthusiasm TEXT,
  accuracy TEXT,
  timing TEXT,
  terminology TEXT,
  event_reaction TEXT,
  style_variety TEXT,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  improvements JSONB NOT NULL DEFAULT '[]'::jsonb,
  excitement_timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commentary_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own analyses"
  ON public.commentary_analyses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analyses"
  ON public.commentary_analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
  ON public.commentary_analyses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_commentary_analyses_user_id ON public.commentary_analyses(user_id);
CREATE INDEX idx_commentary_analyses_created_at ON public.commentary_analyses(created_at DESC);