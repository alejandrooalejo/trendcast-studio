-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create image_embeddings table for caching
CREATE TABLE IF NOT EXISTS public.image_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_hash TEXT NOT NULL UNIQUE,
  embedding vector(512),
  normalized_image_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast similarity search using HNSW
CREATE INDEX IF NOT EXISTS image_embeddings_embedding_idx 
ON public.image_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create index on image_hash for fast lookups
CREATE INDEX IF NOT EXISTS image_embeddings_hash_idx 
ON public.image_embeddings (image_hash);

-- Add columns to analysis_products
ALTER TABLE public.analysis_products 
ADD COLUMN IF NOT EXISTS image_hash TEXT,
ADD COLUMN IF NOT EXISTS normalized_image_url TEXT,
ADD COLUMN IF NOT EXISTS embedding_id UUID REFERENCES public.image_embeddings(id);

-- Create index on image_hash for analysis_products
CREATE INDEX IF NOT EXISTS analysis_products_hash_idx 
ON public.analysis_products (image_hash);

-- Enable RLS on image_embeddings
ALTER TABLE public.image_embeddings ENABLE ROW LEVEL SECURITY;

-- Policy for inserting embeddings (authenticated users)
CREATE POLICY "Users can insert image embeddings"
ON public.image_embeddings
FOR INSERT
WITH CHECK (true);

-- Policy for viewing embeddings (authenticated users)
CREATE POLICY "Users can view image embeddings"
ON public.image_embeddings
FOR SELECT
USING (true);

-- Add trigger for updating updated_at
CREATE TRIGGER update_image_embeddings_updated_at
BEFORE UPDATE ON public.image_embeddings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();