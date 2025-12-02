import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Plus, 
  Sparkles, 
  Package, 
  Filter,
  Grid3X3,
  List,
  Tag,
  Palette,
  Shirt
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock products data - simulando produtos cadastrados por uma empresa
const mockProducts = [
  {
    id: "1",
    name: "Vestido Midi Floral",
    sku: "VES-001",
    category: "Vestidos",
    color: "Rosa",
    fabric: "Viscose",
    size: "P, M, G",
    price: 189.90,
    cost: 65.00,
    stock: 45,
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=500&fit=crop",
    status: "active",
    createdAt: "2024-01-15"
  },
  {
    id: "2",
    name: "Blazer Oversized",
    sku: "BLZ-002",
    category: "Blazers",
    color: "Preto",
    fabric: "Linho",
    size: "M, G, GG",
    price: 299.90,
    cost: 95.00,
    stock: 28,
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=500&fit=crop",
    status: "active",
    createdAt: "2024-02-20"
  },
  {
    id: "3",
    name: "Calça Wide Leg",
    sku: "CAL-003",
    category: "Calças",
    color: "Bege",
    fabric: "Alfaiataria",
    size: "36, 38, 40, 42",
    price: 179.90,
    cost: 58.00,
    stock: 62,
    image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
    status: "active",
    createdAt: "2024-03-10"
  },
  {
    id: "4",
    name: "Blusa Cropped",
    sku: "BLU-004",
    category: "Blusas",
    color: "Branco",
    fabric: "Algodão",
    size: "PP, P, M",
    price: 89.90,
    cost: 28.00,
    stock: 120,
    image: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&h=500&fit=crop",
    status: "active",
    createdAt: "2024-03-25"
  },
  {
    id: "5",
    name: "Saia Midi Plissada",
    sku: "SAI-005",
    category: "Saias",
    color: "Verde Militar",
    fabric: "Poliéster",
    size: "P, M, G",
    price: 149.90,
    cost: 45.00,
    stock: 35,
    image: "https://images.unsplash.com/photo-1583496661160-fb5886a0uj93?w=400&h=500&fit=crop",
    status: "active",
    createdAt: "2024-04-05"
  },
  {
    id: "6",
    name: "Jaqueta Jeans",
    sku: "JAQ-006",
    category: "Jaquetas",
    color: "Azul Médio",
    fabric: "Jeans",
    size: "P, M, G, GG",
    price: 219.90,
    cost: 72.00,
    stock: 40,
    image: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=400&h=500&fit=crop",
    status: "active",
    createdAt: "2024-04-18"
  },
  {
    id: "7",
    name: "Cardigan Tricot",
    sku: "CAR-007",
    category: "Cardigans",
    color: "Caramelo",
    fabric: "Tricot",
    size: "Único",
    price: 169.90,
    cost: 55.00,
    stock: 25,
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop",
    status: "active",
    createdAt: "2024-05-01"
  },
  {
    id: "8",
    name: "Macacão Utilitário",
    sku: "MAC-008",
    category: "Macacões",
    color: "Cáqui",
    fabric: "Sarja",
    size: "P, M, G",
    price: 259.90,
    cost: 85.00,
    stock: 18,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop",
    status: "active",
    createdAt: "2024-05-15"
  },
  {
    id: "9",
    name: "Shorts Alfaiataria",
    sku: "SHO-009",
    category: "Shorts",
    color: "Marinho",
    fabric: "Alfaiataria",
    size: "36, 38, 40",
    price: 129.90,
    cost: 42.00,
    stock: 55,
    image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=500&fit=crop",
    status: "active",
    createdAt: "2024-06-02"
  },
  {
    id: "10",
    name: "Camisa Social",
    sku: "CAM-010",
    category: "Camisas",
    color: "Azul Claro",
    fabric: "Algodão",
    size: "1, 2, 3, 4",
    price: 159.90,
    cost: 48.00,
    stock: 70,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop",
    status: "active",
    createdAt: "2024-06-20"
  },
  {
    id: "11",
    name: "Top Cropped Renda",
    sku: "TOP-011",
    category: "Tops",
    color: "Preto",
    fabric: "Renda",
    size: "PP, P, M",
    price: 79.90,
    cost: 25.00,
    stock: 90,
    image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=500&fit=crop",
    status: "active",
    createdAt: "2024-07-10"
  },
  {
    id: "12",
    name: "Vestido Longo Estampado",
    sku: "VES-012",
    category: "Vestidos",
    color: "Multicolor",
    fabric: "Chiffon",
    size: "P, M, G",
    price: 229.90,
    cost: 78.00,
    stock: 22,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop",
    status: "active",
    createdAt: "2024-07-25"
  }
];

