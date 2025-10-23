-- PolyRadar Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_url TEXT NOT NULL,
  event_title TEXT,
  event_data JSONB,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  user_id UUID,
  CONSTRAINT analyses_event_url_check CHECK (event_url ~ '^https?://')
);

-- Model predictions table
CREATE TABLE IF NOT EXISTS model_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'error', 'timeout')),
  outcome TEXT CHECK (outcome IN ('YES', 'NO', 'UNCERTAIN')),
  confidence_percent INTEGER CHECK (confidence_percent >= 0 AND confidence_percent <= 100),
  reasoning TEXT,
  sources_count INTEGER DEFAULT 0,
  error TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  raw_response JSONB,
  UNIQUE(analysis_id, model_name)
);

-- Timeline table
CREATE TABLE IF NOT EXISTS timelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'error', 'timeout')),
  events JSONB DEFAULT '[]'::jsonb,
  error TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  raw_response JSONB,
  UNIQUE(analysis_id)
);

-- Insights table
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'error', 'timeout')),
  risks JSONB DEFAULT '[]'::jsonb,
  opportunities JSONB DEFAULT '[]'::jsonb,
  trends JSONB DEFAULT '[]'::jsonb,
  consensus JSONB,
  error TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  raw_response JSONB,
  UNIQUE(analysis_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_model_predictions_analysis_id ON model_predictions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_model_predictions_status ON model_predictions(status);
CREATE INDEX IF NOT EXISTS idx_timelines_analysis_id ON timelines(analysis_id);
CREATE INDEX IF NOT EXISTS idx_insights_analysis_id ON insights(analysis_id);

-- Enable Row Level Security (RLS)
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all operations on analyses" ON analyses FOR ALL USING (true);
CREATE POLICY "Allow all operations on model_predictions" ON model_predictions FOR ALL USING (true);
CREATE POLICY "Allow all operations on timelines" ON timelines FOR ALL USING (true);
CREATE POLICY "Allow all operations on insights" ON insights FOR ALL USING (true);

-- Function to update analysis status
CREATE OR REPLACE FUNCTION update_analysis_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if all predictions, timeline, and insights are completed
  IF (
    SELECT COUNT(*) = 0
    FROM model_predictions
    WHERE analysis_id = NEW.analysis_id
    AND status IN ('pending', 'processing')
  ) AND (
    SELECT status NOT IN ('pending', 'processing')
    FROM timelines
    WHERE analysis_id = NEW.analysis_id
  ) AND (
    SELECT status NOT IN ('pending', 'processing')
    FROM insights
    WHERE analysis_id = NEW.analysis_id
  ) THEN
    UPDATE analyses
    SET status = 'completed', completed_at = NOW()
    WHERE id = NEW.analysis_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update analysis status
CREATE TRIGGER trigger_update_analysis_on_prediction
AFTER INSERT OR UPDATE ON model_predictions
FOR EACH ROW
EXECUTE FUNCTION update_analysis_status();

CREATE TRIGGER trigger_update_analysis_on_timeline
AFTER INSERT OR UPDATE ON timelines
FOR EACH ROW
EXECUTE FUNCTION update_analysis_status();

CREATE TRIGGER trigger_update_analysis_on_insights
AFTER INSERT OR UPDATE ON insights
FOR EACH ROW
EXECUTE FUNCTION update_analysis_status();

