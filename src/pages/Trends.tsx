import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Palette, Shirt, Upload as UploadIcon, X, Ruler, ChevronRight, ChevronLeft, Sun, Snowflake, Crown, Coffee, Zap, Dumbbell } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const COLLECTION_TYPES = [
  { value: "summer", label: "Verão", description: "Coleção leve e colorida", icon: Sun, color: "from-foreground to-foreground/70" },
  { value: "winter", label: "Inverno", description: "Peças mais pesadas e escuras", icon: Snowflake, color: "from-foreground to-foreground/70" },
  { value: "premium", label: "Premium", description: "Linha de luxo e alta qualidade", icon: Crown, color: "from-foreground to-foreground/70" },
  { value: "casual", label: "Casual", description: "Peças do dia a dia", icon: Coffee, color: "from-foreground to-foreground/70" },
  { value: "fast-fashion", label: "Fast Fashion", description: "Tendências rápidas e acessíveis", icon: Zap, color: "from-foreground to-foreground/70" },
  { value: "athleisure", label: "Athleisure", description: "Esportivo e confortável", icon: Dumbbell, color: "from-foreground to-foreground/70" },
];

const STEPS = [
  { id: 1, title: "Tipo de Coleção", description: "Identifique sua coleção" },
  { id: 2, title: "Produtos", description: "Upload de produtos" },
  { id: 3, title: "Parâmetros IA", description: "Configure a análise" },
];

interface Product {
  id: string;
  file: File;
  preview: string;
  category: string;
  fabric: string;
  color: string;
  sku: string;
}

export default function Trends() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [collectionName, setCollectionName] = useState("");
  const [collectionType, setCollectionType] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [focusColors, setFocusColors] = useState(true);
  const [focusFabrics, setFocusFabrics] = useState(true);
  const [focusModels, setFocusModels] = useState(true);
  const [analysisDepth, setAnalysisDepth] = useState("standard");
  const [dragActive, setDragActive] = useState(false);

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
      category: "",
      fabric: "",
      color: "",
      sku: "",
    }));
    setProducts([...products, ...newProducts]);
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const updateProduct = (id: string, field: string, value: string) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return collectionName && collectionType;
      case 2:
        return products.length > 0;
      case 3:
        return true;
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
      parameters: { focusColors, focusFabrics, focusModels, analysisDepth },
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
          focusColors,
          focusFabrics,
          focusModels,
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
                sku: product.sku || `produto-${product.id}`,
                category: product.category,
                fabric: product.fabric,
                color: product.color,
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
          ? `Redirecionando para resultados...`
          : "Tendências identificadas. Redirecionando...",
      });

      // Redirecionar para página de resultados
      setTimeout(() => {
        navigate('/results');
      }, 1000);
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
      <div className="fixed inset-0 -z-10 bg-background" />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header com Gradiente */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 relative"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
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
            <div className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
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
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' 
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
                {/* Step 1: Collection Info */}
                {currentStep === 1 && (
                  <div className="space-y-8">
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

                    <div className="space-y-4">
                      <Label className="text-sm font-medium">Tipo de coleção</Label>
                      <RadioGroup value={collectionType} onValueChange={setCollectionType}>
                        <div className="grid grid-cols-2 gap-3">
                          {COLLECTION_TYPES.map((type) => (
                            <div key={type.value}>
                              <RadioGroupItem value={type.value} id={type.value} className="peer sr-only" />
                              <Label
                                htmlFor={type.value}
                                className="relative flex flex-col items-start gap-3 p-5 rounded-xl border-2 border-border/50 cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent group overflow-hidden"
                              >
                                <div className="flex items-center gap-3 relative z-10">
                                  <div className={`w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-md`}>
                                    <type.icon className="h-5 w-5 text-primary-foreground" />
                                  </div>
                                  <div>
                                    <p className="font-semibold">{type.label}</p>
                                    <p className="text-xs text-muted-foreground">{type.description}</p>
                                  </div>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {/* Step 2: Product Upload */}
                {currentStep === 2 && (
                  <div className="space-y-6">
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

                    {products.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{products.length}</span>
                          </div>
                          <p className="text-sm font-medium">produto(s) adicionado(s)</p>
                        </div>
                        {products.map((product, idx) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex gap-4 p-4 border-2 border-border/50 rounded-xl hover:border-primary/30 hover:bg-accent/30 transition-all group"
                          >
                            <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 border-border">
                              <img src={product.preview} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                onClick={() => removeProduct(product.id)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <Select
                                value={product.category}
                                onValueChange={(value) => updateProduct(product.id, "category", value)}
                              >
                                <SelectTrigger className="h-9 text-xs border-border/50">
                                  <SelectValue placeholder="Categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="camiseta">Camiseta</SelectItem>
                                  <SelectItem value="calca">Calça</SelectItem>
                                  <SelectItem value="vestido">Vestido</SelectItem>
                                  <SelectItem value="jaqueta">Jaqueta</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder="SKU"
                                value={product.sku}
                                onChange={(e) => updateProduct(product.id, "sku", e.target.value)}
                                className="h-9 text-xs border-border/50"
                              />
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Step 3: AI Parameters */}
                {currentStep === 3 && (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <Label className="text-sm font-medium">Focos da Análise</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          onClick={() => setFocusColors(!focusColors)}
                          className={`relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all overflow-hidden ${
                            focusColors
                              ? "border-primary bg-gradient-to-br from-primary/10 to-transparent"
                              : "border-border/50 hover:border-primary/30"
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                            focusColors ? 'bg-gradient-to-br from-pink-500 to-purple-500' : 'bg-muted'
                          }`}>
                            <Palette className={`h-7 w-7 ${focusColors ? 'text-white' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-sm">Cores</p>
                            <p className="text-xs text-muted-foreground mt-1">Tendências cromáticas</p>
                          </div>
                        </button>

                        <button
                          onClick={() => setFocusFabrics(!focusFabrics)}
                          className={`relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all overflow-hidden ${
                            focusFabrics
                              ? "border-primary bg-gradient-to-br from-primary/10 to-transparent"
                              : "border-border/50 hover:border-primary/30"
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                            focusFabrics ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-muted'
                          }`}>
                            <Shirt className={`h-7 w-7 ${focusFabrics ? 'text-white' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-sm">Tecidos</p>
                            <p className="text-xs text-muted-foreground mt-1">Materiais em alta</p>
                          </div>
                        </button>

                        <button
                          onClick={() => setFocusModels(!focusModels)}
                          className={`relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all overflow-hidden ${
                            focusModels
                              ? "border-primary bg-gradient-to-br from-primary/10 to-transparent"
                              : "border-border/50 hover:border-primary/30"
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                            focusModels ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-muted'
                          }`}>
                            <Ruler className={`h-7 w-7 ${focusModels ? 'text-white' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-sm">Modelagens</p>
                            <p className="text-xs text-muted-foreground mt-1">Cortes e silhuetas</p>
                          </div>
                        </button>
                      </div>
                    </div>

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
                                className="flex items-center gap-4 p-4 rounded-xl border-2 border-border/50 cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-gradient-to-r peer-data-[state=checked]:from-primary/10 peer-data-[state=checked]:to-transparent"
                              >
                                <div className="text-2xl">{option.icon}</div>
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
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-8">
            {currentStep > 1 ? (
              <Button variant="outline" size="lg" onClick={handleBack} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </Button>
            ) : <div />}

            {currentStep < STEPS.length ? (
              <Button onClick={handleNext} disabled={!canProceed()} size="lg" className="gap-2 min-w-[120px]">
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleGenerateAnalysis} 
                disabled={!canProceed() || loading} 
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
