import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Upload as UploadIcon, X, ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle, AlertCircle, Clock, TrendingUpIcon, ImageOff } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { id: 1, title: "Produtos", description: "Upload de produtos" },
  { id: 2, title: "Parâmetros IA", description: "Configure a análise" },
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
  
  // Form data
  const [collectionName, setCollectionName] = useState("");
  const [collectionType] = useState("casual"); // Default value
  const [products, setProducts] = useState<Product[]>([]);
  const [analysisDepth, setAnalysisDepth] = useState("standard");
  const [dragActive, setDragActive] = useState(false);
  
  // Analysis results
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [invalidImageMessage, setInvalidImageMessage] = useState<string | null>(null);

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
    console.log("Gerando análise com IA:", {
      collectionName,
      collectionType,
      products: products.length,
      parameters: { analysisDepth },
    });

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Usuário não autenticado");
      }

      // Step 1: Generate trend analysis
      const { data: trendData, error: trendError } = await supabase.functions.invoke('analyze-trends', {
        body: {
          collectionType,
          collectionName,
          analysisDepth,
        }
      });

      if (trendError) {
        console.error("Error generating analysis:", trendError);
        toast({
          title: "Erro ao gerar análise",
          description: trendError.message || "Não foi possível gerar a análise. Tente novamente.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log("Trend analysis response:", trendData);

      if (!trendData?.success || !trendData?.data || !trendData?.data?.analysis_id) {
        console.error("Invalid trend data:", trendData);
        throw new Error("Invalid response from trend analysis");
      }

      const analysisId = trendData.data.analysis_id;
      console.log("Analysis ID:", analysisId);

      // Step 2: Analyze product images if any
      if (products.length > 0) {
        toast({
          title: "Analisando produtos...",
          description: `Analisando ${products.length} produto(s) com IA`,
        });

        const productAnalysisPromises = products.map(async (product, index) => {
          try {
            console.log(`Analyzing product ${index + 1}/${products.length}`);
            
            // Convert image to base64
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
            console.log(`Image converted to base64 for product ${index + 1}`);

            // Call analyze-product edge function
            const { data: productData, error: productError } = await supabase.functions.invoke('analyze-product', {
              body: {
                analysisId,
                imageBase64,
                sku: `produto-${product.id}`,
              }
            });

            if (productError) {
              console.error("Error analyzing product:", productError);
              toast({
                title: `Erro ao analisar produto ${index + 1}`,
                description: productError.message,
                variant: "destructive",
              });
              return null;
            }

            // Check if the image is not a clothing item
            if (!productData?.success && productData?.error) {
              console.warn(`Product ${index + 1} is not a clothing item:`, productData.error);
              setInvalidImageMessage(productData.error);
              return null; // Stop analysis for this product
            }

            console.log(`Product ${index + 1} analyzed successfully:`, productData);
            
            toast({
              title: `Produto ${index + 1} analisado`,
              description: `Score: ${productData?.data?.demand_projection || 'N/A'}`,
            });

            return productData;
          } catch (error) {
            console.error("Error processing product:", error);
            toast({
              title: `Erro no produto ${index + 1}`,
              description: error instanceof Error ? error.message : "Erro desconhecido",
              variant: "destructive",
            });
            return null;
          }
        });

        const results = await Promise.all(productAnalysisPromises);
        const successfulAnalyses = results.filter(r => r !== null).length;
        
        console.log(`${successfulAnalyses}/${products.length} products analyzed successfully`);
      }

      toast({
        title: "Análise concluída!",
        description: products.length > 0 
          ? `${products.length} produto(s) analisado(s)`
          : "Tendências identificadas.",
      });

      // Store analysis ID and fetch complete results
      setAnalysisId(analysisId);
      
      // Fetch complete analysis data
      const { data: completeAnalysis, error: fetchError } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .single();
        
      if (fetchError) {
        console.error("Error fetching analysis:", fetchError);
      } else {
        // Fetch products for this analysis
        const { data: analysisProducts, error: productsError } = await supabase
          .from('analysis_products')
          .select('*')
          .eq('analysis_id', analysisId);
          
        if (productsError) {
          console.error("Error fetching products:", productsError);
        }
        
        setAnalysisResults({
          ...completeAnalysis,
          products: analysisProducts || []
        });
      }

      // Navigate to results step
      setCurrentStep(3);
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao gerar análise. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Background Gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="bg-card border-2 border-primary/20 rounded-2xl p-12 shadow-2xl max-w-md w-full mx-4"
            >
              <div className="flex flex-col items-center space-y-6">
                {/* Animated Icon */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center"
                >
                  <Sparkles className="h-10 w-10 text-primary" />
                </motion.div>
                
                {/* Title */}
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Gerando Análise
                  </h3>
                  <p className="text-muted-foreground">
                    A IA está processando seus produtos e identificando tendências...
                  </p>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full space-y-2">
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary/80 to-primary"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Isso pode levar alguns instantes...
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invalid Image Overlay */}
      <AnimatePresence>
        {invalidImageMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-lg"
            >
              <div className="flex flex-col items-center text-center gap-4">
                {/* Icon */}
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <ImageOff className="h-6 w-6 text-destructive" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold">Imagem não é de roupa</h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Envie fotos claras de peças de roupa ou acessórios, com fundo simples e boa iluminação.
                </p>

                {/* Action */}
                <Button
                  onClick={() => setInvalidImageMessage(null)}
                  className="w-full mt-2"
                >
                  Entendi
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header com Gradiente */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 relative"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Nova Análise
            </h1>
          </div>
          <p className="text-muted-foreground">Configure sua análise de tendências com IA</p>
        </motion.div>

        {/* Wizard Form */}
        <div className="space-y-10">
          {/* Stepper Moderno */}
          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
            <div className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-primary/80 to-primary transition-all duration-500"
                 style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }} />
            
            <div className="relative flex justify-between">
              {STEPS.map((step) => (
                <div key={step.id} className="flex flex-col items-center">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: currentStep === step.id ? 1.1 : 1,
                    }}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all shadow-lg
                      ${currentStep === step.id 
                        ? 'bg-gradient-to-br from-primary/80 to-primary text-primary-foreground ring-4 ring-primary/20' 
                        : currentStep > step.id 
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    {currentStep > step.id ? '✓' : step.id}
                  </motion.div>
                  <div className={`mt-3 text-center transition-all ${currentStep === step.id ? 'opacity-100' : 'opacity-50'}`}>
                    <p className="text-xs font-medium">{step.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-[400px]"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Step 1: Product Upload */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="collection-name" className="text-sm font-medium">
                        Nome da Peça
                      </Label>
                      <Input
                        id="collection-name"
                        placeholder="Ex: Verão 2024"
                        value={collectionName}
                        onChange={(e) => setCollectionName(e.target.value)}
                        className="h-12 text-base border-2 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Upload de Imagens</Label>
                      <div
                        className={`relative border-2 border-dashed rounded-2xl p-16 text-center transition-all overflow-hidden ${
                          dragActive ? "border-primary bg-primary/10 scale-[1.01]" : "border-border/50 hover:border-primary/30"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileInput}
                          className="hidden"
                          id="file-upload"
                        />
                        <motion.div
                          animate={{ y: dragActive ? -5 : 0 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <UploadIcon className={`h-10 w-10 transition-all ${dragActive ? 'text-primary scale-110' : 'text-primary/60'}`} />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">Arraste suas imagens</h3>
                          <p className="text-sm text-muted-foreground mb-6">ou clique no botão abaixo</p>
                          <Button
                            type="button"
                            size="lg"
                            onClick={() => document.getElementById("file-upload")?.click()}
                            className="relative overflow-hidden group"
                          >
                            <span className="relative z-10">Selecionar Arquivos</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary-foreground/20 to-primary/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                          </Button>
                        </motion.div>
                      </div>
                    </div>

                    {products.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{products.length}</span>
                          </div>
                          <p className="text-sm font-medium">produto(s) adicionado(s)</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                        {products.map((product, idx) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-border/50 hover:border-primary/30 transition-all group"
                          >
                            <img src={product.preview} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              onClick={() => removeProduct(product.id)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </motion.div>
                        ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Step 2: AI Parameters */}
                {currentStep === 2 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Label className="text-sm font-medium">Profundidade da Análise</Label>
                      <RadioGroup value={analysisDepth} onValueChange={setAnalysisDepth}>
                        <div className="grid gap-3">
                          {[
                            { value: "quick", label: "Rápida", desc: "Insights básicos", icon: "⚡" },
                            { value: "standard", label: "Standard", desc: "Balanceada", icon: "⭐" },
                            { value: "deep", label: "Profunda", desc: "Máxima precisão", icon: "🔍" },
                          ].map((option) => (
                            <div key={option.value}>
                              <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                              <Label
                                htmlFor={option.value}
                                className="flex items-center gap-4 p-4 rounded-xl border-2 border-border/50 cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/50 peer-data-[state=checked]:border-primary/30 peer-data-[state=checked]:bg-primary/5"
                              >
                                <div className="text-2xl opacity-60">{option.icon}</div>
                                <div className="flex-1">
                                  <p className="font-semibold">{option.label}</p>
                                  <p className="text-xs text-muted-foreground">{option.desc}</p>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {/* Step 3: Results */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    {analysisResults ? (
                      <div className="space-y-6">
                        <Card className="border-2">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="font-display">{analysisResults.collection_name}</CardTitle>
                                <CardDescription>
                                  {analysisResults.collection_type} • {analysisResults.products?.length || 0} produto(s) analisado(s)
                                </CardDescription>
                              </div>
                              <Badge variant="secondary" className="text-sm">
                                {new Date(analysisResults.created_at).toLocaleDateString('pt-BR')}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {analysisResults.products && analysisResults.products.length > 0 ? (
                              <div className="grid gap-4">
                                {analysisResults.products.map((product: any, index: number) => {
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

                                  return (
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
                                            <div className="space-y-2">
                                              <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Score de Demanda</span>
                                                <span className="text-lg font-bold text-primary">{product.demand_score}/100</span>
                                              </div>
                                              <div className="w-full bg-muted rounded-full h-2">
                                                <div 
                                                  className="bg-gradient-to-r from-primary/80 to-primary h-2 rounded-full transition-all duration-500"
                                                  style={{ width: `${product.demand_score}%` }}
                                                />
                                              </div>
                                            </div>
                                          )}

                                          {product.analysis_description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                              {product.analysis_description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-8">
                                Nenhum produto foi analisado ainda
                              </p>
                            )}
                          </CardContent>
                        </Card>

                        <div className="flex justify-center gap-3">
                          <Button 
                            variant="outline" 
                            size="lg"
                            onClick={() => navigate('/results')}
                          >
                            Ver Todas Análises
                          </Button>
                          <Button 
                            size="lg"
                            onClick={() => {
                              setCurrentStep(1);
                              setAnalysisResults(null);
                              setAnalysisId(null);
                              setProducts([]);
                              setCollectionName("");
                            }}
                            className="gap-2"
                          >
                            <Sparkles className="h-4 w-4" />
                            Nova Análise
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Nenhum resultado disponível</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8">
            {currentStep > 1 && currentStep < 3 ? (
              <Button variant="outline" size="lg" onClick={handleBack} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </Button>
            ) : <div />}

            {currentStep < 2 && (
              <Button onClick={handleNext} disabled={!canProceed()} size="lg" className="gap-2 min-w-[120px]">
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            
            {currentStep === 2 && (
              <Button 
                onClick={handleGenerateAnalysis} 
                disabled={loading} 
                size="lg" 
                className="gap-2 min-w-[180px] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Sparkles className="h-4 w-4" />
                {loading ? "Gerando..." : "Gerar Análise"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
