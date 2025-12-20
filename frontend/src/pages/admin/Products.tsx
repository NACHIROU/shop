import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { formatCurrency } from '@/services/api';
import type { Product, Supplier } from '@/types';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/loader';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Search, Edit2, Trash2, TrendingUp, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { productsApi, suppliersApi } from '@/services/api';

export default function Products() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [productList, setProductList] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ totalValue: 0, totalProfit: 0 });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [productsData, suppliersData] = await Promise.all([
        productsApi.getAll(currentPage),
        suppliersApi.getAll(),
      ]);

      // Map snake_case from backend to camelCase for frontend
      const mappedProducts = productsData.items.map((p: any) => ({
        id: p.id,
        name: p.name,
        purchasePrice: p.purchase_price, // Mapping here
        sellingPrice: p.selling_price,   // Mapping here
        stock: p.stock,
        category: p.category,
        supplierId: p.supplier_id,       // Mapping here
        supplierName: p.supplier_name,   // Mapping here
        createdAt: p.created_at
      }));

      setProductList(mappedProducts);
      setTotalPages(productsData.pages);
      setStats({
        totalValue: productsData.total_value,
        totalProfit: productsData.total_profit
      });
      setSuppliers(suppliersData);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const filteredProducts = productList.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Prepare payload in snake_case for backend
    const payload = {
      name: formData.get('name') as string,
      purchase_price: Number(formData.get('purchasePrice')),
      selling_price: Number(formData.get('sellingPrice')),
      category: formData.get('category') as string,
      stock: Number(formData.get('stock')),
      supplier_id: (formData.get('supplier') as string) || undefined,
    };

    try {
      // @ts-ignore
      await productsApi.create(payload as any);

      toast.success('Produit ajouté avec succès');
      setIsAddDialogOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du produit');
      console.error(error);
    }
  };

  const handleEditProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;

    const formData = new FormData(e.currentTarget);

    const payload = {
      name: formData.get('name') as string,
      purchase_price: Number(formData.get('purchasePrice')),
      selling_price: Number(formData.get('sellingPrice')),
      category: formData.get('category') as string,
      stock: Number(formData.get('stock')),
      supplier_id: (formData.get('supplier') as string) || undefined,
    };

    try {
      await productsApi.update(editingProduct.id, payload as any);
      toast.success('Produit modifié avec succès');
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error('Erreur lors de la modification du produit');
      console.error(error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    try {
      await productsApi.delete(id);
      toast.success('Produit supprimé');
      fetchProducts();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    }
  };



  const ProductForm = ({ product, onSubmit }: { product?: Product; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void }) => (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nom du produit</Label>
          <Input id="name" name="name" defaultValue={product?.name} placeholder="iPhone 15 Pro 256GB" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="category">Catégorie</Label>
            <Input id="category" name="category" defaultValue={product?.category} placeholder="iPhone 15" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="stock">Stock initial</Label>
            <Input id="stock" name="stock" type="number" defaultValue={product?.stock || 0} required />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="supplier">Fournisseur (optionnel)</Label>
          <Select name="supplier" defaultValue={product?.supplierId || "none"}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un fournisseur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun</SelectItem>
              {suppliers.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="purchasePrice">Prix d'achat (FCFA)</Label>
            <Input id="purchasePrice" name="purchasePrice" type="number" defaultValue={product?.purchasePrice} placeholder="650000" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sellingPrice">Prix de vente (FCFA)</Label>
            <Input id="sellingPrice" name="sellingPrice" type="number" defaultValue={product?.sellingPrice} placeholder="820000" required />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => product ? setEditingProduct(null) : setIsAddDialogOpen(false)}>
          Annuler
        </Button>
        <Button type="submit">{product ? 'Modifier' : 'Ajouter'}</Button>
      </DialogFooter>
    </form>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="text-2xl font-bold">Gestion des produits</h1>
            <p className="text-muted-foreground">Gérez votre inventaire d'articles</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 gradient-primary">
                <Plus className="w-4 h-4" />
                Ajouter un produit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Nouveau produit</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouveau produit à votre inventaire.
                </DialogDescription>
              </DialogHeader>
              <ProductForm onSubmit={handleAddProduct} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">Total articles</p>
            <p className="text-2xl font-bold">{productList.length}</p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">Valeur du stock</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalValue)}</p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">Profit potentiel</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(stats.totalProfit)}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Products Table */}
        {loading ? (
          <PageLoader />
        ) : productList.length === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Aucun produit</h3>
            <p className="text-muted-foreground mb-4">Commencez par ajouter votre premier produit.</p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Ajouter un produit
            </Button>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-fade-in">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead className="text-right">Prix d'achat</TableHead>
                  <TableHead className="text-right">Prix de vente</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const profit = product.sellingPrice - product.purchasePrice;
                  const margin = product.purchasePrice > 0
                    ? ((profit / product.purchasePrice) * 100).toFixed(0)
                    : '100';
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {product.supplierName ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Truck className="w-3 h-3 text-muted-foreground" />
                            {product.supplierName}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(product.purchasePrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.sellingPrice)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 text-success">
                          <TrendingUp className="w-3 h-3" />
                          <span>{formatCurrency(profit)}</span>
                          <span className="text-xs text-muted-foreground">({margin}%)</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={product.stock <= 5 ? 'destructive' : 'default'}>
                          {product.stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingProduct(product)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Modifier le produit</DialogTitle>
              <DialogDescription>
                Modifiez les informations du produit.
              </DialogDescription>
            </DialogHeader>
            {editingProduct && <ProductForm product={editingProduct} onSubmit={handleEditProduct} />}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
