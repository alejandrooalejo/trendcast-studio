import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Analysis() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const analysisId = searchParams.get("id");
  
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [trendingColors, setTrendingColors] = useState<any[]>([]);
  const [trendingFabrics, setTrendingFabrics] = useState<any[]>([]);
  const [trendingModels, setTrendingModels] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (analysisId) {
      fetchAnalysisData();
    } else {
      toast({
        title: "ID da análise não encontrado",
        description: "Redirecionando para resultados...",
        variant: "destructive",
      });
      navigate("/results");
    }
  }, [analysisId]);

  const fetchAnalysisData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Faça login para ver a análise",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Fetch main analysis
      const { data: analysisData, error: analysisError } = await supabase
        .from("analyses")
        .select("*")
        .eq("id", analysisId)
        .eq("user_id", user.id)
        .single();

      if (analysisError) throw analysisError;
      setAnalysis(analysisData);

      // Fetch all related data in parallel
      const [colorsRes, fabricsRes, modelsRes, recsRes, insightsRes, productsRes] = await Promise.all([
        supabase.from("trending_colors").select("*").eq("analysis_id", analysisId),
        supabase.from("trending_fabrics").select("*").eq("analysis_id", analysisId),
        supabase.from("trending_models").select("*").eq("analysis_id", analysisId),
        supabase.from("recommendations").select("*").eq("analysis_id", analysisId),
        supabase.from("market_insights").select("*").eq("analysis_id", analysisId),
        supabase.from("analysis_products").select("*").eq("analysis_id", analysisId),
      ]);

      setTrendingColors(colorsRes.data || []);
      setTrendingFabrics(fabricsRes.data || []);
      setTrendingModels(modelsRes.data || []);
      setRecommendations(recsRes.data || []);
      setInsights(insightsRes.data || []);
      setProducts(productsRes.data || []);

    } catch (error) {
      console.error("Error fetching analysis:", error);
      toast({
        title: "Erro ao carregar análise",
        description: "Não foi possível carregar os dados da análise",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando análise...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!analysis) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-muted-foreground text-lg">Análise não encontrada</p>
          <Button onClick={() => navigate("/results")}>
            Voltar para Resultados
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const highRiskProducts = products.filter(p => p.risk_level?.toLowerCase() === "alto" || p.risk_level?.toLowerCase() === "high");
  const lowRiskProducts = products.filter(p => p.risk_level?.toLowerCase() === "baixo" || p.risk_level?.toLowerCase() === "low");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate("/results")}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-3xl font-display font-semibold text-foreground">{analysis.collection_name}</h1>
            <p className="text-muted-foreground mt-1">
              {analysis.collection_type} • {products.length} produto(s) analisado(s)
            </p>
          </div>
        </div>

        {/* Trending Colors */}
        {trendingColors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Cores em Tendência</CardTitle>
                <CardDescription>Cores mais populares identificadas pela IA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {trendingColors.map((color) => (
                    <div key={color.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg border-2"
                          style={{ backgroundColor: color.hex_code }}
                        />
                        <div className="flex-1">
                          <p className="font-semibold">{color.name}</p>
                          <p className="text-sm text-muted-foreground">{color.hex_code}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Confiança</span>
                        <span className="font-medium">{color.confidence_score}%</span>
                      </div>
                      {color.reason && (
                        <p className="text-xs text-muted-foreground">{color.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Trending Fabrics */}
        {trendingFabrics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Tecidos em Tendência</CardTitle>
                <CardDescription>Materiais mais buscados no mercado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {trendingFabrics.map((fabric) => (
                    <div key={fabric.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{fabric.name}</p>
                        <Badge className="bg-primary">{fabric.trend_percentage}</Badge>
                      </div>
                      {fabric.reason && (
                        <p className="text-xs text-muted-foreground">{fabric.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Trending Models */}
        {trendingModels.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Modelos em Alta</CardTitle>
                <CardDescription>Estilos e silhuetas populares</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {trendingModels.map((model) => (
                    <div key={model.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{model.name}</p>
                        <Badge variant="secondary">{model.popularity}</Badge>
                      </div>
                      {model.description && (
                        <p className="text-sm text-muted-foreground">{model.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Recomendações Estratégicas</CardTitle>
                <CardDescription>Ações práticas baseadas na análise de dados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div key={rec.id}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {rec.priority && (
                              <Badge 
                                variant={rec.priority.toLowerCase() === "alta" ? "default" : "secondary"}
                                className={rec.priority.toLowerCase() === "alta" ? "bg-primary" : ""}
                              >
                                Prioridade {rec.priority}
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium mb-1">{rec.recommendation}</p>
                        </div>
                      </div>
                      {index < recommendations.length - 1 && <Separator className="my-4" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Market Insights */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Insights de Mercado</CardTitle>
                <CardDescription>Análises e observações do mercado de moda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.map((insight) => (
                    <div key={insight.id} className="p-4 border rounded-lg">
                      <p className="text-sm mb-2">{insight.insight}</p>
                      {insight.source && (
                        <p className="text-xs text-muted-foreground">Fonte: {insight.source}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Risk Indicators */}
        {products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Indicadores de Risco</CardTitle>
                <CardDescription>Produtos analisados com seus níveis de risco</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {products.map((product, index) => (
                    <div 
                      key={product.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {product.risk_level?.toLowerCase() === "alto" || product.risk_level?.toLowerCase() === "high" ? (
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        ) : product.risk_level?.toLowerCase() === "baixo" || product.risk_level?.toLowerCase() === "low" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingUp className="h-5 w-5 text-primary" />
                        )}
                        <div>
                          <p className="font-medium">{product.sku || `Produto ${index + 1}`}</p>
                          {product.demand_score && (
                            <p className="text-sm text-muted-foreground">Score de demanda: {product.demand_score}/100</p>
                          )}
                          {product.category && (
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                          )}
                        </div>
                      </div>
                      {product.risk_level && (
                        <Badge 
                          variant={
                            product.risk_level?.toLowerCase() === "alto" || product.risk_level?.toLowerCase() === "high"
                              ? "destructive" 
                              : product.risk_level?.toLowerCase() === "baixo" || product.risk_level?.toLowerCase() === "low"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {product.risk_level}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Summary Stats */}
        {products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Resumo da Análise</CardTitle>
                <CardDescription>Visão geral dos produtos analisados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border border-border rounded-lg">
                    <div className="text-3xl font-display font-bold text-green-600 mb-2">
                      {lowRiskProducts.length}
                    </div>
                    <p className="text-sm text-muted-foreground">Produtos com baixo risco</p>
                  </div>
                  <div className="text-center p-4 border border-border rounded-lg">
                    <div className="text-3xl font-display font-bold text-primary mb-2">
                      {products.length - highRiskProducts.length - lowRiskProducts.length}
                    </div>
                    <p className="text-sm text-muted-foreground">Produtos com risco médio</p>
                  </div>
                  <div className="text-center p-4 border border-border rounded-lg">
                    <div className="text-3xl font-display font-bold text-destructive mb-2">
                      {highRiskProducts.length}
                    </div>
                    <p className="text-sm text-muted-foreground">Produtos com alto risco</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
