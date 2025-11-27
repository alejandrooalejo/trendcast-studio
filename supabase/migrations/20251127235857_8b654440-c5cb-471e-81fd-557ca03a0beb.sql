-- Add sources field to analysis_products table
ALTER TABLE public.analysis_products 
ADD COLUMN IF NOT EXISTS sources TEXT[];