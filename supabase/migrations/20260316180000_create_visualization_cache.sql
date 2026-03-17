-- Create visualization cache table for faster report generation
CREATE TABLE IF NOT EXISTS visualization_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visualization_type TEXT NOT NULL,
  image_url TEXT NOT NULL,
  region TEXT,
  event_type TEXT,
  parameters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast cache lookups
CREATE INDEX IF NOT EXISTS idx_visualization_cache_key_user ON visualization_cache(cache_key, user_id);
CREATE INDEX IF NOT EXISTS idx_visualization_cache_created ON visualization_cache(created_at DESC);

-- Create index for cleanup (older than 24 hours)
CREATE INDEX IF NOT EXISTS idx_visualization_cache_cleanup ON visualization_cache(created_at) WHERE created_at < NOW() - INTERVAL '24 hours';

-- Enable RLS
ALTER TABLE visualization_cache ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own cached visualizations" ON visualization_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cached visualizations" ON visualization_cache
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cached visualizations" ON visualization_cache
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to clean up old cache entries (call periodically)
CREATE OR REPLACE FUNCTION cleanup_old_visualization_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM visualization_cache
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;