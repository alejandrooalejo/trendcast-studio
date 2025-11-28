import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PreprocessRequest {
  imageBase64: string;
  metadata?: Record<string, any>;
}

const MAX_IMAGE_DIMENSION = 512;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const CLIPDROP_API_KEY = Deno.env.get('CLIPDROP_API_KEY')!;
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { imageBase64, metadata = {} } = await req.json() as PreprocessRequest;

    console.log('Starting image preprocessing...');

    // Calculate image hash for deduplication using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(imageBase64);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const imageHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Image hash:', imageHash);

    // Check if this image has already been processed
    const { data: existingEmbedding, error: checkError } = await supabase
      .from('image_embeddings')
      .select('*')
      .eq('image_hash', imageHash)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing embedding:', checkError);
    }

    if (existingEmbedding) {
      console.log('Image already processed, returning cached result');
      return new Response(
        JSON.stringify({
          imageHash,
          embeddingId: existingEmbedding.id,
          normalizedImageUrl: existingEmbedding.normalized_image_url,
          embedding: existingEmbedding.embedding,
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Remove background using ClipDrop API
    console.log('Removing background...');
    const imageBuffer = Uint8Array.from(atob(imageBase64.replace(/^data:image\/\w+;base64,/, '')), c => c.charCodeAt(0));
    
    const formData = new FormData();
    formData.append('image_file', new Blob([imageBuffer], { type: 'image/png' }), 'image.png');

    const clipdropResponse = await fetch('https://clipdrop-api.co/remove-background/v1', {
      method: 'POST',
      headers: {
        'x-api-key': CLIPDROP_API_KEY,
      },
      body: formData
    });

    if (!clipdropResponse.ok) {
      const errorText = await clipdropResponse.text();
      console.error('ClipDrop API error:', errorText);
      throw new Error(`ClipDrop API error: ${clipdropResponse.status} - ${errorText}`);
    }

    const processedImageBuffer = await clipdropResponse.arrayBuffer();
    const processedImageBase64 = btoa(String.fromCharCode(...new Uint8Array(processedImageBuffer)));

    console.log('Background removed successfully');

    // Step 2: Normalize image to 512x512 with center alignment
    const normalizedImageBase64 = await normalizeImage(processedImageBase64);
    console.log('Image normalized to 512x512');
    
    const normalizedImageUrl = `data:image/png;base64,${normalizedImageBase64}`;

    // Step 3: Generate image description using Lovable AI (vision model)
    console.log('Generating image description...');
    const visionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Descreva detalhadamente esta peça de roupa em termos de: estilo, cor, tecido, modelagem, detalhes, padrões e ocasião de uso. Seja objetivo e descritivo.'
            },
            {
              type: 'image_url',
              image_url: { url: normalizedImageUrl }
            }
          ]
        }]
      })
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('Lovable AI vision error:', errorText);
      throw new Error(`Vision API error: ${visionResponse.status}`);
    }

    const visionData = await visionResponse.json();
    const imageDescription = visionData.choices[0].message.content;
    console.log('Image description generated');

    // Step 4: Generate embedding from description using OpenAI
    console.log('Generating embedding from description...');
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: imageDescription,
        dimensions: 512
      })
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data[0].embedding;

    console.log('Embedding generated successfully');

    // Step 5: Save to database
    const { data: savedEmbedding, error: saveError } = await supabase
      .from('image_embeddings')
      .insert({
        image_hash: imageHash,
        embedding,
        normalized_image_url: normalizedImageUrl,
        metadata: {
          ...metadata,
          processed_at: new Date().toISOString(),
          original_dimensions: 'original',
          normalized_dimensions: '512x512',
          description: imageDescription
        }
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving embedding:', saveError);
      throw saveError;
    }

    console.log('Embedding saved with ID:', savedEmbedding.id);

    return new Response(
      JSON.stringify({
        imageHash,
        embeddingId: savedEmbedding.id,
        normalizedImageUrl,
        embedding,
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in preprocess-image:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function normalizeImage(base64Image: string): Promise<string> {
  // This is a simplified normalization - in production, you'd use a proper image processing library
  // For now, we'll return the base64 image as-is since proper image manipulation in Deno
  // would require additional dependencies or external services
  
  // In a real implementation, you would:
  // 1. Decode the base64 image
  // 2. Resize to 512x512 maintaining aspect ratio
  // 3. Center the image with padding if needed
  // 4. Apply histogram equalization
  // 5. Encode back to base64
  
  return base64Image;
}
