-- Create analyses table
CREATE TABLE public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  collection_name TEXT NOT NULL,
  collection_type TEXT NOT NULL,
  analysis_depth TEXT NOT NULL,
  focus_colors BOOLEAN DEFAULT true,
  focus_fabrics BOOLEAN DEFAULT true,
  focus_models BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own analyses"
ON public.analyses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analyses"
ON public.analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses"
ON public.analyses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
ON public.analyses FOR DELETE
USING (auth.uid() = user_id);

-- Create analysis_products table
CREATE TABLE public.analysis_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT,
  category TEXT,
  fabric TEXT,
  color TEXT,
  sku TEXT,
  demand_score INTEGER,
  risk_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analysis_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analysis_products
CREATE POLICY "Users can view products from their analyses"
ON public.analysis_products FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.analyses
    WHERE analyses.id = analysis_products.analysis_id
    AND analyses.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert products to their analyses"
ON public.analysis_products FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.analyses
    WHERE analyses.id = analysis_products.analysis_id
    AND analyses.user_id = auth.uid()
  )
);

-- Create trending_colors table
CREATE TABLE public.trending_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  hex_code TEXT NOT NULL,
  confidence_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trending_colors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trending_colors
CREATE POLICY "Users can view trending colors from their analyses"
ON public.trending_colors FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.analyses
    WHERE analyses.id = trending_colors.analysis_id
    AND analyses.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert trending colors to their analyses"
ON public.trending_colors FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.analyses
    WHERE analyses.id = trending_colors.analysis_id
    AND analyses.user_id = auth.uid()
  )
);

-- Create trending_fabrics table
CREATE TABLE public.trending_fabrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  trend_percentage TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trending_fabrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trending_fabrics
CREATE POLICY "Users can view trending fabrics from their analyses"
ON public.trending_fabrics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.analyses
    WHERE analyses.id = trending_fabrics.analysis_id
    AND analyses.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert trending fabrics to their analyses"
ON public.trending_fabrics FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.analyses
    WHERE analyses.id = trending_fabrics.analysis_id
    AND analyses.user_id = auth.uid()
  )
);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to analyses table
CREATE TRIGGER update_analyses_updated_at
BEFORE UPDATE ON public.analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();