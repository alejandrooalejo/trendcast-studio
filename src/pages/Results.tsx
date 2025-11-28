import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Target, CheckCircle2, AlertCircle, AlertTriangle, Sparkles, ImageOff, Clock, Calendar, TrendingUp as TrendingUpIcon } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow, format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  const getTimeFreshnessColor = (dateString: string) => {
    try {
      const daysAgo = differenceInDays(new Date(), new Date(dateString));
      if (daysAgo < 7) return "text-emerald-600 bg-emerald-50 border-emerald-200";
      if (daysAgo < 30) return "text-amber-600 bg-amber-50 border-amber-200";
      return "text-slate-600 bg-slate-50 border-slate-200";
    } catch {
      return "text-slate-600 bg-slate-50 border-slate-200";
    }
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
              <p className="text-lg font-semibold text-foreground">Carregando análises</p>
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
              <h2 className="text-2xl font-semibold text-foreground">Nenhuma análise encontrada</h2>
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
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-display font-semibold text-foreground">Resultados das Análises</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">{analyses.length} análise(s) encontrada(s)</p>
              {analyses.length > 0 && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingUpIcon className="h-3.5 w-3.5" />
                    {analyses.filter(a => differenceInDays(new Date(), new Date(a.created_at)) < 7).length} recentes
                  </div>
                </>
              )}
            </div>
          </div>
          
          <Button onClick={() => navigate("/trends")} size="lg">
            <Sparkles className="mr-2 h-5 w-5" />
            Nova Análise
          </Button>
        </div>

        <div className="space-y-8">
          {/* Timeline Summary */}
          {analyses.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-primary/5 to-transparent rounded-xl p-5 border border-primary/20"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUpIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground mb-1">Linha do Tempo</h3>
                  <p className="text-xs text-muted-foreground">
                    Suas análises ao longo do tempo
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs text-muted-foreground">Últimos 7 dias</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {analyses.filter(a => differenceInDays(new Date(), new Date(a.created_at)) < 7).length}
                  </p>
                </div>
                
                <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    <span className="text-xs text-muted-foreground">Últimos 30 dias</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {analyses.filter(a => differenceInDays(new Date(), new Date(a.created_at)) < 30).length}
                  </p>
                </div>
                
                <div className="bg-background/50 rounded-lg p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{analyses.length}</p>
                </div>
              </div>
            </motion.div>
          )}

          {analyses.map((analysis) => (
            <Card key={analysis.id} className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="font-display">{analysis.collection_name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span>{analysis.collection_type}</span>
                      <span>•</span>
                      <span>{analysis.products.length} produto(s) analisado(s)</span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs border ${getTimeFreshnessColor(analysis.created_at)}`}>
                      <Clock className="h-3 w-3 mr-1" />
                      {getTimeAgoLabel(analysis.created_at)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(analysis.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </Badge>
                    {differenceInDays(new Date(), new Date(analysis.created_at)) < 2 && (
                      <Badge className="text-xs bg-emerald-500 hover:bg-emerald-600">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Novo
                      </Badge>
                    )}
                  </div>
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
