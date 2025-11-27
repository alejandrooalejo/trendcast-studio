-- Add analysis fields to analysis_products table
ALTER TABLE public.analysis_products 
ADD COLUMN IF NOT EXISTS insights JSONB,
ADD COLUMN IF NOT EXISTS analysis_description TEXT,
ADD COLUMN IF NOT EXISTS score_justification TEXT;