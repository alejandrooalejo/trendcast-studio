-- Add back the embedding column that was removed when vector extension was moved
ALTER TABLE public.image_embeddings 
ADD COLUMN embedding extensions.vector(512);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_image_embeddings_embedding 
ON public.image_embeddings 
USING ivfflat (embedding extensions.vector_cosine_ops);