import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload as UploadIcon, X, Sparkles, AlertTriangle, CheckCircle2, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UploadedFile {
  id: string;
  name: string;
  preview: string;
  base64: string;
  category: string;
  sku: string;
  analyzing: boolean;
  analysis?: ProductAnalysis;
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableAnalyses(data || []);
    } catch (error) {
      console.error('Error loading analyses:', error);
      toast.error('Erro ao carregar análises');
    } finally {
      setLoadingAnalyses(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );

    await processFiles(droppedFiles);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    await processFiles(selectedFiles);
  };

  const processFiles = async (fileList: File[]) => {
    const newFiles: UploadedFile[] = [];
    
    for (const file of fileList) {
      const base64 = await fileToBase64(file);
      newFiles.push({
        id: Math.random().toString(),
        name: file.name,
        preview: base64,
        base64: base64,
        category: "",
        sku: "",
        analyzing: false,
      });
    }
    
    setFiles([...files, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const updateFile = (id: string, updates: Partial<UploadedFile>) => {
    setFiles(files.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const analyzeProduct = async (fileId: string) => {
    if (!analysisId) {
      toast.error("Selecione uma análise de tendências primeiro");
      return;
    }

    const file = files.find(f => f.id === fileId);
    if (!file) return;

    updateFile(fileId, { analyzing: true });

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

      if (data.success) {
        updateFile(fileId, { 
          analyzing: false, 
          analysis: data.data 
        });
        toast.success("Análise concluída!");
      } else {
        throw new Error(data.error || 'Erro na análise');
      }
    } catch (error: any) {
      console.error('Error analyzing product:', error);
      toast.error(error.message || 'Erro ao analisar produto');
      updateFile(fileId, { analyzing: false });
    }
  };

  const handleAnalyzeAll = () => {
    if (files.length === 0) {
      toast.error("Adicione pelo menos um produto para análise");
      return;
    }
    if (!analysisId) {
      toast.error("Selecione uma análise de tendências");
      return;
    }
    
    files.forEach(file => {
      if (!file.analysis) {
        analyzeProduct(file.id);
      }
    });
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-foreground bg-secondary border-border';
      case 'medium': return 'text-muted-foreground bg-muted border-border';
      case 'high': return 'text-foreground bg-accent border-border';
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

  // Calculate rankings based on analysis
  const rankedProducts = useMemo(() => {
    const analyzed = files.filter(f => f.analysis);
    return analyzed.sort((a, b) => {
      const scoreA = (a.analysis!.demand_projection + a.analysis!.alignment_score) / 2;
      const scoreB = (b.analysis!.demand_projection + b.analysis!.alignment_score) / 2;
      return scoreB - scoreA;
    });
  }, [files]);

  const getProductRank = (fileId: string) => {
    const index = rankedProducts.findIndex(f => f.id === fileId);
    return index >= 0 ? index + 1 : null;
  };

  const getRankBadge = (rank: number | null) => {
    if (!rank) return null;
    if (rank === 1) return <Badge className="bg-yellow-500 text-white"><Trophy className="h-3 w-3 mr-1" />Melhor Produto</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400 text-white">2º Lugar</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600 text-white">3º Lugar</Badge>;
    return <Badge variant="secondary">#{rank}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3 mb-16"
        >
          <h1 className="text-5xl font-display font-bold tracking-tight">Nova Análise</h1>
          <p className="text-lg text-muted-foreground">Compare seus produtos com as tendências do mercado</p>
        </motion.div>

        {/* Analysis Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
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
        </motion.div>

        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-2xl p-20 text-center transition-all duration-300
              ${isDragging 
                ? 'border-primary bg-primary/10 scale-[1.01] shadow-lg' 
                : 'border-border/50 hover:border-primary/40 hover:bg-accent/30'
              }
            `}
          >
            <UploadIcon 
              className={`h-20 w-20 mx-auto mb-6 transition-all duration-300 ${
                isDragging ? 'text-primary scale-110' : 'text-muted-foreground'
              }`} 
            />
            <div className="space-y-5">
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold">Arraste suas imagens</h3>
                <p className="text-muted-foreground">ou clique para selecionar</p>
              </div>
              <label htmlFor="file-input">
                <Button size="lg" className="cursor-pointer h-12 px-8 text-base" asChild>
                  <span>Escolher Arquivos</span>
                </Button>
              </label>
              <input
                id="file-input"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">Formatos: PNG, JPG • Tamanho máximo: 10MB</p>
            </div>
          </div>
        </motion.div>

        {/* Products List */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">{files.length} {files.length === 1 ? 'Produto' : 'Produtos'}</h2>
              <Button 
                onClick={handleAnalyzeAll} 
                disabled={!analysisId}
                size="lg"
                className="h-12 px-6"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Analisar Todos
              </Button>
            </div>

            <div className="space-y-3">
              {files.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group p-5 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-accent/20 transition-all"
                >
                  <div className="flex gap-5 items-start">
                    {/* Image */}
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                      <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                      {file.analysis && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[1px]">
                          <CheckCircle2 className="h-8 w-8 text-primary" />
                        </div>
                      )}
                    </div>
                    
                    {/* Form */}
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`category-${file.id}`} className="text-xs mb-1.5 block">Categoria</Label>
                          <Select value={file.category} onValueChange={(val) => updateFile(file.id, { category: val })}>
                            <SelectTrigger id={`category-${file.id}`} className="h-10">
                              <SelectValue placeholder="Selecionar" />
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
                          <Label htmlFor={`sku-${file.id}`} className="text-xs mb-1.5 block">SKU</Label>
                          <Input 
                            id={`sku-${file.id}`} 
                            placeholder="Ex: VER-001" 
                            value={file.sku}
                            onChange={(e) => updateFile(file.id, { sku: e.target.value })}
                            className="h-10"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => analyzeProduct(file.id)}
                          disabled={file.analyzing || !analysisId}
                          size="sm"
                          variant={file.analysis ? "secondary" : "default"}
                          className="flex-1 sm:flex-none"
                        >
                          {file.analyzing ? "Analisando..." : file.analysis ? "✓ Analisado" : "Analisar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Results Section */}
        {rankedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 pt-16 border-t border-border"
          >
            <div className="flex items-center gap-3 mb-8">
              <Trophy className="h-7 w-7 text-primary" />
              <h2 className="text-3xl font-semibold">Top Produtos</h2>
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
                      flex items-center gap-6 p-6 rounded-xl transition-all
                      ${index === 0 
                        ? 'border-2 border-primary/40 bg-primary/5 shadow-lg' 
                        : 'border border-border/50 hover:border-primary/20 hover:bg-accent/30'
                      }
                    `}
                  >
                    <div className={`
                      text-4xl font-bold w-16 text-center
                      ${index === 0 ? 'text-primary' : 'text-muted-foreground/40'}
                    `}>
                      #{index + 1}
                    </div>
                    
                    <img 
                      src={file.preview} 
                      alt={file.name} 
                      className="w-24 h-24 object-cover rounded-lg border-2 border-border"
                    />
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold">{file.sku || file.name}</h3>
                        <p className="text-sm text-muted-foreground">{file.category}</p>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="flex-1 max-w-md">
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-muted-foreground">Score Geral</span>
                            <span className="font-bold text-lg">{overallScore}%</span>
                          </div>
                          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-primary transition-all"
                              initial={{ width: 0 }}
                              animate={{ width: `${overallScore}%` }}
                              transition={{ duration: 0.8, delay: index * 0.1 }}
                            />
                          </div>
                        </div>
                        
                        <Badge variant="outline" className={`${getRiskColor(file.analysis!.risk_level)} text-sm py-1.5 px-3`}>
                          {getRiskIcon(file.analysis!.risk_level)}
                          <span className="ml-2 capitalize font-medium">{file.analysis!.risk_level}</span>
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
