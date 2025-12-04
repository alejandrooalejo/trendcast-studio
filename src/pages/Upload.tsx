import { useState, useMemo, useCallback, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload as UploadIcon, X, Sparkles, AlertTriangle, CheckCircle2, Trophy, Loader2, AlertCircle, ImageOff, Camera, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { UploadOnboarding } from "@/components/UploadOnboarding";

interface UploadedFile {
  id: string;
  name: string;
  preview: string;
  base64: string;
  category: string;
  sku: string;
  analyzing: boolean;
  error?: string;
  analysis?: ProductAnalysis;
  imageData?: {
    name: string;
    size: string;
    dimensions: string;
    type: string;
  };
}

interface ProductAnalysis {
  detected_color: string;
  detected_fabric: string;
  detected_style: string;
  alignment_score: number;
  demand_projection: number;
  risk_level: string;
  insights: Array<{
    type: string;
    title: string;
    description: string;
    impact: string;
  }>;
  improvements: Array<{
    aspect: string;
    current: string;
    suggested: string;
    reason: string;
    trend_alignment: number;
  }>;
  comparison: {
    color_match: number;
    fabric_match: number;
    style_match: number;
    overall_trend_alignment: number;
  };
}

export default function Upload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisId, setAnalysisId] = useState<string>("");
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [availableAnalyses, setAvailableAnalyses] = useState<Array<{ id: string; collection_name: string }>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [invalidImageMessage, setInvalidImageMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single image view mode
  const [selectedImage, setSelectedImage] = useState<UploadedFile | null>(null);

  // Load available analyses on mount
  useState(() => {
    loadAnalyses();
  });

  const loadAnalyses = async () => {
    setLoadingAnalyses(true);
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('id, collection_name')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAvailableAnalyses(data || []);
    } catch (error) {
      console.error('Error loading analyses:', error);
      toast.error('Erro ao carregar análises');
    } finally {
      setLoadingAnalyses(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const processFile = useCallback(async (file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Por favor, envie apenas imagens (JPG, PNG ou WEBP)');
      return null;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Imagem muito grande! Tamanho máximo: 10MB');
      return null;
    }

    try {
      const base64 = await fileToBase64(file);
      
      return new Promise<UploadedFile>((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            id: Math.random().toString(),
            name: file.name,
            preview: base64,
            base64: base64,
            category: "",
            sku: "",
            analyzing: false,
            imageData: {
              name: file.name,
              size: (file.size / 1024).toFixed(2) + ' KB',
              dimensions: `${img.width} x ${img.height}`,
              type: file.type.split('/')[1].toUpperCase()
            }
          });
        };
        img.src = base64;
      });
    } catch (error) {
      toast.error(`Erro ao processar ${file.name}`);
      return null;
    }
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );

    if (droppedFiles.length > 0) {
      const processedFile = await processFile(droppedFiles[0]);
      if (processedFile) {
        setSelectedImage(processedFile);
        setFiles(prev => [...prev, processedFile]);
        toast.success('Imagem adicionada com sucesso!');
      }
    }
  }, [processFile]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      const processedFile = await processFile(fileList[0]);
      if (processedFile) {
        setSelectedImage(processedFile);
        setFiles(prev => [...prev, processedFile]);
        toast.success('Imagem adicionada com sucesso!');
      }
    }
  }, [processFile]);

  const clearImage = useCallback(() => {
    if (selectedImage) {
      setFiles(prev => prev.filter(f => f.id !== selectedImage.id));
    }
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedImage]);

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
    if (selectedImage?.id === id) {
      setSelectedImage(null);
    }
  };

  const updateFile = (id: string, updates: Partial<UploadedFile>) => {
    setFiles(files.map(f => f.id === id ? { ...f, ...updates } : f));
    if (selectedImage?.id === id) {
      setSelectedImage(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const analyzeProduct = async (fileId: string) => {
    if (!analysisId) {
      toast.error("Selecione uma análise de tendências primeiro");
      return;
    }

    const file = files.find(f => f.id === fileId);
    if (!file) return;

    setIsAnalyzing(true);
    updateFile(fileId, { analyzing: true, error: undefined });

    try {
      const { data, error } = await supabase.functions.invoke('analyze-product', {
        body: {
          analysisId,
          imageBase64: file.base64,
          sku: file.sku || undefined,
          category: file.category || undefined,
        }
      });

      if (error) throw error;

      if (!data.success && data.error) {
        updateFile(fileId, { 
          analyzing: false,
          error: data.error
        });
        setIsAnalyzing(false);
        setInvalidImageMessage(data.error);
        return;
      }

      if (data.success) {
        updateFile(fileId, { 
          analyzing: false, 
          analysis: data.data,
          error: undefined
        });
        toast.success("Análise concluída!");
      } else {
        throw new Error('Erro na análise');
      }
    } catch (error: any) {
      console.error('Error analyzing product:', error);
      
      let errorMessage = 'Erro ao analisar produto';
      
      if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        errorMessage = 'Muitas requisições. Aguarde alguns segundos';
      } else if (error.message?.includes('payment') || error.message?.includes('402')) {
        errorMessage = 'Créditos insuficientes';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Erro de conexão. Verifique sua internet';
      } else if (error.message?.includes('image') || error.message?.includes('invalid')) {
        errorMessage = 'Imagem inválida ou corrompida';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      updateFile(fileId, { 
        analyzing: false,
        error: errorMessage
      });
    } finally {
      setTimeout(() => {
        setFiles(currentFiles => {
          const stillAnalyzing = currentFiles.some(f => f.analyzing);
          if (!stillAnalyzing) {
            setIsAnalyzing(false);
          }
          return currentFiles;
        });
      }, 100);
    }
  };

  const handleAnalyze = useCallback(() => {
    if (!selectedImage) return;
    analyzeProduct(selectedImage.id);
  }, [selectedImage, analysisId]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800';
      case 'high': return 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/50 dark:border-rose-800';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle2 className="h-4 w-4" />;
      case 'medium': return <Sparkles className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  const rankedProducts = useMemo(() => {
    const analyzed = files.filter(f => f.analysis);
    return analyzed.sort((a, b) => {
      const scoreA = (a.analysis!.demand_projection + a.analysis!.alignment_score) / 2;
      const scoreB = (b.analysis!.demand_projection + b.analysis!.alignment_score) / 2;
      return scoreB - scoreA;
    });
  }, [files]);

  const analyzingCount = files.filter(f => f.analyzing).length;
  const analyzedCount = files.filter(f => f.analysis).length;

  return (
    <DashboardLayout>
      <UploadOnboarding />
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border-2 border-primary/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
            >
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 mx-auto relative">
                    <Loader2 className="w-20 h-20 text-primary animate-spin" />
                    <Sparkles className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold">Analisando Produto</h3>
                  <p className="text-muted-foreground">
                    Processando sua imagem com inteligência artificial
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Identificando tendências...</span>
                  </div>
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
            className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border-2 border-destructive/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <ImageOff className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Análise cancelada</h3>
                    <p className="text-sm text-muted-foreground">
                      A imagem enviada não parece ser de uma peça de roupa.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                  {invalidImageMessage}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setInvalidImageMessage(null)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/10 to-secondary/5 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Camera className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-2">
              TrendCast Studio
            </h1>
            <p className="text-muted-foreground text-lg">
              Analise tendências de moda com inteligência artificial
            </p>
          </div>

          {/* Analysis Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-2 border-border/50">
              <CardContent className="p-6">
                <Label htmlFor="analysis-select" className="text-sm font-medium mb-3 block">
                  Selecione a análise de tendências
                </Label>
                <Select value={analysisId} onValueChange={setAnalysisId}>
                  <SelectTrigger id="analysis-select" className="h-14 text-base">
                    <SelectValue placeholder={loadingAnalyses ? "Carregando..." : "Escolher análise..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAnalyses.map(analysis => (
                      <SelectItem key={analysis.id} value={analysis.id} className="text-base">
                        {analysis.collection_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </motion.div>

          {!selectedImage ? (
            /* Upload Zone */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div
                className={`
                  relative border-4 border-dashed rounded-2xl p-12 transition-all duration-300 bg-card
                  ${isDragging 
                    ? 'border-primary bg-primary/10 scale-[1.02]' 
                    : 'border-border hover:border-primary/40 hover:bg-accent/30'
                  }
                `}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="text-center">
                  <div className="mb-6 flex justify-center">
                    <div className={`
                      p-6 rounded-full transition-all duration-300
                      ${isDragging ? 'bg-primary/20' : 'bg-primary/10'}
                    `}>
                      <UploadIcon className={`
                        w-16 h-16 transition-all duration-300
                        ${isDragging ? 'text-primary scale-110' : 'text-primary/70'}
                      `} />
                    </div>
                  </div>

                  <h3 className="text-2xl font-semibold mb-2">
                    {isDragging ? 'Solte a imagem aqui!' : 'Arraste sua peça de roupa'}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    ou clique para selecionar do seu dispositivo
                  </p>

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="lg"
                    className="px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    Selecionar Imagem
                  </Button>

                  <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span>JPG, PNG, WEBP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span>Máx 10MB</span>
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-border">
                    <p className="text-sm font-semibold mb-4">
                      💡 Dicas para melhores resultados:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="font-medium mb-1">✅ Boa iluminação</div>
                        <div>Foto clara e bem iluminada</div>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="font-medium mb-1">✅ Fundo neutro</div>
                        <div>Destaque a peça de roupa</div>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="font-medium mb-1">✅ Peça completa</div>
                        <div>Mostre todos os detalhes</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Image Preview Card */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden shadow-2xl">
                <div className="relative bg-muted">
                  <img
                    src={selectedImage.preview}
                    alt="Preview"
                    className="w-full h-96 object-contain"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-4 right-4 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-all duration-300 shadow-lg hover:scale-110"
                    disabled={selectedImage.analyzing}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {selectedImage.imageData && (
                  <div className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Nome</div>
                        <div className="font-semibold truncate">
                          {selectedImage.imageData.name}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Tamanho</div>
                        <div className="font-semibold">
                          {selectedImage.imageData.size}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Dimensões</div>
                        <div className="font-semibold">
                          {selectedImage.imageData.dimensions}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Formato</div>
                        <div className="font-semibold">
                          {selectedImage.imageData.type}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <CardContent className="p-6 border-t border-border">
                  {/* Category and SKU fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label htmlFor="category" className="text-sm mb-2 block">Categoria</Label>
                      <Select 
                        value={selectedImage.category} 
                        onValueChange={(val) => updateFile(selectedImage.id, { category: val })}
                      >
                        <SelectTrigger id="category" className="h-12">
                          <SelectValue placeholder="Selecionar categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vestido">Vestido</SelectItem>
                          <SelectItem value="calca">Calça</SelectItem>
                          <SelectItem value="blusa">Blusa</SelectItem>
                          <SelectItem value="jaqueta">Jaqueta</SelectItem>
                          <SelectItem value="saia">Saia</SelectItem>
                          <SelectItem value="short">Short</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="sku" className="text-sm mb-2 block">SKU (opcional)</Label>
                      <Input 
                        id="sku" 
                        placeholder="Ex: VER-001" 
                        value={selectedImage.sku}
                        onChange={(e) => updateFile(selectedImage.id, { sku: e.target.value })}
                        className="h-12"
                      />
                    </div>
                  </div>

                  {/* Error message */}
                  {selectedImage.error && (
                    <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-destructive">Erro na análise</p>
                        <p className="text-sm text-muted-foreground mt-1">{selectedImage.error}</p>
                      </div>
                    </div>
                  )}

                  {/* Analysis result preview */}
                  {selectedImage.analysis && (
                    <div className="mb-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="font-medium text-emerald-900 dark:text-emerald-100">Análise Concluída</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Score de Demanda:</span>
                          <span className="ml-2 font-semibold">{selectedImage.analysis.demand_projection}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Alinhamento:</span>
                          <span className="ml-2 font-semibold">{selectedImage.analysis.alignment_score}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-4">
                    <Button
                      onClick={handleAnalyze}
                      disabled={selectedImage.analyzing || !analysisId}
                      size="lg"
                      className={`
                        flex-1 py-6 text-lg font-semibold rounded-xl shadow-lg transition-all duration-300
                        ${selectedImage.analyzing ? '' : 'hover:scale-[1.02] hover:shadow-xl'}
                      `}
                    >
                      {selectedImage.analyzing ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Analisando tendências...
                        </span>
                      ) : selectedImage.analysis ? (
                        <span className="flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          Reanalisar Tendência
                        </span>
                      ) : (
                        <>🔍 Analisar Tendência</>
                      )}
                    </Button>

                    <Button
                      onClick={clearImage}
                      disabled={selectedImage.analyzing}
                      variant="outline"
                      size="lg"
                      className="py-6 px-8 text-lg rounded-xl"
                    >
                      Trocar Imagem
                    </Button>
                  </div>

                  {selectedImage.analyzing && (
                    <div className="mt-6 bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        </div>
                        <div>
                          <div className="font-medium mb-1">
                            Analisando sua peça...
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>✓ Identificando cores e padrões</div>
                            <div>✓ Buscando tendências em redes sociais</div>
                            <div>✓ Calculando score de adequação</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Results Section */}
          {rankedProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-12"
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Trophy className="h-7 w-7 text-primary" />
                    <h2 className="text-2xl font-semibold">Top Produtos</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {rankedProducts.slice(0, 5).map((file, index) => {
                      const overallScore = ((file.analysis!.demand_projection + file.analysis!.alignment_score) / 2).toFixed(0);
                      return (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.08 }}
                          className={`
                            flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer
                            ${index === 0 
                              ? 'border-2 border-primary/40 bg-primary/5' 
                              : 'border border-border hover:border-primary/20 hover:bg-accent/30'
                            }
                          `}
                          onClick={() => setSelectedImage(file)}
                        >
                          <div className={`
                            text-3xl font-bold w-12 text-center
                            ${index === 0 ? 'text-primary' : 'text-muted-foreground/40'}
                          `}>
                            #{index + 1}
                          </div>
                          
                          <img 
                            src={file.preview} 
                            alt={file.name} 
                            className="w-16 h-16 object-cover rounded-lg border border-border"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{file.sku || file.name}</h3>
                            <p className="text-sm text-muted-foreground">{file.category}</p>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-2xl font-bold">{overallScore}%</div>
                              <div className="text-xs text-muted-foreground">Score</div>
                            </div>
                            
                            <Badge variant="outline" className={`${getRiskColor(file.analysis!.risk_level)} py-1.5 px-3`}>
                              {getRiskIcon(file.analysis!.risk_level)}
                              <span className="ml-1.5 capitalize">{file.analysis!.risk_level}</span>
                            </Badge>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              🔒 Suas imagens são processadas com segurança e não são armazenadas
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
