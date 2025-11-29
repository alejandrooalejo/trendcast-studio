import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { HfInference } from "https://esm.sh/@huggingface/inference@2.3.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmbeddingRequest {
  imageUrl: string;
  imageHash: string;
  productId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, imageHash, productId }: EmbeddingRequest = await req.json();

    console.log("Generating embedding for image:", imageHash);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hfToken = Deno.env.get("HUGGING_FACE_ACCESS_TOKEN");

    if (!hfToken) {
      throw new Error("HUGGING_FACE_ACCESS_TOKEN not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if embedding already exists
    const { data: existing } = await supabase
      .from("image_embeddings")
      .select("id, embedding")
      .eq("image_hash", imageHash)
      .single();

    if (existing && existing.embedding) {
      console.log("Embedding already exists:", existing.id);
      
      // Update product with embedding_id if provided
      if (productId) {
        await supabase
          .from("analysis_products")
          .update({ embedding_id: existing.id })
          .eq("id", productId);
      }

      return new Response(
        JSON.stringify({ 
          embeddingId: existing.id, 
          embedding: existing.embedding,
          cached: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download the image
    console.log("Downloading image from:", imageUrl);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }

    const imageBlob = await imageResponse.blob();
    console.log("Image downloaded, size:", imageBlob.size);

    // Convert to base64
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const imageData = `data:${imageBlob.type};base64,${base64}`;

    // Generate embedding using FashionCLIP
    const hf = new HfInference(hfToken);
    
    console.log("Generating FashionCLIP embedding...");
    const embeddingResult = await hf.featureExtraction({
      model: "patrickjohncyh/fashion-clip",
      inputs: imageData,
    });

    // Convert to plain array to avoid serialization issues
    const embedding = Array.isArray(embeddingResult) 
      ? embeddingResult 
      : Array.from(embeddingResult);

    console.log("Embedding generated, length:", embedding.length);

    // Store or update embedding - PostgreSQL vector type accepts arrays directly
    const embeddingData = {
      image_hash: imageHash,
      embedding: embedding,
      normalized_image_url: imageUrl,
      metadata: {
        model: "fashion-clip",
        generated_at: new Date().toISOString(),
      },
    };

    let embeddingId: string;

    if (existing) {
      // Update existing record
      const { data: updated, error: updateError } = await supabase
        .from("image_embeddings")
        .update(embeddingData)
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) throw updateError;
      embeddingId = updated.id;
      console.log("Updated existing embedding:", embeddingId);
    } else {
      // Insert new record
      const { data: inserted, error: insertError } = await supabase
        .from("image_embeddings")
        .insert(embeddingData)
        .select()
        .single();

      if (insertError) throw insertError;
      embeddingId = inserted.id;
      console.log("Created new embedding:", embeddingId);
    }

    // Update product with embedding_id if provided
    if (productId) {
      await supabase
        .from("analysis_products")
        .update({ embedding_id: embeddingId })
        .eq("id", productId);
      console.log("Updated product with embedding_id:", productId);
    }

    return new Response(
      JSON.stringify({ 
        embeddingId, 
        embedding,
        cached: false 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating embedding:", error);
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
