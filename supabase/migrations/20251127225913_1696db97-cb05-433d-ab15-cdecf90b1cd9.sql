-- Add visual references, search appearance counts, and sources to trending colors
ALTER TABLE public.trending_colors 
ADD COLUMN IF NOT EXISTS visual_reference_url TEXT,
ADD COLUMN IF NOT EXISTS search_appearances INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sources TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Add visual references, search appearance counts, and sources to trending fabrics
ALTER TABLE public.trending_fabrics 
ADD COLUMN IF NOT EXISTS visual_reference_url TEXT,
ADD COLUMN IF NOT EXISTS search_appearances INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sources TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Create a new table for trending models/silhouettes
CREATE TABLE IF NOT EXISTS public.trending_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL,
  name TEXT NOT NULL,
  popularity TEXT NOT NULL,
  description TEXT,
  visual_reference_url TEXT,
  search_appearances INTEGER DEFAULT 0,
  sources TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on trending_models
ALTER TABLE public.trending_models ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trending_models
CREATE POLICY "Users can view trending models from their analyses"
ON public.trending_models
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.analyses
    WHERE analyses.id = trending_models.analysis_id
    AND analyses.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert trending models to their analyses"
ON public.trending_models
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.analyses
    WHERE analyses.id = trending_models.analysis_id
    AND analyses.user_id = auth.uid()
  )
);

-- Create tables for market insights and recommendations
CREATE TABLE IF NOT EXISTS public.market_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL,
  insight TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL,
  recommendation TEXT NOT NULL,
  priority TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- RLS policies for market_insights
CREATE POLICY "Users can view market insights from their analyses"
ON public.market_insights
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.analyses
    WHERE analyses.id = market_insights.analysis_id
    AND analyses.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert market insights to their analyses"
ON public.market_insights
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.analyses
    WHERE analyses.id = market_insights.analysis_id
    AND analyses.user_id = auth.uid()
  )
);

-- RLS policies for recommendations
CREATE POLICY "Users can view recommendations from their analyses"
ON public.recommendations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.analyses
    WHERE analyses.id = recommendations.analysis_id
    AND analyses.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert recommendations to their analyses"
ON public.recommendations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.analyses
    WHERE analyses.id = recommendations.analysis_id
    AND analyses.user_id = auth.uid()
  )
);