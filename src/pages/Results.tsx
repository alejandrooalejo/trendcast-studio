import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ExternalLink, Target, CheckCircle2, AlertCircle, AlertTriangle, 
  Sparkles, ImageOff, Clock, Calendar, TrendingUp, TrendingDown, 
  Trash2, Instagram, Hash, ChevronDown, ChevronUp, Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Results() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, string | null>>({});
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      }
      
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

      const offset = loadMore ? analyses.length : 0;

      const { data: analysesData, error: analysesError } = await supabase
        .from("analyses")
        .select("id, collection_name, collection_type, created_at, status, user_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (analysesError) throw analysesError;

      setHasMore((analysesData || []).length === ITEMS_PER_PAGE);

      const analysisIds = (analysesData || []).map(a => a.id);
      
      if (analysisIds.length === 0) {
        if (!loadMore) {
          setAnalyses([]);
        }
        return;
      }
      
      const { data: allProducts, error: productsError } = await supabase
        .from("analysis_products")
        .select("*")
        .in("analysis_id", analysisIds);

      if (productsError) console.error("Error fetching products:", productsError);

      const productsByAnalysis = (allProducts || []).reduce((acc, product) => {
        if (!acc[product.analysis_id]) {
          acc[product.analysis_id] = [];
        }
        acc[product.analysis_id].push(product);
        return acc;
      }, {} as Record<string, any[]>);

      const analysesWithProducts = (analysesData || []).map(analysis => ({
        ...analysis,
        products: productsByAnalysis[analysis.id] || [],
      }));

      if (loadMore) {
        setAnalyses([...analyses, ...analysesWithProducts]);
      } else {
        setAnalyses(analysesWithProducts);
      }
    } catch (error) {
      console.error("Error fetching analyses:", error);
      toast({
        title: "Erro ao carregar análises",
        description: "Não foi possível carregar suas análises",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const toggleSection = (analysisId: string, section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [analysisId]: prev[analysisId] === section ? null : section
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800";
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800";
    return "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/50 dark:border-rose-800";
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return "🔥";
    if (score >= 60) return "👍";
    return "⚠️";
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up" || trend === "alta" || trend === "high") return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (trend === "down" || trend === "baixa" || trend === "low") return <TrendingDown className="w-4 h-4 text-rose-500" />;
    return <div className="w-4 h-4 text-muted-foreground">→</div>;
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

  const getTimeAgoLabel = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const daysAgo = differenceInDays(new Date(), date);
      
      if (daysAgo === 0) return "Hoje";
      if (daysAgo === 1) return "Ontem";
      if (daysAgo < 7) return `Há ${daysAgo} dias`;
      if (daysAgo < 30) return `Há ${Math.floor(daysAgo / 7)} semanas`;
      if (daysAgo < 365) return `Há ${Math.floor(daysAgo / 30)} meses`;
      return `Há ${Math.floor(daysAgo / 365)} anos`;
    } catch {
      return "Data inválida";
    }
  };

  const handleDeleteAnalysis = async (analysisId: string, collectionName: string) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a análise "${collectionName}"? Esta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("analyses")
        .delete()
        .eq("id", analysisId);

      if (error) throw error;

      setAnalyses(analyses.filter(a => a.id !== analysisId));

      toast({
        title: "Análise excluída",
        description: "A análise foi removida com sucesso",
      });
    } catch (error) {
      console.error("Error deleting analysis:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a análise",
        variant: "destructive",
      });
    }
  };

  // Calculate overall score for an analysis
  const getOverallScore = (products: any[]) => {
    if (products.length === 0) return 0;
    const totalScore = products.reduce((sum, p) => sum + (p.demand_score || 0), 0);
    return Math.round(totalScore / products.length);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[500px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-4"
          >
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
            </div>
            <div>
              <p className="text-lg font-semibold">Carregando análises</p>
              <p className="text-sm text-muted-foreground mt-1">Aguarde um momento...</p>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  if (analyses.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[500px] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center space-y-6 max-w-md"
          >
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
              <ImageOff className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">Nenhuma análise encontrada</h2>
              <p className="text-muted-foreground">
                Você ainda não criou nenhuma análise. Comece criando uma nova análise de tendências.
              </p>
            </div>
            <Button onClick={() => navigate("/trends")} size="lg" className="mt-4">
              <Sparkles className="mr-2 h-5 w-5" />
              Criar Nova Análise
            </Button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/10 to-secondary/5 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Resultados das Análises</h1>
              <p className="text-muted-foreground mt-1">
                {analyses.length} análise(s) • Baseada em tendências de redes sociais e IA
              </p>
            </div>
            <Button onClick={() => navigate("/trends")} size="lg">
              <Sparkles className="mr-2 h-5 w-5" />
              Nova Análise
            </Button>
          </div>

          {/* Timeline Summary */}
          {analyses.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-2 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold mb-1">Linha do Tempo</h3>
                      <p className="text-xs text-muted-foreground">
                        Suas análises ao longo do tempo
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30 rounded-lg">
                      <div className="text-3xl font-bold text-emerald-600 mb-1">
                        {analyses.filter(a => differenceInDays(new Date(), new Date(a.created_at)) < 7).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Últimos 7 dias</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30 rounded-lg">
                      <div className="text-3xl font-bold text-amber-600 mb-1">
                        {analyses.filter(a => differenceInDays(new Date(), new Date(a.created_at)) < 30).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Últimos 30 dias</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {analyses.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Analysis Cards */}
          {analyses.map((analysis, analysisIndex) => {
            const overallScore = getOverallScore(analysis.products);
            
            return (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: analysisIndex * 0.1 }}
              >
                <Card className="overflow-hidden shadow-xl">
                  {/* Header com Score Geral */}
                  <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-1">{analysis.collection_name}</h2>
                        <p className="text-primary-foreground/80 text-sm">
                          {analysis.collection_type} • {analysis.products.length} produto(s) analisado(s)
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {getTimeAgoLabel(analysis.created_at)}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(analysis.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-5xl font-bold">{overallScore}</div>
                          <div className="text-sm text-primary-foreground/80">Score Médio</div>
                        </div>
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={() => handleDeleteAnalysis(analysis.id, analysis.collection_name)}
                          className="h-10 w-10"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    {analysis.products.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhum produto analisado ainda
                      </p>
                    ) : (
                      <div className="space-y-6">
                        {/* Products Grid */}
                        <div className="grid gap-4">
                          {analysis.products.map((product: any, index: number) => (
                            <motion.div
                              key={product.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="border rounded-xl overflow-hidden hover:shadow-md transition-all bg-card cursor-pointer"
                              onClick={() => navigate(`/product-details?id=${product.id}`)}
                            >
                              <div className="p-4 border-b border-border">
                                <div className="flex flex-col md:flex-row gap-4">
                                  {product.image_url && (
                                    <div className="w-full md:w-1/4">
                                      <img 
                                        src={product.image_url} 
                                        alt={product.sku || "Produto"}
                                        className="w-full h-48 md:h-32 object-cover rounded-lg"
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1 space-y-3">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <h3 className="text-xl font-bold">
                                          {product.sku || `Produto ${index + 1}`}
                                        </h3>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          {product.color && (
                                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                              {product.color}
                                            </span>
                                          )}
                                          {product.category && (
                                            <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
                                              {product.category}
                                            </span>
                                          )}
                                          {product.fabric && (
                                            <span className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm font-medium">
                                              {product.fabric}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {product.risk_level && (
                                        <Badge 
                                          variant={getRiskBadge(product.risk_level)}
                                          className="text-sm py-1.5 px-3"
                                        >
                                          {product.risk_level === "low" || product.risk_level === "baixo" ? (
                                            <CheckCircle2 className="h-4 w-4 mr-1" />
                                          ) : product.risk_level === "high" || product.risk_level === "alto" ? (
                                            <AlertTriangle className="h-4 w-4 mr-1" />
                                          ) : (
                                            <AlertCircle className="h-4 w-4 mr-1" />
                                          )}
                                          {getRiskLabel(product.risk_level)}
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Scores */}
                                    {product.demand_score && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <div className="flex items-end justify-between mb-2">
                                            <span className="text-sm text-muted-foreground">Score de Demanda</span>
                                            <span className="text-2xl font-bold">{product.demand_score}</span>
                                          </div>
                                          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                            <motion.div 
                                              className={`h-full rounded-full ${
                                                product.demand_score >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                                                product.demand_score >= 60 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                                                'bg-gradient-to-r from-rose-400 to-rose-600'
                                              }`}
                                              initial={{ width: 0 }}
                                              animate={{ width: `${product.demand_score}%` }}
                                              transition={{ duration: 1, delay: index * 0.1 }}
                                            />
                                          </div>
                                        </div>
                                        
                                        {product.estimated_price && (
                                          <div className="text-center p-3 bg-gradient-to-br from-primary/10 to-transparent rounded-lg border border-primary/20">
                                            <p className="text-xs text-muted-foreground mb-1">Valor de Mercado</p>
                                            <p className="text-xl font-bold text-primary">
                                              R$ {product.estimated_price.toFixed(2)}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Insights Section */}
                              {product.insights && (
                                <div className="p-4 bg-muted/30">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    <span className="font-semibold">Insights</span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {(Array.isArray(product.insights) ? product.insights : []).slice(0, 2).map((insight: any, idx: number) => (
                                      <div 
                                        key={idx}
                                        className={`p-3 rounded-lg border-2 flex items-start gap-2 ${
                                          insight.type === 'strength' || insight.impact === 'positive'
                                            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800' 
                                            : 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800'
                                        }`}
                                      >
                                        {insight.type === 'strength' || insight.impact === 'positive' ? (
                                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                        ) : (
                                          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                        )}
                                        <div className="text-sm">
                                          <div className="font-medium">{insight.title}</div>
                                          <div className="text-muted-foreground text-xs mt-0.5">
                                            {insight.description?.slice(0, 80)}...
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Action */}
                              <div className="p-4 border-t border-border flex justify-end">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/product-details?id=${product.id}`);
                                  }}
                                >
                                  Ver Análise Completa
                                  <ExternalLink className="ml-2 h-4 w-4" />
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {/* Expandable Sections */}
                        <div className="space-y-3">
                          {/* Social Proof Section */}
                          <div className="bg-card rounded-xl border overflow-hidden">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSection(analysis.id, 'social');
                              }}
                              className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Instagram className="w-5 h-5 text-pink-500" />
                                <span className="font-semibold">Presença em Redes Sociais</span>
                              </div>
                              {expandedSections[analysis.id] === 'social' ? (
                                <ChevronUp className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              )}
                            </button>
                            
                            <AnimatePresence>
                              {expandedSections[analysis.id] === 'social' && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 border-t border-border pt-4">
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                      <div className="text-center p-3 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 rounded-lg">
                                        <div className="text-2xl font-bold text-pink-600">127K</div>
                                        <div className="text-xs text-muted-foreground">Instagram</div>
                                      </div>
                                      <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">2.3M</div>
                                        <div className="text-xs text-muted-foreground">TikTok</div>
                                      </div>
                                      <div className="text-center p-3 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-lg">
                                        <div className="text-2xl font-bold text-red-600">45K</div>
                                        <div className="text-xs text-muted-foreground">Pinterest</div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <Hash className="w-4 h-4 text-blue-500" />
                                        Hashtags em Alta
                                      </h4>
                                      <div className="flex flex-wrap gap-2">
                                        {["#streetwear2024", "#fashiontrends", "#sustainablefashion", "#modabrasileira"].map((tag, idx) => (
                                          <span key={idx} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Target Audience Section */}
                          <div className="bg-card rounded-xl border overflow-hidden">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSection(analysis.id, 'audience');
                              }}
                              className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary" />
                                <span className="font-semibold">Público-Alvo Recomendado</span>
                              </div>
                              {expandedSections[analysis.id] === 'audience' ? (
                                <ChevronUp className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              )}
                            </button>
                            
                            <AnimatePresence>
                              {expandedSections[analysis.id] === 'audience' && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 border-t border-border pt-4">
                                    <div className="grid grid-cols-3 gap-4">
                                      <div className="text-center p-3 bg-primary/5 rounded-lg">
                                        <div className="text-lg font-bold text-primary">18-35</div>
                                        <div className="text-xs text-muted-foreground">Faixa Etária</div>
                                      </div>
                                      <div className="text-center p-3 bg-secondary rounded-lg">
                                        <div className="text-sm font-bold">Casual Urbano</div>
                                        <div className="text-xs text-muted-foreground">Estilo</div>
                                      </div>
                                      <div className="text-center p-3 bg-accent rounded-lg">
                                        <div className="text-sm font-bold">R$ 89-149</div>
                                        <div className="text-xs text-muted-foreground">Faixa de Preço</div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col md:flex-row gap-3 pt-4">
                          <Button 
                            className="flex-1"
                            onClick={() => navigate("/upload")}
                          >
                            📊 Analisar Novos Produtos
                          </Button>
                          <Button 
                            variant="outline"
                            className="flex-1"
                            onClick={() => navigate("/trends")}
                          >
                            🔄 Nova Análise de Tendências
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          
          {/* Load More Button */}
          {hasMore && analyses.length > 0 && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={() => fetchAnalyses(true)}
                disabled={loadingMore}
                size="lg"
                variant="outline"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Carregando...
                  </>
                ) : (
                  "Carregar Mais Análises"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
