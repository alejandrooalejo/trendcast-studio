import { useState } from "react";
import { TrendingUp, Sparkles, Palette, Shirt, Upload as UploadIcon, X, Ruler, ChevronRight, ChevronLeft } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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

const demandData = [
  { month: "Jan", demand: 400 },
  { month: "Fev", demand: 300 },
  { month: "Mar", demand: 600 },
  { month: "Abr", demand: 800 },
  { month: "Mai", demand: 700 },
  { month: "Jun", demand: 900 },
];

const trendingColors = [
  { name: "Terracota", hex: "#E07856", confidence: 94 },
  { name: "Verde Sage", hex: "#A4B494", confidence: 89 },
  { name: "Azul Petróleo", hex: "#2C5F72", confidence: 87 },
];

const trendingFabrics = [
  { name: "Linho Orgânico", trend: "+45%", icon: Shirt },
  { name: "Algodão Reciclado", trend: "+38%", icon: Shirt },
  { name: "Viscose Sustentável", trend: "+32%", icon: Shirt },
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
  const [currentStep, setCurrentStep] = useState(1);
  const [showResults, setShowResults] = useState(false);
  
  // Form data
  const [collectionName, setCollectionName] = useState("");
  const [collectionType, setCollectionType] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [focusColors, setFocusColors] = useState(true);
  const [focusFabrics, setFocusFabrics] = useState(true);
  const [focusModels, setFocusModels] = useState(true);
  const [analysisDepth, setAnalysisDepth] = useState("standard");
  const [dragActive, setDragActive] = useState(false);

  const progress = (currentStep / STEPS.length) * 100;

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

  const handleGenerateAnalysis = () => {
    console.log("Gerando análise:", {
      collectionName,
      collectionType,
      products,
      parameters: { focusColors, focusFabrics, focusModels, analysisDepth },
    });
    setShowResults(true);
  };

  const handleNewAnalysis = () => {
    setShowResults(false);
    setCurrentStep(1);
    setCollectionName("");
    setCollectionType("");
    setProducts([]);
    setFocusColors(true);
    setFocusFabrics(true);
    setFocusModels(true);
    setAnalysisDepth("standard");
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-foreground font-display">Análise de Tendências IA</h1>
            <p className="text-muted-foreground mt-2">
              {showResults ? "Resultados da sua análise" : "Crie análises inteligentes para prever tendências"}
            </p>
          </div>
          {showResults && (
            <Button onClick={handleNewAnalysis} variant="outline">
              <Sparkles className="mr-2 h-4 w-4" />
              Nova Análise
            </Button>
          )}
        </div>

        {!showResults ? (
          /* Wizard Form */
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-display flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Nova Análise
              </CardTitle>
              <CardDescription>Configure sua análise de tendências de moda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  {STEPS.map((step) => (
                    <div
                      key={step.id}
                      className={`flex-1 text-center ${
                        currentStep === step.id
                          ? "text-primary font-medium"
                          : currentStep > step.id
                          ? "text-muted-foreground"
                          : "text-muted-foreground/50"
                      }`}
                    >
                      <div className="font-medium">{step.title}</div>
                      <div className="text-xs">{step.description}</div>
                    </div>
                  ))}
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Step Content */}
              <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Step 1: Collection Info */}
                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-display font-medium mb-4">Identifique sua Coleção</h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            Dê um nome à sua coleção e selecione o tipo para uma análise mais precisa.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="collection-name">Nome da Coleção</Label>
                          <Input
                            id="collection-name"
                            placeholder="Ex: Coleção Verão 2024"
                            value={collectionName}
                            onChange={(e) => setCollectionName(e.target.value)}
                            className="text-base"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label>Tipo de Coleção</Label>
                          <RadioGroup value={collectionType} onValueChange={setCollectionType} className="grid gap-3">
                            {COLLECTION_TYPES.map((type) => (
                              <div key={type.value}>
                                <RadioGroupItem value={type.value} id={type.value} className="peer sr-only" />
                                <Label
                                  htmlFor={type.value}
                                  className="flex items-start gap-4 p-4 rounded-lg border-2 border-muted cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium mb-1">{type.label}</div>
                                    <div className="text-sm text-muted-foreground">{type.description}</div>
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Product Upload */}
                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-display font-medium mb-4">Upload de Produtos</h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            Faça upload das fotos dos produtos que deseja analisar.
                          </p>
                        </div>

                        <div
                          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                            dragActive ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
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

                          <UploadIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-sm font-medium mb-2">Arraste e solte suas imagens aqui</p>
                          <p className="text-xs text-muted-foreground mb-4">ou clique no botão abaixo</p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById("file-upload")?.click()}
                          >
                            Selecionar Arquivos
                          </Button>
                        </div>

                        {products.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-base">Produtos ({products.length})</Label>
                            </div>

                            <div className="grid gap-4">
                              {products.map((product) => (
                                <div key={product.id} className="flex gap-4 p-4 border rounded-lg bg-card">
                                  <div className="relative w-20 h-20 flex-shrink-0">
                                    <img src={product.preview} alt="Preview" className="w-full h-full object-cover rounded" />
                                    <button
                                      onClick={() => removeProduct(product.id)}
                                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>

                                  <div className="flex-1 grid grid-cols-2 gap-3">
                                    <div>
                                      <Label className="text-xs">Categoria</Label>
                                      <Select
                                        value={product.category}
                                        onValueChange={(value) => updateProduct(product.id, "category", value)}
                                      >
                                        <SelectTrigger className="h-9">
                                          <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="camiseta">Camiseta</SelectItem>
                                          <SelectItem value="calca">Calça</SelectItem>
                                          <SelectItem value="vestido">Vestido</SelectItem>
                                          <SelectItem value="jaqueta">Jaqueta</SelectItem>
                                          <SelectItem value="saia">Saia</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div>
                                      <Label className="text-xs">Tecido</Label>
                                      <Input
                                        placeholder="Ex: Algodão"
                                        value={product.fabric}
                                        onChange={(e) => updateProduct(product.id, "fabric", e.target.value)}
                                        className="h-9"
                                      />
                                    </div>

                                    <div>
                                      <Label className="text-xs">Cor</Label>
                                      <Input
                                        placeholder="Ex: Azul"
                                        value={product.color}
                                        onChange={(e) => updateProduct(product.id, "color", e.target.value)}
                                        className="h-9"
                                      />
                                    </div>

                                    <div>
                                      <Label className="text-xs">SKU</Label>
                                      <Input
                                        placeholder="Ex: SKU-001"
                                        value={product.sku}
                                        onChange={(e) => updateProduct(product.id, "sku", e.target.value)}
                                        className="h-9"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {products.length === 0 && (
                          <div className="text-center py-8 text-sm text-muted-foreground">
                            Nenhum produto adicionado ainda
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 3: AI Parameters */}
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-display font-medium mb-4">Parâmetros da Análise IA</h3>
                          <p className="text-sm text-muted-foreground mb-6">
                            Configure o foco e a profundidade da análise de inteligência artificial.
                          </p>
                        </div>

                        <div className="space-y-4">
                          <Label className="text-base">Focos da Análise</Label>
                          <p className="text-sm text-muted-foreground">Selecione em quais aspectos a IA deve focar</p>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Palette className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <Label htmlFor="focus-colors" className="text-sm font-medium cursor-pointer">
                                    Análise de Cores
                                  </Label>
                                  <p className="text-xs text-muted-foreground">Tendências cromáticas e combinações</p>
                                </div>
                              </div>
                              <Switch id="focus-colors" checked={focusColors} onCheckedChange={setFocusColors} />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Shirt className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <Label htmlFor="focus-fabrics" className="text-sm font-medium cursor-pointer">
                                    Análise de Tecidos
                                  </Label>
                                  <p className="text-xs text-muted-foreground">Materiais mais buscados e valorizados</p>
                                </div>
                              </div>
                              <Switch id="focus-fabrics" checked={focusFabrics} onCheckedChange={setFocusFabrics} />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Ruler className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <Label htmlFor="focus-models" className="text-sm font-medium cursor-pointer">
                                    Análise de Modelagens
                                  </Label>
                                  <p className="text-xs text-muted-foreground">Cortes, silhuetas e estilos em alta</p>
                                </div>
                              </div>
                              <Switch id="focus-models" checked={focusModels} onCheckedChange={setFocusModels} />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-base">Profundidade da Análise</Label>
                          <RadioGroup value={analysisDepth} onValueChange={setAnalysisDepth} className="grid gap-3">
                            <div>
                              <RadioGroupItem value="quick" id="quick" className="peer sr-only" />
                              <Label
                                htmlFor="quick"
                                className="flex items-center gap-4 p-4 rounded-lg border-2 border-muted cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                              >
                                <div className="flex-1">
                                  <div className="font-medium mb-1">Análise Rápida</div>
                                  <div className="text-sm text-muted-foreground">Insights básicos em poucos minutos</div>
                                </div>
                              </Label>
                            </div>
                            <div>
                              <RadioGroupItem value="standard" id="standard" className="peer sr-only" />
                              <Label
                                htmlFor="standard"
                                className="flex items-center gap-4 p-4 rounded-lg border-2 border-muted cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                              >
                                <div className="flex-1">
                                  <div className="font-medium mb-1">Análise Standard</div>
                                  <div className="text-sm text-muted-foreground">
                                    Balanceada entre velocidade e profundidade
                                  </div>
                                </div>
                              </Label>
                            </div>
                            <div>
                              <RadioGroupItem value="deep" id="deep" className="peer sr-only" />
                              <Label
                                htmlFor="deep"
                                className="flex items-center gap-4 p-4 rounded-lg border-2 border-muted cursor-pointer transition-all hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                              >
                                <div className="flex-1">
                                  <div className="font-medium mb-1">Análise Profunda</div>
                                  <div className="text-sm text-muted-foreground">Máxima precisão com análise detalhada</div>
                                </div>
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                          <div className="flex items-start gap-3">
                            <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium mb-1">Pronto para gerar análise!</p>
                              <p className="text-muted-foreground">
                                A IA analisará {products.length} produto(s) focando em{" "}
                                {[
                                  focusColors && "cores",
                                  focusFabrics && "tecidos",
                                  focusModels && "modelagens",
                                ]
                                  .filter(Boolean)
                                  .join(", ")}{" "}
                                com profundidade {analysisDepth}.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>

                <div className="text-sm text-muted-foreground">
                  Passo {currentStep} de {STEPS.length}
                </div>

                {currentStep < STEPS.length ? (
                  <Button onClick={handleNext} disabled={!canProceed()}>
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleGenerateAnalysis} disabled={!canProceed()}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Análise
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Results Section */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display">Cores em Alta</CardTitle>
                  <CardDescription>Tendências cromáticas mais buscadas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {trendingColors.map((color, index) => (
                    <div key={color.name} className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg shadow-sm" style={{ backgroundColor: color.hex }} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{color.name}</span>
                          <Badge variant="secondary">{color.confidence}% confiança</Badge>
                        </div>
                        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${color.confidence}%` }}
                            transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-display">Tecidos em Destaque</CardTitle>
                  <CardDescription>Materiais mais valorizados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {trendingFabrics.map((fabric, index) => (
                    <motion.div
                      key={fabric.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <fabric.icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium">{fabric.name}</span>
                      </div>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{fabric.trend}</Badge>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-display">Projeção de Demanda</CardTitle>
                <CardDescription>Próximos 6 meses baseado em tendências</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={demandData}>
                    <defs>
                      <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area type="monotone" dataKey="demand" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorDemand)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
