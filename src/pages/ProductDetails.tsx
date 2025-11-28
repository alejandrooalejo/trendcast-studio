import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, Target, Package, DollarSign, Factory, TrendingUp, Link2, Lightbulb, CheckCircle2, AlertCircle, AlertTriangle, BarChart3, TrendingDown, ArrowUpCircle, Instagram, Search, ShoppingBag, TrendingUpIcon, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetails() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("id");
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("analysis_products")
        .select("*")
        .eq("id", productId)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error("Error fetching product details:", error);
      toast({
        title: "Erro ao carregar detalhes",
        description: "Não foi possível carregar os detalhes do produto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (riskLevel: string) => {
    const riskLower = riskLevel?.toLowerCase();
    if (riskLower === "baixo" || riskLower === "low") {
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    }
    if (riskLower === "alto" || riskLower === "high") {
      return <AlertTriangle className="h-5 w-5 text-rose-400" />;
    }
    return <AlertCircle className="h-5 w-5 text-amber-500" />;
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

  const getSourceIcon = (sourceName: string) => {
    const name = sourceName.toLowerCase();
    if (name.includes('instagram') || name.includes('tiktok') || name.includes('social')) {
      return <Instagram className="h-4 w-4" />;
    }
    if (name.includes('google') || name.includes('trends')) {
      return <Search className="h-4 w-4" />;
    }
    if (name.includes('pinterest')) {
      return <Globe className="h-4 w-4" />;
    }
    if (name.includes('zara') || name.includes('h&m') || name.includes('shein') || name.includes('renner') || name.includes('ecommerce') || name.includes('e-commerce')) {
      return <ShoppingBag className="h-4 w-4" />;
    }
    if (name.includes('wgsn') || name.includes('vogue') || name.includes('fashion') || name.includes('pantone')) {
      return <TrendingUpIcon className="h-4 w-4" />;
    }
    return <Link2 className="h-4 w-4" />;
  };

  const getSourceColor = (sourceName: string) => {
    const name = sourceName.toLowerCase();
    if (name.includes('instagram') || name.includes('tiktok')) {
      return 'from-pink-500/10 to-purple-500/10 border-pink-500/30 text-pink-700';
    }
    if (name.includes('google') || name.includes('trends')) {
      return 'from-blue-500/10 to-cyan-500/10 border-blue-500/30 text-blue-700';
    }
    if (name.includes('pinterest')) {
      return 'from-red-500/10 to-rose-500/10 border-red-500/30 text-red-700';
    }
    if (name.includes('zara') || name.includes('h&m') || name.includes('shein') || name.includes('renner')) {
      return 'from-emerald-500/10 to-green-500/10 border-emerald-500/30 text-emerald-700';
    }
    if (name.includes('wgsn') || name.includes('vogue') || name.includes('fashion') || name.includes('pantone')) {
      return 'from-violet-500/10 to-purple-500/10 border-violet-500/30 text-violet-700';
    }
    return 'from-slate-500/10 to-gray-500/10 border-slate-500/30 text-slate-700';
  };

  const getSourceDescription = (sourceName: string) => {
    const name = sourceName.toLowerCase();
    if (name.includes('instagram')) return 'Rede social - Tendências visuais';
    if (name.includes('tiktok')) return 'Rede social - Vídeos virais';
    if (name.includes('google') && name.includes('trends')) return 'Mecanismo de busca - Volume de pesquisas';
    if (name.includes('pinterest')) return 'Plataforma visual - Pins e boards';
    if (name.includes('zara')) return 'E-commerce - Fast fashion';
    if (name.includes('h&m')) return 'E-commerce - Moda acessível';
    if (name.includes('shein')) return 'E-commerce - Moda rápida online';
    if (name.includes('renner')) return 'E-commerce - Varejo brasileiro';
    if (name.includes('wgsn')) return 'Agência - Previsão de tendências';
    if (name.includes('vogue')) return 'Mídia - Revista de moda';
    if (name.includes('pantone')) return 'Instituto - Cores e padrões';
    return 'Fonte de dados de moda';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando detalhes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-muted-foreground text-lg">Produto não encontrado</p>
          <Button onClick={() => navigate("/results")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Resultados
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/results")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-display font-semibold text-foreground">
              {product.sku || "Detalhes do Produto"}
            </h1>
            <p className="text-muted-foreground mt-1">Análise completa do produto</p>
          </div>
        </div>

        {/* Product Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="border rounded-2xl overflow-hidden bg-card shadow-lg"
        >
          {/* Product Header */}
          <div className="flex gap-6 p-6 border-b bg-muted/20">
            {product.image_url && (
              <div className="w-40 h-40 bg-background rounded-xl flex-shrink-0 overflow-hidden border-2 border-border shadow-sm">
                <img 
                  src={product.image_url} 
                  alt={product.sku || "Produto"} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex-1 flex flex-col justify-center gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-bold font-display">
                    {product.sku || "Produto"}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <span>{product.category || "Sem categoria"}</span>
                    {product.color && (
                      <>
                        <span>•</span>
                        <span>{product.color}</span>
                      </>
                    )}
                  </div>
                </div>
                {product.risk_level && (
                  <Badge 
                    variant={getRiskBadge(product.risk_level)}
                    className="text-sm h-8 px-4"
                  >
                    <div className="flex items-center gap-1.5">
                      {getTrendIcon(product.risk_level)}
                      {getRiskLabel(product.risk_level)}
                    </div>
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Analysis Description */}
            {product.analysis_description && (
              <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground mb-2">Análise Visual</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {product.analysis_description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Demand Score Section */}
            {product.demand_score && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-base font-semibold">Score de Demanda</span>
                  </div>
                  <div className="text-right">
                    <span className="text-5xl font-bold font-display">{product.demand_score}</span>
                    <span className="text-xl text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden border border-border">
                  <motion.div
                    className="h-full bg-primary transition-colors"
                    initial={{ width: 0 }}
                    animate={{ width: `${product.demand_score}%` }}
                    transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                  />
                </div>
                {product.score_justification && (
                  <div className="bg-muted/20 rounded-lg p-3 border border-border/50">
                    <p className="text-xs text-muted-foreground">{product.score_justification}</p>
                  </div>
                )}
              </div>
            )}

            {/* Scoring Breakdown Section */}
            {product.insights?.scoring_breakdown && (
              <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-xl p-5 border border-primary/20">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground mb-1">Breakdown do Score</p>
                    <p className="text-xs text-muted-foreground">{product.insights.scoring_breakdown.score_interpretation}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {['color_component', 'fabric_component', 'style_component'].map((component) => {
                    const data = product.insights.scoring_breakdown[component];
                    if (!data) return null;
                    
                    const componentName = component === 'color_component' ? 'Cor' : 
                                        component === 'fabric_component' ? 'Tecido' : 'Modelagem';
                    
                    return (
                      <motion.div
                        key={component}
                        className="bg-background/60 rounded-lg p-4 border border-border/50"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-foreground">{componentName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{data.weight}% do total</span>
                            <Badge variant="outline" className="text-xs">
                              {data.weighted_score.toFixed(1)} pts
                            </Badge>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                          <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${data.raw_score}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{data.explanation}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Confidence Levels Section */}
            {product.insights?.confidence_levels && (
              <div className="bg-muted/20 rounded-xl p-5 border border-border/50">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Níveis de Confiança</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(product.insights.confidence_levels).map(([key, value]: [string, any]) => {
                    if (key === 'overall_confidence') return null;
                    
                    const label = key === 'color_detection' ? 'Detecção de Cor' :
                                 key === 'fabric_detection' ? 'Detecção de Tecido' :
                                 key === 'style_detection' ? 'Detecção de Modelagem' : key;
                    
                    const confidence = Number(value);
                    const color = confidence >= 80 ? 'text-emerald-500' :
                                 confidence >= 60 ? 'text-amber-500' : 'text-rose-500';
                    
                    return (
                      <div key={key} className="bg-background/60 rounded-lg p-3 border border-border/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">{label}</span>
                          <span className={`text-sm font-bold ${color}`}>{confidence}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${confidence >= 80 ? 'bg-emerald-500' : confidence >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${confidence}%` }}
                            transition={{ duration: 0.6 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {product.insights.confidence_levels.overall_confidence && (
                  <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">Confiança Geral</span>
                      <span className="text-xl font-bold text-primary">
                        {product.insights.confidence_levels.overall_confidence}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Improvements Section */}
            {product.insights?.improvements && product.insights.improvements.length > 0 && (
              <div className="bg-gradient-to-br from-amber-500/5 to-transparent rounded-xl p-5 border border-amber-500/20">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <ArrowUpCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground mb-1">Oportunidades de Melhoria</p>
                    <p className="text-xs text-muted-foreground">Ajustes que podem aumentar o score de demanda</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {product.insights.improvements.map((improvement: any, idx: number) => (
                    <motion.div
                      key={idx}
                      className="bg-background/60 rounded-lg p-4 border border-border/50"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {improvement.aspect}
                            </Badge>
                            {improvement.priority && (
                              <Badge 
                                variant={improvement.priority === 'high' ? 'destructive' : 
                                       improvement.priority === 'medium' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {improvement.priority === 'high' ? 'Alta Prioridade' :
                                 improvement.priority === 'medium' ? 'Média' : 'Baixa'}
                              </Badge>
                            )}
                            {improvement.implementation_difficulty && (
                              <span className="text-xs text-muted-foreground">
                                Dificuldade: {improvement.implementation_difficulty === 'easy' ? 'Fácil' :
                                            improvement.implementation_difficulty === 'medium' ? 'Média' : 'Difícil'}
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Atual:</span>
                              <span className="font-medium">{improvement.current}</span>
                              {improvement.current_score && (
                                <Badge variant="outline" className="text-xs ml-auto">
                                  {improvement.current_score} pts
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-emerald-500" />
                              <span className="text-muted-foreground">Sugerido:</span>
                              <span className="font-medium text-emerald-600">{improvement.suggested}</span>
                              {improvement.suggested_score && (
                                <Badge variant="secondary" className="text-xs ml-auto">
                                  {improvement.suggested_score} pts
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {improvement.score_increase && improvement.new_total_score && (
                          <div className="ml-4 text-right">
                            <div className="text-2xl font-bold text-emerald-600">
                              +{improvement.score_increase}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Score final: {improvement.new_total_score}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground leading-relaxed mt-3 p-3 bg-muted/30 rounded-lg">
                        {improvement.reason}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights Section - Right after demand score */}
            {product.insights && product.insights.length > 0 && (
              <div className="bg-muted/20 rounded-xl p-5 border border-border/50">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Lightbulb className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Principais Insights</p>
                </div>
                <div className="grid gap-3">
                  {product.insights.map((insight: any, idx: number) => (
                    <motion.div 
                      key={idx} 
                      className="bg-background/60 rounded-lg p-4 border border-border/50"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          insight.type === "positive" ? "bg-emerald-100/50" :
                          insight.type === "negative" ? "bg-rose-100/50" :
                          "bg-primary/5"
                        }`}>
                          <Badge 
                            variant={
                              insight.type === "positive" ? "secondary" :
                              insight.type === "negative" ? "destructive" :
                              "default"
                            }
                            className="text-xs h-5 w-5 flex items-center justify-center p-0"
                          >
                            {insight.type === "positive" ? "+" : insight.type === "negative" ? "!" : "i"}
                          </Badge>
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="font-semibold text-sm text-foreground">{insight.title}</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {insight.description}
                          </p>
                          {insight.supporting_data && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">Fonte:</span>
                              <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20">
                                {insight.supporting_data}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Metrics */}
            {product.recommended_quantity && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-3xl font-bold font-display">
                      {product.recommended_quantity}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Unidades
                    </p>
                  </div>

                  {product.estimated_price && (
                    <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-3xl font-bold font-display">
                        {product.estimated_price.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Preço de venda
                      </p>
                    </div>
                  )}

                  {product.estimated_production_cost && (
                    <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Factory className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-3xl font-bold font-display">
                        {product.estimated_production_cost.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Custo unitário
                      </p>
                    </div>
                  )}
                </div>

                {/* Summary Financial Cards */}
                {product.estimated_price && product.estimated_production_cost && (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-6 border border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium text-muted-foreground">Margem</span>
                      </div>
                      <div className="text-5xl font-bold font-display text-primary">
                        {(((product.estimated_price - product.estimated_production_cost) / product.estimated_price * 100) || 0).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sources Section - Enhanced */}
            {product.sources && product.sources.length > 0 && (
              <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-xl p-6 border border-primary/20">
                <div className="flex items-start gap-3 mb-5">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Link2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-foreground mb-1">Fontes de Dados Utilizadas</p>
                    <p className="text-xs text-muted-foreground">
                      Esta análise foi baseada em {product.sources.length} fontes confiáveis de dados de moda
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {product.sources.map((sourceData: any, idx: number) => {
                    const sourceName = typeof sourceData === 'string' ? sourceData : sourceData.source;
                    const sourceCount = typeof sourceData === 'object' && sourceData.count ? sourceData.count : null;
                    const colorClass = getSourceColor(sourceName);
                    const description = getSourceDescription(sourceName);
                    
                    return (
                      <motion.div
                        key={idx}
                        className={`bg-gradient-to-br ${colorClass} rounded-lg p-4 border transition-all hover:shadow-md cursor-default`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getSourceIcon(sourceName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm mb-0.5 truncate">
                              {sourceName}
                            </p>
                            <p className="text-xs opacity-70 mb-2">
                              {description}
                            </p>
                            {sourceCount && (
                              <div className="flex items-center gap-1">
                                <BarChart3 className="h-3 w-3 opacity-70" />
                                <span className="text-xs font-semibold">
                                  {sourceCount.toLocaleString()} pontos de dados
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                <div className="mt-5 p-4 bg-background/50 rounded-lg border border-border/50">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Como funciona:</strong> Cada fonte contribui com dados específicos sobre tendências de cores, tecidos e modelagens. 
                      O número de pontos de dados indica quantas vezes aquela tendência foi identificada naquela fonte específica.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
