import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Upload as UploadIcon, X, ChevronRight, ChevronLeft, ImageOff, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STEPS = [
  { id: 1, title: "Produtos", description: "Upload de produtos" },
  { id: 2, title: "Parâmetros", description: "Configure a análise" },
  { id: 3, title: "Resultados", description: "Veja sua análise" },
];

interface Product {
  id: string;
  file: File;
  preview: string;
}

export default function Trends() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [collectionName, setCollectionName] = useState("");
  const [collectionType] = useState("casual");
  const [products, setProducts] = useState<Product[]>([]);
  const [analysisDepth, setAnalysisDepth] = useState("standard");
  const [dragActive, setDragActive] = useState(false);
  
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [invalidImageDialog, setInvalidImageDialog] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const newProducts = imageFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
    }));
    setProducts([...products, ...newProducts]);
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return collectionName && products.length > 0;
      case 2:
        return true;
      case 3:
        return analysisResults !== null;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerateAnalysis = async () => {
    if (!canProceed()) return;

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Usuário não autenticado");
      }

      const { data: trendData, error: trendError } = await supabase.functions.invoke('analyze-trends', {
        body: {
          collectionType,
          collectionName,
          analysisDepth,
        }
      });

      if (trendError) {
        toast({
          title: "Erro ao gerar análise",
          description: trendError.message || "Não foi possível gerar a análise.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!trendData?.success || !trendData?.data || !trendData?.data?.analysis_id) {
        throw new Error("Invalid response from trend analysis");
      }

      const analysisId = trendData.data.analysis_id;

      if (products.length > 0) {
        toast({
          title: "Analisando produtos...",
          description: `Analisando ${products.length} produto(s) com IA`,
        });

        const productAnalysisPromises = products.map(async (product, index) => {
          try {
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onloadend = () => {
                const base64 = reader.result as string;
                resolve(base64);
              };
              reader.onerror = reject;
              reader.readAsDataURL(product.file);
            });

            const imageBase64 = await base64Promise;

            const { data: productData, error: productError } = await supabase.functions.invoke('analyze-product', {
              body: {
                analysisId,
                imageBase64,
                sku: `produto-${product.id}`,
              }
            });

            if (productError) {
              return null;
            }

            if (!productData?.success && productData?.error) {
              setInvalidImageDialog(true);
              return null;
            }

            toast({
              title: `Produto ${index + 1} analisado`,
              description: `Score: ${productData?.data?.demand_projection || 'N/A'}`,
            });

            return productData;
          } catch (error) {
            return null;
          }
        });

        const results = await Promise.all(productAnalysisPromises);
        const successfulAnalyses = results.filter(r => r !== null).length;

        if (successfulAnalyses === 0) {
          await supabase.from('analyses').delete().eq('id', analysisId);

          toast({
            title: "Nenhum produto de moda identificado",
            description: "As imagens enviadas não parecem ser de peças de roupa.",
            variant: "destructive",
          });

          setLoading(false);
          return;
        }
      }

      toast({
        title: "Análise concluída!",
        description: products.length > 0 
          ? `${products.length} produto(s) analisado(s)`
          : "Tendências identificadas.",
      });

      setAnalysisId(analysisId);
      
      const { data: completeAnalysis, error: fetchError } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .single();
        
      if (!fetchError) {
        const { data: analysisProducts, error: productsError } = await supabase
          .from('analysis_products')
          .select('*')
          .eq('analysis_id', analysisId);
          
        setAnalysisResults({
          ...completeAnalysis,
          products: analysisProducts || []
        });
      }

      setCurrentStep(3);
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao gerar análise.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Loading Dialog */}
      <Dialog open={loading}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Gerando Análise
            </DialogTitle>
            <DialogDescription>
              A IA está processando seus produtos e identificando tendências...
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-pulse w-2/3" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invalid Image Dialog */}
      <Dialog open={invalidImageDialog} onOpenChange={setInvalidImageDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
              <ImageOff className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Imagem não é de roupa</DialogTitle>
            <DialogDescription className="text-center">
              Envie fotos claras de peças de roupa ou acessórios, com fundo simples e boa iluminação.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setInvalidImageDialog(false)} className="w-full">
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nova Análise</h1>
          <p className="text-sm text-muted-foreground">Configure sua análise de tendências</p>
        </div>

        {/* Stepper */}
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {STEPS.map((step, stepIdx) => (
              <li key={step.id} className={`relative ${stepIdx !== STEPS.length - 1 ? 'pr-8 sm:pr-20 flex-1' : ''}`}>
                <div className="flex items-center">
                  <div
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                      currentStep > step.id
                        ? 'bg-primary text-primary-foreground'
                        : currentStep === step.id
                        ? 'border-2 border-primary text-primary'
                        : 'border-2 border-muted text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.id ? '✓' : step.id}
                  </div>
                  {stepIdx !== STEPS.length - 1 && (
                    <div className={`absolute top-4 left-8 -ml-px h-0.5 w-full ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-xs font-medium">{step.title}</span>
                </div>
              </li>
            ))}
          </ol>
        </nav>

        {/* Step Content */}
        <Card>
          <CardContent className="pt-6">
            {/* Step 1: Product Upload */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="collection-name">Nome da Peça</Label>
                  <Input
                    id="collection-name"
                    placeholder="Ex: Vestido Verão 2024"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Upload de Imagens</Label>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileInput}
                      className="hidden"
                      id="file-upload"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <UploadIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">Arraste suas imagens aqui</p>
                        <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => document.getElementById("file-upload")?.click()}
                      >
                        Selecionar Arquivos
                      </Button>
                    </div>
                  </div>
                </div>

                {products.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{products.length}</Badge>
                      <span className="text-sm text-muted-foreground">produto(s) selecionado(s)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="relative h-16 w-16 rounded-md overflow-hidden border group"
                        >
                          <img src={product.preview} alt="Preview" className="h-full w-full object-cover" />
                          <button
                            onClick={() => removeProduct(product.id)}
                            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: AI Parameters */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <Label>Profundidade da Análise</Label>
                <RadioGroup value={analysisDepth} onValueChange={setAnalysisDepth} className="space-y-2">
                  {[
                    { value: "quick", label: "Rápida", desc: "Análise básica" },
                    { value: "standard", label: "Standard", desc: "Análise balanceada" },
                    { value: "deep", label: "Profunda", desc: "Análise completa" },
                  ].map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                        <span className="font-medium">{option.label}</span>
                        <span className="ml-2 text-sm text-muted-foreground">{option.desc}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 3: Results */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {analysisResults ? (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                        <Plus className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold">Análise Concluída</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {analysisResults.products?.length || 0} produto(s) analisado(s)
                      </p>
                    </div>
                    
                    {analysisResults.products?.length > 0 && (
                      <div className="space-y-2">
                        {analysisResults.products.map((product: any, index: number) => (
                          <div
                            key={product.id}
                            className="flex items-center gap-3 p-3 rounded-lg border"
                          >
                            {product.image_url && (
                              <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                <img 
                                  src={product.image_url} 
                                  alt={product.sku || "Produto"} 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {product.sku || `Produto ${index + 1}`}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {product.category || "Sem categoria"}
                              </p>
                            </div>
                            {product.demand_score && (
                              <Badge variant="secondary">
                                Score: {product.demand_score}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <Button 
                      onClick={() => navigate("/results")} 
                      className="w-full"
                    >
                      Ver Todos os Resultados
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum resultado disponível</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          {currentStep < 3 ? (
            currentStep === 2 ? (
              <Button onClick={handleGenerateAnalysis} disabled={!canProceed() || loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gerar Análise
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )
          ) : (
            <Button onClick={() => {
              setCurrentStep(1);
              setCollectionName("");
              setProducts([]);
              setAnalysisResults(null);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Análise
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
