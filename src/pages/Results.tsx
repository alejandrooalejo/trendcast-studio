import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Target, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function Results() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Faça login para ver seus resultados",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { data: analysesData, error: analysesError } = await supabase
        .from("analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (analysesError) throw analysesError;

      // Fetch products for each analysis
      const analysesWithProducts = await Promise.all(
        (analysesData || []).map(async (analysis) => {
          const { data: products, error: productsError } = await supabase
            .from("analysis_products")
            .select("*")
            .eq("analysis_id", analysis.id);

          if (productsError) console.error("Error fetching products:", productsError);

          return {
            ...analysis,
            products: products || [],
          };
        })
      );

      setAnalyses(analysesWithProducts);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      toast({
        title: "Erro ao carregar análises",
        description: "Não foi possível carregar suas análises",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (riskLevel: string) => {
    const riskLower = riskLevel?.toLowerCase();
    if (riskLower === "baixo" || riskLower === "low") {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (riskLower === "alto" || riskLower === "high") {
      return <AlertTriangle className="h-5 w-5 text-destructive" />;
    }
    return <AlertCircle className="h-5 w-5 text-primary" />;
  };

  const getRiskBadge = (risk: string) => {
    const riskLower = risk?.toLowerCase();
    if (riskLower === "alto" || riskLower === "high") return "destructive";
    if (riskLower === "baixo" || riskLower === "low") return "secondary";
    return "default";
  };

  const getRiskLabel = (risk: string) => {
    const riskLower = risk?.toLowerCase();
    if (riskLower === "alto" || riskLower === "high") return "Alto Risco";
    if (riskLower === "baixo" || riskLower === "low") return "Baixo Risco";
    if (riskLower === "medio" || riskLower === "medium" || riskLower === "médio") return "Risco Moderado";
    return "Risco Desconhecido";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando análises...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (analyses.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-muted-foreground text-lg">Nenhuma análise encontrada</p>
          <Button onClick={() => navigate("/trends")}>
            Criar Nova Análise
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-semibold text-foreground">Resultados das Análises</h1>
            <p className="text-muted-foreground mt-1">{analyses.length} análise(s) encontrada(s)</p>
          </div>
        </div>

        <div className="space-y-8">
          {analyses.map((analysis) => (
            <Card key={analysis.id} className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-display">{analysis.collection_name}</CardTitle>
                    <CardDescription>
                      {analysis.collection_type} • {analysis.products.length} produto(s) analisado(s)
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {new Date(analysis.created_at).toLocaleDateString('pt-BR')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {analysis.products.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum produto analisado ainda</p>
                  ) : (
                    analysis.products.map((product: any, index: number) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="border rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 bg-card cursor-pointer"
                        onClick={() => navigate(`/product-details?id=${product.id}`)}
                      >
                        <div className="flex gap-4 p-5">
                          {product.image_url && (
                            <div className="w-24 h-24 bg-background rounded-lg flex-shrink-0 overflow-hidden border border-border">
                              <img 
                                src={product.image_url} 
                                alt={product.sku || "Produto"} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-semibold font-display">
                                  {product.sku || `Produto ${index + 1}`}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {product.category || "Sem categoria"}
                                  {product.color && ` • ${product.color}`}
                                </p>
                              </div>
                              {product.risk_level && (
                                <Badge 
                                  variant={getRiskBadge(product.risk_level)}
                                  className="text-xs"
                                >
                                  {getTrendIcon(product.risk_level)}
                                  <span className="ml-1">{getRiskLabel(product.risk_level)}</span>
                                </Badge>
                              )}
                            </div>

                            {product.demand_score && (
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-medium">Score:</span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                      <div 
                                        className="h-full transition-all bg-primary"
                                        style={{ width: `${product.demand_score}%` }}
                                      />
                                    </div>
                                    <span className="text-sm font-bold font-display min-w-[3ch]">
                                      {product.demand_score}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {product.recommended_quantity && (
                              <div className="grid grid-cols-3 gap-2 pt-2">
                                <div className="text-center p-2 bg-muted/30 rounded-lg">
                                  <p className="text-xs text-muted-foreground">Unidades</p>
                                  <p className="text-sm font-bold font-display">{product.recommended_quantity}</p>
                                </div>
                                {product.estimated_price && (
                                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Preço</p>
                                    <p className="text-sm font-bold font-display">R$ {product.estimated_price.toFixed(2)}</p>
                                  </div>
                                )}
                                {product.estimated_production_cost && (
                                  <div className="text-center p-2 bg-muted/30 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Custo</p>
                                    <p className="text-sm font-bold font-display">R$ {product.estimated_production_cost.toFixed(2)}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/product-details?id=${product.id}`);
                              }}
                            >
                              Ver Detalhes
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