const categories = ["Todos", "Vestidos", "Blazers", "Calças", "Blusas", "Saias", "Jaquetas", "Cardigans", "Macacões", "Shorts", "Camisas", "Tops"];

export default function Library() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleAnalyzeSelected = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Selecione pelo menos um produto para analisar",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Iniciando análise",
      description: `${selectedProducts.length} produto(s) selecionado(s) para análise`
    });
    
    // Futuramente, navegar para a análise com os produtos selecionados
    navigate("/");
  };

  const totalValue = mockProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const totalStock = mockProducts.reduce((sum, p) => sum + p.stock, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-display font-semibold text-foreground">Biblioteca de Produtos</h1>
            <p className="text-muted-foreground mt-1">
              {mockProducts.length} produtos cadastrados
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedProducts.length > 0 && (
              <Button onClick={handleAnalyzeSelected} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Analisar {selectedProducts.length} produto(s)
              </Button>
            )}
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Produto
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Produtos</p>
                <p className="text-2xl font-bold">{mockProducts.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Tag className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categorias</p>
                <p className="text-2xl font-bold">{categories.length - 1}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Shirt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unidades em Estoque</p>
                <p className="text-2xl font-bold">{totalStock.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Palette className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor em Estoque</p>
                <p className="text-2xl font-bold">R$ {(totalValue / 1000).toFixed(0)}k</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-3 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAll}
                className="text-sm"
              >
                {selectedProducts.length === filteredProducts.length ? "Desmarcar todos" : "Selecionar todos"}
              </Button>
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Products Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card 
                  className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                    selectedProducts.includes(product.id) ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => toggleProductSelection(product.id)}
                >
                  <div className="relative aspect-[3/4] bg-muted">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=500&fit=crop';
                      }}
                    />
                    <div className="absolute top-2 left-2">
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        className="bg-white/90 border-white"
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                      />
                    </div>
                    <Badge className="absolute top-2 right-2 text-xs">
                      {product.category}
                    </Badge>
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <div>
                      <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <div 
                            className="w-3 h-3 rounded-full border" 
                            style={{ backgroundColor: product.color === 'Multicolor' ? 'linear-gradient(45deg, red, blue)' : undefined }}
                          />
                          {product.color}
                        </span>
                      </div>
                      <span className="font-semibold">R$ {product.price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{product.fabric}</span>
                      <span>{product.stock} un.</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <div className="divide-y">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedProducts.includes(product.id) ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => toggleProductSelection(product.id)}
                >
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onClick={(e) => e.stopPropagation()}
                    onCheckedChange={() => toggleProductSelection(product.id)}
                  />
                  <div className="w-16 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=500&fit=crop';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{product.name}</h3>
                      <Badge variant="outline" className="text-xs">{product.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{product.sku}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{product.color}</span>
                      <span>{product.fabric}</span>
                      <span>Tamanhos: {product.size}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold">R$ {product.price.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">{product.stock} unidades</p>
                    <p className="text-xs text-muted-foreground">Custo: R$ {product.cost.toFixed(2)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        )}

        {filteredProducts.length === 0 && (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground">Tente ajustar os filtros de busca</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
