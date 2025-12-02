import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  Plus, 
  Trash2, 
  Image as ImageIcon,
  Tag,
  Palette,
  Shirt,
  MoreVertical,
  Filter
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  color: string;
  fabric: string;
  imageUrl: string;
  createdAt: string;
  status: "pending" | "analyzed";
}

const mockProducts: Product[] = [
  {
    id: "1",
    sku: "CAM-001",
    name: "Camisa Social Slim",
    category: "Camisas",
    color: "Branco",
    fabric: "Algodão",
    imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=100&h=100&fit=crop",
    createdAt: "2024-11-28",
    status: "analyzed"
  },
  {
    id: "2",
    sku: "VES-002",
    name: "Vestido Midi Floral",
    category: "Vestidos",
    color: "Estampado",
    fabric: "Viscose",
    imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=100&h=100&fit=crop",
    createdAt: "2024-11-27",
    status: "pending"
  },
  {
    id: "3",
    sku: "CAL-003",
    name: "Calça Jeans Skinny",
    category: "Calças",
    color: "Azul",
    fabric: "Jeans",
    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=100&h=100&fit=crop",
    createdAt: "2024-11-26",
    status: "analyzed"
  },
  {
    id: "4",
    sku: "BLU-004",
    name: "Blusa Cropped",
    category: "Blusas",
    color: "Rosa",
    fabric: "Malha",
    imageUrl: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=100&h=100&fit=crop",
    createdAt: "2024-11-25",
    status: "pending"
  },
  {
    id: "5",
    sku: "JAQ-005",
    name: "Jaqueta Couro Eco",
    category: "Jaquetas",
    color: "Preto",
    fabric: "Couro Sintético",
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=100&h=100&fit=crop",
    createdAt: "2024-11-24",
    status: "analyzed"
  },
  {
    id: "6",
    sku: "SAI-006",
    name: "Saia Plissada",
    category: "Saias",
    color: "Bege",
    fabric: "Poliéster",
    imageUrl: "https://images.unsplash.com/photo-1583496661160-fb5886a0uj9a?w=100&h=100&fit=crop",
    createdAt: "2024-11-23",
    status: "pending"
  },
  {
    id: "7",
    sku: "MOL-007",
    name: "Moletom Oversized",
    category: "Moletons",
    color: "Cinza",
    fabric: "Moletom",
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=100&h=100&fit=crop",
    createdAt: "2024-11-22",
    status: "analyzed"
  },
  {
    id: "8",
    sku: "SHO-008",
    name: "Short Alfaiataria",
    category: "Shorts",
    color: "Marinho",
    fabric: "Oxford",
    imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=100&h=100&fit=crop",
    createdAt: "2024-11-21",
    status: "pending"
  }
];

export default function Library() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      setProducts(products.filter(p => p.id !== productToDelete));
      toast.success("Produto removido da biblioteca");
    }
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const pendingCount = products.filter(p => p.status === "pending").length;
  const analyzedCount = products.filter(p => p.status === "analyzed").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-semibold text-foreground">Biblioteca de Produtos</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerencie seus produtos para análise</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Produto
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shirt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{products.length}</p>
                <p className="text-xs text-muted-foreground">Total de Produtos</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Tag className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Aguardando Análise</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Palette className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{analyzedCount}</p>
                <p className="text-xs text-muted-foreground">Analisados</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, SKU ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </Card>

        {/* Products Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Imagem</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead className="hidden lg:table-cell">Cor</TableHead>
                <TableHead className="hidden lg:table-cell">Tecido</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                      <p>Nenhum produto encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {product.category}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {product.color}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {product.fabric}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={product.status === "analyzed" ? "default" : "secondary"}
                        className={product.status === "analyzed" 
                          ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                        }
                      >
                        {product.status === "analyzed" ? "Analisado" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                          <DropdownMenuItem>Analisar</DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteClick(product.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este produto da biblioteca? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
