-- Modificar a coluna sources para armazenar objetos com nome e quantidade
ALTER TABLE public.analysis_products 
DROP COLUMN IF EXISTS sources;

ALTER TABLE public.analysis_products 
ADD COLUMN sources JSONB DEFAULT '[]'::jsonb;