import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload as UploadIcon, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface UploadedFile {
  id: string;
  name: string;
  preview: string;
  category: string;
  fabric: string;
  color: string;
  sku: string;
}

export default function Upload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Simulate file upload
    const newFile: UploadedFile = {
      id: Math.random().toString(),
      name: "produto-" + (files.length + 1) + ".jpg",
      preview: "/placeholder.svg",
      category: "",
      fabric: "",
      color: "",
      sku: "",
    };
    setFiles([...files, newFile]);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleAnalyze = () => {
    if (files.length === 0) {
      toast.error("Adicione pelo menos um produto para análise");
      return;
    }
    toast.success("Análise iniciada! Você será notificado quando estiver pronta.");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-semibold text-foreground">Upload de Coleção</h1>
          <p className="text-muted-foreground mt-1">Envie fotos dos produtos para análise da IA</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
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
                <Button variant="outline">Selecionar Arquivos</Button>
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
                  <CardTitle className="font-display">Produtos Adicionados ({files.length})</CardTitle>
                  <CardDescription>Preencha os detalhes de cada produto</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    {files.map((file, index) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex gap-6 p-4 border border-border rounded-lg"
                      >
                        <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                          <UploadIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                        
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor={`category-${file.id}`}>Categoria</Label>
                            <Select>
                              <SelectTrigger id={`category-${file.id}`}>
                                <SelectValue placeholder="Selecionar" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="vestido">Vestido</SelectItem>
                                <SelectItem value="calca">Calça</SelectItem>
                                <SelectItem value="blusa">Blusa</SelectItem>
                                <SelectItem value="jaqueta">Jaqueta</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor={`fabric-${file.id}`}>Tecido</Label>
                            <Select>
                              <SelectTrigger id={`fabric-${file.id}`}>
                                <SelectValue placeholder="Selecionar" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="algodao">Algodão</SelectItem>
                                <SelectItem value="linho">Linho</SelectItem>
                                <SelectItem value="poliester">Poliéster</SelectItem>
                                <SelectItem value="viscose">Viscose</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor={`color-${file.id}`}>Cor</Label>
                            <Input id={`color-${file.id}`} placeholder="Ex: Azul" />
                          </div>

                          <div>
                            <Label htmlFor={`sku-${file.id}`}>SKU</Label>
                            <Input id={`sku-${file.id}`} placeholder="Ex: VER-001" />
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
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button onClick={handleAnalyze} className="bg-primary hover:bg-primary/90">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analisar Coleção
                    </Button>
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
