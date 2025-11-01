-- Create translation_history table for storing user translation history
CREATE TABLE IF NOT EXISTS public.translation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  target_language VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_translation_history_created_at 
ON public.translation_history(created_at DESC);

-- Create index for language filtering
CREATE INDEX IF NOT EXISTS idx_translation_history_language 
ON public.translation_history(target_language);

-- Enable Row Level Security (RLS) for security
ALTER TABLE public.translation_history ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a demo app without user auth)
-- In a production app with user authentication, these policies would be more restrictive
CREATE POLICY "Allow public read access" 
ON public.translation_history FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access" 
ON public.translation_history FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public delete access" 
ON public.translation_history FOR DELETE 
USING (true);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER update_translation_history_updated_at 
    BEFORE UPDATE ON public.translation_history 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
