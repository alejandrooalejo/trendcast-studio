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
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-4xl font-display font-bold text-foreground">Nova Análise</h1>
          <p className="text-muted-foreground">Compare seus produtos com as tendências do mercado</p>
        </motion.div>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="results" disabled={files.length === 0}>
              Resultados {files.length > 0 && `(${files.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6 mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="analysis-select" className="text-base">Análise de Tendências</Label>
                      <Select value={analysisId} onValueChange={setAnalysisId}>
                        <SelectTrigger id="analysis-select" className="h-12">
                          <SelectValue placeholder={loadingAnalyses ? "Carregando..." : "Selecione uma análise"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAnalyses.map(analysis => (
                            <SelectItem key={analysis.id} value={analysis.id}>
                              {analysis.collection_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`
                        relative border-2 border-dashed rounded-xl p-16 text-center transition-all duration-300
                        ${isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-accent/50'}
                      `}
                    >
                      <UploadIcon className={`h-16 w-16 mx-auto mb-4 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-1">Solte suas imagens aqui</h3>
                          <p className="text-sm text-muted-foreground">ou clique no botão abaixo</p>
                        </div>
                        <label htmlFor="file-input">
                          <Button size="lg" variant="default" asChild className="cursor-pointer">
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
                        <p className="text-xs text-muted-foreground">PNG, JPG até 10MB</p>
                      </div>
                    </div>

                    {files.length > 0 && (
                      <div className="flex justify-end">
                        <Button onClick={handleAnalyzeAll} disabled={!analysisId} size="lg">
                          <Sparkles className="mr-2 h-5 w-5" />
                          Analisar Todos ({files.length})
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-4"
              >
                {files.map((file, index) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex gap-4 items-center">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 border-border">
                            <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                          </div>
                          
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <Label htmlFor={`category-${file.id}`} className="text-xs">Categoria</Label>
                              <Select value={file.category} onValueChange={(val) => updateFile(file.id, { category: val })}>
                                <SelectTrigger id={`category-${file.id}`} className="h-9">
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
                              <Label htmlFor={`sku-${file.id}`} className="text-xs">SKU</Label>
                              <Input 
                                id={`sku-${file.id}`} 
                                placeholder="Ex: VER-001" 
                                value={file.sku}
                                onChange={(e) => updateFile(file.id, { sku: e.target.value })}
                                className="h-9"
                              />
                            </div>

                            <div className="flex items-end gap-2">
                              <Button
                                onClick={() => analyzeProduct(file.id)}
                                disabled={file.analyzing || !analysisId}
                                size="sm"
                                className="flex-1"
                                variant={file.analysis ? "secondary" : "default"}
                              >
                                {file.analyzing ? "Analisando..." : file.analysis ? "✓" : "Analisar"}
                              </Button>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(file.id)}
                            className="flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-6 mt-8">
            {rankedProducts.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Trophy className="h-6 w-6 text-primary" />
                      <div>
                        <h2 className="text-xl font-semibold">Top 3 Produtos</h2>
                        <p className="text-sm text-muted-foreground">Ordenados por potencial de mercado</p>
                      </div>
                    </div>
                    
                    <div className="grid gap-4">
                      {rankedProducts.slice(0, 3).map((file, index) => {
                        const overallScore = ((file.analysis!.demand_projection + file.analysis!.alignment_score) / 2).toFixed(0);
                        return (
                          <motion.div
                            key={file.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`
                              relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all
                              ${index === 0 ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-border bg-card'}
                            `}
                          >
                            <div className="text-3xl font-bold text-muted-foreground/30">
                              #{index + 1}
                            </div>
                            
                            <img 
                              src={file.preview} 
                              alt={file.name} 
                              className="w-20 h-20 object-cover rounded-lg border-2 border-border"
                            />
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold">{file.sku || file.name}</h3>
                                  <p className="text-sm text-muted-foreground">{file.category}</p>
                                </div>
                                {getRankBadge(index + 1)}
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">Score</span>
                                    <span className="font-semibold">{overallScore}%</span>
                                  </div>
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                                      style={{ width: `${overallScore}%` }}
                                    />
                                  </div>
                                </div>
                                
                                <Badge className={getRiskColor(file.analysis!.risk_level)}>
                                  {getRiskIcon(file.analysis!.risk_level)}
                                  <span className="ml-1 capitalize text-xs">{file.analysis!.risk_level}</span>
                                </Badge>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {rankedProducts.length > 3 && (
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-4">Outros Produtos</h3>
                      <div className="grid gap-3">
                        {rankedProducts.slice(3).map((file, index) => {
                          const overallScore = ((file.analysis!.demand_projection + file.analysis!.alignment_score) / 2).toFixed(0);
                          return (
                            <div
                              key={file.id}
                              className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                            >
                              <span className="text-sm text-muted-foreground font-medium w-8">#{index + 4}</span>
                              <img src={file.preview} alt={file.name} className="w-12 h-12 object-cover rounded border border-border" />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{file.sku || file.name}</p>
                                <p className="text-xs text-muted-foreground">{file.category}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold">{overallScore}%</span>
                                <Badge variant="outline" className={getRiskColor(file.analysis!.risk_level)}>
                                  {getRiskIcon(file.analysis!.risk_level)}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum produto analisado ainda</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
