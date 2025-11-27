import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { AnalysisData } from "./NewAnalysisWizard";

interface ProductUploadStepProps {
  data: AnalysisData;
  onUpdate: (data: Partial<AnalysisData>) => void;
}

export function ProductUploadStep({ data, onUpdate }: ProductUploadStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    onUpdate({ products: [...data.products, ...newProducts] });
  };

  const removeProduct = (id: string) => {
    const updatedProducts = data.products.filter((p) => p.id !== id);
    onUpdate({ products: updatedProducts });
  };

  const updateProduct = (id: string, field: string, value: string) => {
    const updatedProducts = data.products.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    );
    onUpdate({ products: updatedProducts });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-medium mb-4">
          Upload de Produtos
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Faça upload das fotos dos produtos que deseja analisar.
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted hover:border-primary/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm font-medium mb-2">
          Arraste e solte suas imagens aqui
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          ou clique no botão abaixo
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          Selecionar Arquivos
        </Button>
      </div>

      {/* Uploaded Products */}
      {data.products.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Produtos ({data.products.length})</Label>
          </div>

          <div className="grid gap-4">
            {data.products.map((product) => (
              <div
                key={product.id}
                className="flex gap-4 p-4 border rounded-lg bg-card"
              >
                <div className="relative w-20 h-20 flex-shrink-0">
                  <img
                    src={product.preview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded"
                  />
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
                      onValueChange={(value) =>
                        updateProduct(product.id, "category", value)
                      }
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
                      onChange={(e) =>
                        updateProduct(product.id, "fabric", e.target.value)
                      }
                      className="h-9"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Cor</Label>
                    <Input
                      placeholder="Ex: Azul"
                      value={product.color}
                      onChange={(e) =>
                        updateProduct(product.id, "color", e.target.value)
                      }
                      className="h-9"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">SKU</Label>
                    <Input
                      placeholder="Ex: SKU-001"
                      value={product.sku}
                      onChange={(e) =>
                        updateProduct(product.id, "sku", e.target.value)
                      }
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.products.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Nenhum produto adicionado ainda
        </div>
      )}
    </div>
  );
}
