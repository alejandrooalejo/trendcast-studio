import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload as UploadIcon, X, Sparkles, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

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
      case 'medium': return <TrendingUp className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-semibold text-foreground">Upload de Produtos</h1>
          <p className="text-muted-foreground mt-1">Envie fotos dos produtos para comparar com tendências</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Selecionar Análise de Tendências</CardTitle>
              <CardDescription>Escolha uma análise para comparar com seus produtos</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={analysisId} onValueChange={setAnalysisId}>
                <SelectTrigger>
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
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Adicionar Produtos</CardTitle>
              <CardDescription>Arraste e solte as fotos ou clique para selecionar</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-lg p-12 text-center transition-colors
                  ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                `}
              >
                <UploadIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Arraste suas imagens aqui</h3>
                <p className="text-sm text-muted-foreground mb-4">ou</p>
                <label htmlFor="file-input">
                  <Button variant="outline" asChild>
                    <span>Selecionar Arquivos</span>
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
                <p className="text-xs text-muted-foreground mt-4">PNG, JPG até 10MB</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-display">Produtos Adicionados ({files.length})</CardTitle>
                      <CardDescription>Preencha os detalhes e analise cada produto</CardDescription>
                    </div>
                    <Button onClick={handleAnalyzeAll} disabled={!analysisId}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analisar Todos
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    {files.map((file, index) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="border border-border rounded-lg overflow-hidden"
                      >
                        <div className="flex gap-6 p-4">
                          <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                          </div>
                          
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor={`category-${file.id}`}>Categoria</Label>
                              <Select value={file.category} onValueChange={(val) => updateFile(file.id, { category: val })}>
                                <SelectTrigger id={`category-${file.id}`}>
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
                              <Label htmlFor={`sku-${file.id}`}>SKU</Label>
                              <Input 
                                id={`sku-${file.id}`} 
                                placeholder="Ex: VER-001" 
                                value={file.sku}
                                onChange={(e) => updateFile(file.id, { sku: e.target.value })}
                              />
                            </div>

                            <div className="flex items-end">
                              <Button
                                onClick={() => analyzeProduct(file.id)}
                                disabled={file.analyzing || !analysisId}
                                className="w-full"
                                variant={file.analysis ? "secondary" : "default"}
                              >
                                {file.analyzing ? "Analisando..." : file.analysis ? "Re-analisar" : "Analisar"}
                              </Button>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(file.id)}
                            className="self-start"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {file.analysis && (
                          <div className="border-t border-border bg-muted/30 p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Alinhamento com Tendências</p>
                                <div className="flex items-center gap-2">
                                  <Progress value={file.analysis.alignment_score} className="flex-1" />
                                  <span className="text-sm font-semibold">{file.analysis.alignment_score}%</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Projeção de Demanda</p>
                                <div className="flex items-center gap-2">
                                  <Progress value={file.analysis.demand_projection} className="flex-1" />
                                  <span className="text-sm font-semibold">{file.analysis.demand_projection}%</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Nível de Risco</p>
                                <Badge className={getRiskColor(file.analysis.risk_level)}>
                                  {getRiskIcon(file.analysis.risk_level)}
                                  <span className="ml-1 capitalize">{file.analysis.risk_level}</span>
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Detecções</p>
                                <p className="text-sm">{file.analysis.detected_color}</p>
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <h4 className="font-semibold mb-3">Comparação com Tendências</h4>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Cor</p>
                                  <Progress value={file.analysis.comparison.color_match} className="mt-1" />
                                  <p className="text-xs mt-1">{file.analysis.comparison.color_match}%</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Tecido</p>
                                  <Progress value={file.analysis.comparison.fabric_match} className="mt-1" />
                                  <p className="text-xs mt-1">{file.analysis.comparison.fabric_match}%</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Estilo</p>
                                  <Progress value={file.analysis.comparison.style_match} className="mt-1" />
                                  <p className="text-xs mt-1">{file.analysis.comparison.style_match}%</p>
                                </div>
                              </div>
                            </div>

                            {file.analysis.insights.length > 0 && (
                              <>
                                <Separator />
                                <div>
                                  <h4 className="font-semibold mb-3">Insights</h4>
                                  <div className="space-y-2">
                                    {file.analysis.insights.map((insight, idx) => (
                                      <div key={idx} className="flex gap-2 text-sm">
                                        <Badge variant="outline" className="capitalize">{insight.type}</Badge>
                                        <div>
                                          <p className="font-medium">{insight.title}</p>
                                          <p className="text-muted-foreground text-xs">{insight.description}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}

                            {file.analysis.improvements.length > 0 && (
                              <>
                                <Separator />
                                <div>
                                  <h4 className="font-semibold mb-3">Sugestões de Melhoria</h4>
                                  <div className="space-y-3">
                                    {file.analysis.improvements.map((improvement, idx) => (
                                      <div key={idx} className="border border-border rounded-lg p-3">
                                        <div className="flex items-start justify-between mb-2">
                                          <Badge variant="secondary" className="capitalize">{improvement.aspect}</Badge>
                                          <span className="text-xs text-muted-foreground">Alinhamento: {improvement.trend_alignment}%</span>
                                        </div>
                                        <p className="text-sm mb-1">
                                          <span className="text-muted-foreground">Atual:</span> {improvement.current}
                                        </p>
                                        <p className="text-sm mb-1">
                                          <span className="text-muted-foreground">Sugerido:</span> {improvement.suggested}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{improvement.reason}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
