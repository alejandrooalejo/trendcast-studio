import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, ImageIcon, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface SimilarProductsProps {
  productId: string;
  imageUrl: string;
  imageHash: string;
}

interface SimilarProduct {
  id: string;
  sku: string;
  category: string;
  color: string;
  fabric: string;
  image_url: string;
  demand_score: number;
  estimated_price: number;
  similarity: number;
  analysis_id: string;
}

export function SimilarProducts({ productId, imageUrl, imageHash }: SimilarProductsProps) {
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingEmbedding, setGeneratingEmbedding] = useState(false);
  const [hasEmbedding, setHasEmbedding] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const generateEmbedding = async () => {
    setGeneratingEmbedding(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-embeddings", {
        body: { 
          imageUrl, 
          imageHash,
          productId 
        },
      });

      if (error) throw error;

      toast({
        title: "Embedding gerado!",
        description: data.cached 
          ? "Usando embedding existente" 
          : "Novo embedding criado com FashionCLIP",
      });

      setHasEmbedding(true);
      
      // Automatically search after generating
      await searchSimilar();
    } catch (error: any) {
      console.error("Error generating embedding:", error);
      toast({
        title: "Erro ao gerar embedding",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setGeneratingEmbedding(false);
    }
  };

  const searchSimilar = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-similar", {
        body: { 
          productId,
          limit: 6 
        },
      });

      if (error) throw error;

      if (data.error) {
        // No embedding exists yet
        if (data.error.includes("no embedding")) {
          setHasEmbedding(false);
          toast({
            title: "Embedding não encontrado",
            description: "Gere o embedding primeiro para buscar produtos similares",
            variant: "default",
          });
        } else {
          throw new Error(data.error);
        }
      } else {
        setSimilarProducts(data.similarProducts || []);
        setHasEmbedding(true);
        
        if (data.similarProducts?.length === 0) {
          toast({
            title: "Nenhum produto similar",
            description: "Não encontramos produtos similares no momento",
          });
        }
      }
    } catch (error: any) {
      console.error("Error searching similar products:", error);
      toast({
        title: "Erro na busca",
        description: error.message || "Não foi possível buscar produtos similares",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return "text-emerald-500";
    if (similarity >= 0.6) return "text-amber-500";
    return "text-slate-500";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Produtos Similares</h3>
            <p className="text-sm text-muted-foreground">Encontre produtos visualmente parecidos usando FashionCLIP</p>
          </div>
        </div>

        <div className="flex gap-2">
          {!hasEmbedding && (
            <Button
              onClick={generateEmbedding}
              disabled={generatingEmbedding}
              variant="outline"
              size="sm"
            >
              {generatingEmbedding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Gerar Embedding
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={searchSimilar}
            disabled={loading || generatingEmbedding}
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Buscar Similares
              </>
            )}
          </Button>
        </div>
      </div>

      {similarProducts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {similarProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card 
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                onClick={() => navigate(`/product-details?id=${product.id}`)}
              >
                <div className="aspect-square relative bg-muted">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.sku}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Similarity Badge */}
                  <Badge 
                    className={`absolute top-2 right-2 ${getSimilarityColor(product.similarity)}`}
                  >
                    {(product.similarity * 100).toFixed(0)}% similar
                  </Badge>
                </div>

                <CardContent className="p-4 space-y-2">
                  <div>
                    <h4 className="font-semibold text-sm truncate">{product.sku || "Sem SKU"}</h4>
                    <p className="text-xs text-muted-foreground truncate">{product.category}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-semibold">{product.demand_score}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>

                    {product.estimated_price && (
                      <span className="text-sm font-semibold">
                        R$ {product.estimated_price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1.5 flex-wrap">
                    {product.color && (
                      <Badge variant="secondary" className="text-xs">
                        {product.color}
                      </Badge>
                    )}
                    {product.fabric && (
                      <Badge variant="outline" className="text-xs">
                        {product.fabric}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {similarProducts.length === 0 && !loading && hasEmbedding && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum produto similar encontrado</p>
            <p className="text-xs mt-1">Tente analisar mais produtos para expandir a biblioteca</p>
          </div>
        </Card>
      )}
    </div>
  );
}
