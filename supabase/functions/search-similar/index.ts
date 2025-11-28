import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchRequest {
  productId: string;
  limit?: number;
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, limit = 10 }: SearchRequest = await req.json();

    console.log("Searching similar products for:", productId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the source product and its embedding
    const { data: sourceProduct, error: productError } = await supabase
      .from("analysis_products")
      .select(`
        *,
        image_embeddings (
          id,
          embedding
        )
      `)
      .eq("id", productId)
      .single();

    if (productError) throw productError;

    if (!sourceProduct?.image_embeddings?.embedding) {
      return new Response(
        JSON.stringify({ 
          error: "Product has no embedding. Please generate embeddings first." 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const sourceEmbedding = JSON.parse(sourceProduct.image_embeddings.embedding);
    console.log("Source embedding length:", sourceEmbedding.length);

    // Get all products with embeddings (excluding the source)
    const { data: allProducts, error: allError } = await supabase
      .from("analysis_products")
      .select(`
        *,
        image_embeddings (
          id,
          embedding
        )
      `)
      .not("id", "eq", productId)
      .not("image_embeddings", "is", null);

    if (allError) throw allError;

    console.log("Found products to compare:", allProducts?.length || 0);

    // Calculate similarities
    const similarities = allProducts
      ?.filter(p => p.image_embeddings?.embedding)
      .map(product => {
        const embedding = JSON.parse(product.image_embeddings.embedding);
        const similarity = cosineSimilarity(sourceEmbedding, embedding);
        
        return {
          id: product.id,
          sku: product.sku,
          category: product.category,
          color: product.color,
          fabric: product.fabric,
          image_url: product.image_url,
          demand_score: product.demand_score,
          estimated_price: product.estimated_price,
          similarity: similarity,
          analysis_id: product.analysis_id,
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit) || [];

    console.log("Top similar products:", similarities.length);

    return new Response(
      JSON.stringify({ 
        sourceProduct: {
          id: sourceProduct.id,
          sku: sourceProduct.sku,
          category: sourceProduct.category,
          image_url: sourceProduct.image_url,
        },
        similarProducts: similarities,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error searching similar products:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
