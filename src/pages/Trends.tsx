import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Palette, Shirt, Upload as UploadIcon, X, Ruler, ChevronRight, ChevronLeft } from "lucide-react";
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
  { value: "summer", label: "Verão", description: "Coleção leve e colorida" },
  { value: "winter", label: "Inverno", description: "Peças mais pesadas e escuras" },
  { value: "premium", label: "Premium", description: "Linha de luxo e alta qualidade" },
  { value: "casual", label: "Casual", description: "Peças do dia a dia" },
  { value: "fast-fashion", label: "Fast Fashion", description: "Tendências rápidas e acessíveis" },
  { value: "athleisure", label: "Athleisure", description: "Esportivo e confortável" },
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
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header - Minimalista */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-semibold mb-2">Nova Análise</h1>
          <p className="text-sm text-muted-foreground">Configure sua análise de tendências</p>
        </motion.div>

        {/* Wizard Form - Minimalista */}
        <div className="space-y-8">
            {/* Stepper Minimalista */}
            <div className="flex items-center justify-center gap-3">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${currentStep === step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : currentStep > step.id 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {step.id}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-12 h-px mx-2 ${currentStep > step.id ? 'bg-primary' : 'bg-border'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content - Minimalista */}
            <div className="min-h-[300px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  {/* Step 1: Collection Info */}
                  {currentStep === 1 && (
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <Label htmlFor="collection-name" className="text-xs font-medium text-muted-foreground">
                          Nome da coleção
                        </Label>
                        <Input
                          id="collection-name"
                          placeholder="Ex: Verão 2024"
                          value={collectionName}
                          onChange={(e) => setCollectionName(e.target.value)}
                          className="h-11 border-border/50"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-xs font-medium text-muted-foreground">Tipo</Label>
                        <RadioGroup value={collectionType} onValueChange={setCollectionType}>
                          <div className="flex flex-wrap gap-2">
                            {COLLECTION_TYPES.map((type) => (
                              <div key={type.value}>
                                <RadioGroupItem value={type.value} id={type.value} className="peer sr-only" />
                                <Label
                                  htmlFor={type.value}
                                  className="inline-flex items-center px-4 py-2 rounded-full border border-border/50 cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground text-sm"
                                >
                                  {type.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                        {collectionType && (
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-muted-foreground"
                          >
                            {COLLECTION_TYPES.find(t => t.value === collectionType)?.description}
                          </motion.p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Product Upload - Minimalista */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div
                        className={`border border-dashed rounded-xl p-12 text-center transition-all ${
                          dragActive ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
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
                        <UploadIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm mb-3">Arraste imagens ou</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => document.getElementById("file-upload")?.click()}
                        >
                          Selecionar
                        </Button>
                      </div>

                      {products.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground">{products.length} produto(s)</p>
                          {products.map((product) => (
                            <div key={product.id} className="flex gap-3 p-3 border border-border/50 rounded-lg">
                              <div className="relative w-16 h-16 flex-shrink-0">
                                <img src={product.preview} alt="Preview" className="w-full h-full object-cover rounded" />
                                <button
                                  onClick={() => removeProduct(product.id)}
                                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
                                <Select
                                  value={product.category}
                                  onValueChange={(value) => updateProduct(product.id, "category", value)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
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
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: AI Parameters - Minimalista */}
                  {currentStep === 3 && (
                    <div className="space-y-8">
                      <div className="space-y-3">
                        <Label className="text-xs font-medium text-muted-foreground">Focos</Label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setFocusColors(!focusColors)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-all ${
                              focusColors
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border/50 hover:border-primary/50"
                            }`}
                          >
                            <Palette className="h-4 w-4" />
                            Cores
                          </button>
                          <button
                            onClick={() => setFocusFabrics(!focusFabrics)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-all ${
                              focusFabrics
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border/50 hover:border-primary/50"
                            }`}
                          >
                            <Shirt className="h-4 w-4" />
                            Tecidos
                          </button>
                          <button
                            onClick={() => setFocusModels(!focusModels)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-all ${
                              focusModels
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border/50 hover:border-primary/50"
                            }`}
                          >
                            <Ruler className="h-4 w-4" />
                            Modelagens
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-xs font-medium text-muted-foreground">Profundidade</Label>
                        <RadioGroup value={analysisDepth} onValueChange={setAnalysisDepth}>
                          <div className="flex gap-2">
                            {[
                              { value: "quick", label: "Rápida" },
                              { value: "standard", label: "Standard" },
                              { value: "deep", label: "Profunda" },
                            ].map((option) => (
                              <div key={option.value} className="flex-1">
                                <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                                <Label
                                  htmlFor={option.value}
                                  className="block px-4 py-3 text-center rounded-lg border border-border/50 cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground text-sm"
                                >
                                  {option.label}
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
            </div>

            {/* Navigation - Minimalista */}
            <div className="flex justify-between items-center pt-6">
              {currentStep > 1 ? (
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
              ) : <div />}

              {currentStep < STEPS.length ? (
                <Button onClick={handleNext} disabled={!canProceed()} size="sm">
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleGenerateAnalysis} disabled={!canProceed() || loading} size="sm">
                  {loading ? "Gerando..." : "Gerar Análise"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
}
