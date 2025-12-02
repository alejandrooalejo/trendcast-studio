import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Target, TrendingUp, Lightbulb, AlertCircle, Clock, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { SimilarProducts } from "@/components/SimilarProducts";

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
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        setTimeout(() => navigate("/results"), 2000);
        return;
      }
      
      setProduct(data);
    } catch (error) {
      console.error("Error fetching product details:", error);
      toast({
        title: "Erro ao carregar detalhes",
        description: "Não foi possível carregar os detalhes do produto",
        variant: "destructive",
      });
      setTimeout(() => navigate("/results"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    const riskLower = risk?.toLowerCase();
    if (riskLower === "alto" || riskLower === "high") return "destructive";
    if (riskLower === "baixo" || riskLower === "low") return "default";
    return "secondary";
  };

  const getRiskLabel = (risk: string) => {
    const riskLower = risk?.toLowerCase();
    if (riskLower === "alto" || riskLower === "high") return "Alto Risco";
    if (riskLower === "baixo" || riskLower === "low") return "Baixo Risco";
    if (riskLower === "medio" || riskLower === "medium" || riskLower === "médio") return "Risco Moderado";
    return "—";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Carregando detalhes...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!product) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">Produto não encontrado</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
            O produto que você está procurando não existe ou foi removido.
          </p>
          <Button onClick={() => navigate("/results")} className="mt-6">
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
          <Button variant="outline" size="sm" onClick={() => navigate("/results")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {product.sku || "Detalhes do Produto"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {product.category || "Sem categoria"}
              {product.color && ` • ${product.color}`}
            </p>
          </div>
          {product.created_at && (
            <Badge variant="outline" className="hidden sm:flex">
              <Calendar className="mr-1 h-3 w-3" />
              {format(new Date(product.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </Badge>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Image & Basic Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-6">
                  {product.image_url && (
                    <div className="h-40 w-40 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img 
                        src={product.image_url} 
                        alt={product.sku || "Produto"} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-semibold">{product.sku || "Produto"}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          {product.category || "Sem categoria"}
                          {product.color && ` • ${product.color}`}
                          {product.fabric && ` • ${product.fabric}`}
                        </p>
                      </div>
                      {product.risk_level && (
                        <Badge variant={getRiskBadgeVariant(product.risk_level)}>
                          {getRiskLabel(product.risk_level)}
                        </Badge>
                      )}
                    </div>

                    {product.analysis_description && (
                      <p className="text-sm text-muted-foreground">
                        {product.analysis_description}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Demand Score */}
            {product.demand_score && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Score de Demanda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-4xl font-bold">{product.demand_score}</span>
                    <span className="text-muted-foreground mb-1">/100</span>
                  </div>
                  <Progress value={product.demand_score} className="h-2" />
                  {product.score_justification && (
                    <p className="text-sm text-muted-foreground mt-3">
                      {product.score_justification}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Trend Analysis */}
            {(product.trend_status || product.reason || product.recommendation) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Análise de Tendência
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product.trend_status && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Status</p>
                      <Badge variant={product.trend_status.toLowerCase().includes('alta') ? 'default' : 'secondary'}>
                        {product.trend_status}
                      </Badge>
                    </div>
                  )}

                  {product.trend_level && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Nível</p>
                      <p className="font-medium">{product.trend_level}</p>
                    </div>
                  )}

                  {product.reason && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Motivo</p>
                      <p className="text-sm">{product.reason}</p>
                    </div>
                  )}

                  {product.related_trend && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Tendência Relacionada</p>
                      <Badge variant="outline">{product.related_trend}</Badge>
                    </div>
                  )}

                  {product.current_usage && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Uso Atual</p>
                      <p className="text-sm">{product.current_usage}</p>
                    </div>
                  )}

                  {product.recommendation && (
                    <>
                      <Separator />
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="h-4 w-4 text-primary" />
                          <p className="text-xs font-medium uppercase">Recomendação</p>
                        </div>
                        <p className="text-sm">{product.recommendation}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Financial Projections */}
            {(product.estimated_price || product.estimated_production_cost || product.projected_revenue) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Projeções Financeiras</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {product.estimated_price && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Preço Estimado</p>
                        <p className="text-lg font-semibold">
                          R$ {product.estimated_price.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {product.estimated_production_cost && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Custo Produção</p>
                        <p className="text-lg font-semibold">
                          R$ {product.estimated_production_cost.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {product.projected_revenue && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Receita Projetada</p>
                        <p className="text-lg font-semibold">
                          R$ {product.projected_revenue.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Production Recommendations */}
            {(product.recommended_quantity || product.target_audience_size) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recomendações de Produção</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {product.recommended_quantity && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Quantidade Recomendada</p>
                        <p className="text-lg font-semibold">
                          {product.recommended_quantity.toLocaleString()} unidades
                        </p>
                      </div>
                    )}
                    {product.target_audience_size && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Público Alvo</p>
                        <p className="text-lg font-semibold">
                          {product.target_audience_size.toLocaleString()} pessoas
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Temporal Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Informações Temporais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.created_at && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Analisado em</p>
                    <p className="font-medium">
                      {format(new Date(product.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(product.created_at), { 
                        addSuffix: true,
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                )}

                <Separator />

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Validade Estimada</p>
                  <p className="font-medium">
                    {product.demand_score >= 70 
                      ? '6-12 meses' 
                      : product.demand_score >= 50 
                      ? '3-6 meses' 
                      : '1-3 meses'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Sources */}
            {product.sources && Array.isArray(product.sources) && product.sources.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Fontes</CardTitle>
                  <CardDescription>{product.sources.length} fonte(s) analisada(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {product.sources.map((source: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span>{typeof source === 'string' ? source : source.name || 'Fonte'}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Similar Products */}
        {product.image_url && product.image_hash && (
          <SimilarProducts 
            productId={product.id}
            imageUrl={product.image_url}
            imageHash={product.image_hash}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
