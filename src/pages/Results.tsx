import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, ExternalLink, Eye, Target, Info, Lightbulb, CheckCircle2, AlertCircle, AlertTriangle, Link2 } from "lucide-react";
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/analysis?id=${analysis.id}`)}
                  >
                    Ver Detalhes
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
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
                      >
                        <div className="flex gap-4 p-6 border rounded-xl hover:shadow-md transition-all duration-300 bg-card">
                          {product.image_url && (
                            <div className="w-32 h-32 bg-muted rounded-xl flex-shrink-0 overflow-hidden border-2 border-border">
                              <img 
                                src={product.image_url} 
                                alt={product.sku || "Produto"} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1 space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h3 className="text-xl font-semibold">
                                  {product.sku || `Produto ${index + 1}`}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>{product.category || "Sem categoria"}</span>
                                  {product.color && (
                                    <>
                                      <span>•</span>
                                      <span>{product.color}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getTrendIcon(product.risk_level)}
                                {product.risk_level && (
                                  <Badge 
                                    variant={getRiskBadge(product.risk_level)}
                                    className="text-sm"
                                  >
                                    {product.risk_level}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Analysis Description */}
                            {product.analysis_description && (
                              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                                <div className="flex items-start gap-2 mb-2">
                                  <Eye className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                  <p className="text-sm font-medium text-primary">Análise Visual</p>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed ml-6">
                                  {product.analysis_description}
                                </p>
                              </div>
                            )}

                            {/* Demand Score */}
                            {product.demand_score && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium">Score de Demanda</span>
                                  </div>
                                  <span className="text-2xl font-bold">{product.demand_score}<span className="text-sm text-muted-foreground">/100</span></span>
                                </div>
                                <div className="h-3 bg-muted rounded-full overflow-hidden border border-border">
                                  <motion.div
                                    className={`h-full transition-colors ${
                                      product.demand_score >= 80
                                        ? "bg-gradient-to-r from-green-500 to-green-600"
                                        : product.demand_score >= 60
                                        ? "bg-gradient-to-r from-primary to-primary/80"
                                        : "bg-gradient-to-r from-destructive to-destructive/80"
                                    }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${product.demand_score}%` }}
                                    transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                                  />
                                </div>
                                
                                {/* Recommended Quantity */}
                                {product.recommended_quantity && (
                                  <div className="mt-3 space-y-2">
                                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-primary">
                                          Quantidade Recomendada
                                        </span>
                                        <span className="text-lg font-bold text-primary">
                                          {product.recommended_quantity} unidades
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Baseado no score de demanda
                                      </p>
                                    </div>
                                    
                                    {/* Target Audience Size */}
                                    {product.target_audience_size && (
                                      <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-medium text-accent-foreground">
                                            Público-Alvo Necessário
                                          </span>
                                          <span className="text-lg font-bold text-accent-foreground">
                                            {product.target_audience_size.toLocaleString('pt-BR')} pessoas
                                          </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Para garantir a venda de {product.recommended_quantity} unidades
                                        </p>
                                      </div>
                                    )}
                                    
                                    {/* Price and Revenue */}
                                    {product.estimated_price && (
                                      <>
                                        <div className="p-3 bg-secondary/5 border border-secondary/20 rounded-lg">
                                          <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">
                                              Preço Estimado
                                            </span>
                                            <span className="text-lg font-bold">
                                              R$ {product.estimated_price.toFixed(2)}
                                            </span>
                                          </div>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Baseado em tendências de mercado
                                          </p>
                                        </div>
                                        
                                        {product.projected_revenue && (
                                          <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                                            <div className="flex items-center justify-between">
                                              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                                Receita Projetada
                                              </span>
                                              <span className="text-lg font-bold text-green-700 dark:text-green-400">
                                                R$ {product.projected_revenue.toFixed(2)}
                                              </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {product.recommended_quantity} unidades × R$ {product.estimated_price.toFixed(2)}
                                            </p>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Score Justification - Now Sources */}
                            {product.sources && product.sources.length > 0 && (
                              <>
                                <Separator className="my-4" />
                                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                  <div className="flex items-start gap-2 mb-3">
                                    <Link2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <p className="text-sm font-semibold text-primary">Fontes de Dados</p>
                                  </div>
                                  <div className="flex flex-wrap gap-2 ml-6">
                                    {product.sources.map((sourceData: any, idx: number) => {
                                      // Handle both old format (string) and new format (object)
                                      const sourceName = typeof sourceData === 'string' ? sourceData : sourceData.source;
                                      const sourceCount = typeof sourceData === 'object' && sourceData.count ? sourceData.count : null;
                                      
                                      return (
                                        <Badge 
                                          key={idx} 
                                          variant="outline" 
                                          className="bg-background border-primary/30"
                                        >
                                          {sourceName}
                                          {sourceCount && (
                                            <span className="ml-1.5 text-primary font-semibold">
                                              ({sourceCount.toLocaleString()})
                                            </span>
                                          )}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Insights */}
                            {product.insights && product.insights.length > 0 && (
                              <>
                                <Separator className="my-4" />
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Lightbulb className="h-4 w-4 text-primary" />
                                    <p className="text-sm font-semibold">Principais Insights</p>
                                  </div>
                                  <div className="grid gap-2 ml-6">
                                    {product.insights.slice(0, 3).map((insight: any, idx: number) => (
                                      <motion.div 
                                        key={idx} 
                                        className="p-3 bg-accent/50 rounded-lg border border-accent"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: idx * 0.1 }}
                                      >
                                        <div className="flex items-start gap-2">
                                          <Badge 
                                            variant={
                                              insight.type === "positive" ? "secondary" :
                                              insight.type === "negative" ? "destructive" :
                                              "default"
                                            }
                                            className="text-xs shrink-0 mt-0.5"
                                          >
                                            {insight.type === "positive" ? "+" : insight.type === "negative" ? "!" : "→"}
                                          </Badge>
                                          <div className="flex-1 space-y-1">
                                            <p className="font-medium text-sm">{insight.title}</p>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                              {insight.description}
                                            </p>
                                          </div>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
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
