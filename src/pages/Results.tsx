import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ExternalLink, 
  Target, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Plus, 
  ImageOff, 
  Clock, 
  Calendar, 
  TrendingUp, 
  Trash2,
  Loader2,
  MoreHorizontal
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow, format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Results() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
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
        .select("id, analysis_id, sku, category, color, image_url, risk_level, demand_score, estimated_price")
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

  const getRiskBadgeVariant = (risk: string) => {
    const riskLower = risk?.toLowerCase();
    if (riskLower === "alto" || riskLower === "high") return "destructive";
    if (riskLower === "baixo" || riskLower === "low") return "secondary";
    return "outline";
  };

  const getRiskLabel = (risk: string) => {
    const riskLower = risk?.toLowerCase();
    if (riskLower === "alto" || riskLower === "high") return "Alto Risco";
    if (riskLower === "baixo" || riskLower === "low") return "Baixo Risco";
    if (riskLower === "medio" || riskLower === "medium" || riskLower === "médio") return "Risco Moderado";
    return "—";
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Carregando análises...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (analyses.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <ImageOff className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">Nenhuma análise encontrada</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
            Você ainda não criou nenhuma análise. Comece criando uma nova análise de tendências.
          </p>
          <Button onClick={() => navigate("/")} className="mt-6">
            <Plus className="mr-2 h-4 w-4" />
            Nova Análise
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Resultados</h1>
            <p className="text-sm text-muted-foreground">
              {analyses.length} análise(s) encontrada(s)
            </p>
          </div>
          <Button onClick={() => navigate("/")}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Análise
          </Button>
        </div>

        {/* Stats */}
        {analyses.length > 1 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Últimos 7 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyses.filter(a => differenceInDays(new Date(), new Date(a.created_at)) < 7).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Últimos 30 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyses.filter(a => differenceInDays(new Date(), new Date(a.created_at)) < 30).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Total
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyses.length}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analysis List */}
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <Card key={analysis.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{analysis.collection_name}</CardTitle>
                    <CardDescription>
                      {analysis.collection_type} • {analysis.products.length} produto(s)
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {format(new Date(analysis.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </Badge>
                    {differenceInDays(new Date(), new Date(analysis.created_at)) < 2 && (
                      <Badge className="text-xs">Novo</Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir análise?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir "{analysis.collection_name}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAnalysis(analysis.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {analysis.products.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum produto analisado</p>
                ) : (
                  <div className="space-y-3">
                    {analysis.products.map((product: any, index: number) => (
                      <div
                        key={product.id}
                        onClick={() => navigate(`/product-details?id=${product.id}`)}
                        className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                      >
                        {product.image_url && (
                          <div className="h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            <img 
                              src={product.image_url} 
                              alt={product.sku || "Produto"} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {product.sku || `Produto ${index + 1}`}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {product.category || "Sem categoria"}
                            {product.color && ` • ${product.color}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {product.demand_score && (
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Score</p>
                              <p className="font-semibold">{product.demand_score}</p>
                            </div>
                          )}
                          {product.risk_level && (
                            <Badge variant={getRiskBadgeVariant(product.risk_level)}>
                              {getRiskLabel(product.risk_level)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => fetchAnalyses(true)}
              disabled={loadingMore}
            >
              {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Carregar mais
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
