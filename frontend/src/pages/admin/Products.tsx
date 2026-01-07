import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { formatCurrency } from '@/services/api';
import type { Product, Supplier } from '@/types';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/loader';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarcodeScanner } from '@/components/common/BarcodeScanner';
import {
  Plus,
  Search,
  Filter,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Edit2,
  Truck,
  TrendingUp,
  ShoppingBag,
  FileText,
  Calendar as CalendarIcon,
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  X,
  History,
  Tag,
  Loader2,
  Trash,
  Archive,
  Eye,
  Settings,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { productsApi, suppliersApi, collaboratorsApi, categoriesApi, statsApi } from '@/services/api';

import { usePrivacy } from '@/contexts/PrivacyContext';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { useConfirmation } from '@/hooks/useConfirmation';

export default function Products() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'detailed' | 'grouped' | 'smart'>('detailed');
  const [isVendus, setIsVendus] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [soldByFilter, setSoldByFilter] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const { isPrivate } = usePrivacy();
  const { confirm, isOpen: isConfirmOpen, options: confirmOptions, close: closeConfirm, handleConfirm } = useConfirmation();

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  // Fetch products with Infinite Query
  const {
    data: productsInfiniteData,
    isLoading: productsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['products', searchQuery, categoryFilter, isVendus, dateRange, soldByFilter],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await productsApi.getAll(
        pageParam,
        20,
        searchQuery,
        categoryFilter,
        isVendus,
        dateRange?.from?.toISOString(),
        dateRange?.to?.toISOString(),
        soldByFilter
      );
      return {
        ...response,
        items: response.items.map((p: any) => ({
          ...p,
          id: p.id,
          name: p.name,
          imei: p.imei,
          purchasePrice: p.purchase_price,
          stock: p.stock,
          category: p.category,
          supplierId: p.supplier_id,
          supplierName: p.supplier_name,
          description: p.description,
          isArchived: p.is_archived,
          sellingPrice: p.selling_price,
          clientName: p.client_name,
          soldBy: p.sold_by,
          soldAt: p.sold_at,
          createdAt: p.created_at
        }))
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined),
  });

  // Flattened products list
  const productList = useMemo(() => {
    return productsInfiniteData?.pages.flatMap(page => page.items) || [];
  }, [productsInfiniteData]);

  // Total value remains from the first page or we can sum it up if needed
  // However, the API returns total_value for the whole query in each page
  const stats = { totalValue: productsInfiniteData?.pages[0]?.total_value || 0 };

  // Fetch suppliers
  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getAll(),
  });

  // Fetch collaborators
  const { data: collaborators = [] } = useQuery({
    queryKey: ['collaborators'],
    queryFn: () => collaboratorsApi.getAll(),
  });

  // Fetch category stats when viewing sold products
  const { data: categoryStats } = useQuery({
    queryKey: ['categoryStats', dateRange],
    queryFn: () => statsApi.getCategoryStats(
      dateRange?.from?.toISOString(),
      dateRange?.to?.toISOString()
    ),
    enabled: isVendus,
  });

  // displayProducts with grouping logic
  const displayProducts = useMemo(() => {
    let items = productList;

    if (viewMode === 'grouped') {
      const groups = productList.reduce((acc: any, p) => {
        const key = `${p.name}-${p.category}`;
        if (!acc[key]) {
          acc[key] = { ...p, stock: 0, count: 0 };
        }
        acc[key].stock += p.stock;
        acc[key].count += 1;
        return acc;
      }, {});
      items = Object.values(groups);
    } else if (viewMode === 'smart') {
      const smartGroups = productList.reduce((acc: any, p) => {
        const storageMatch = p.name.match(/(\d+)\s*(GB|TB)/i) || (p.description || '').match(/(\d+)\s*(GB|TB)/i);
        const storage = storageMatch ? storageMatch[0].toUpperCase().replace(' ', '') : 'Standard';

        let model = p.name;
        const modelMatch = p.name.match(/(iPhone\s*\d+\s*(Pro\s*Max|Pro|Plus|Mini|SE)?)|(Samsung\s*[S|A|Z]\d+\s*[+]?)/i);
        if (modelMatch) {
          model = modelMatch[0].trim();
        } else {
          model = p.name.replace(/(\d+)\s*(GB|TB)/i, '').trim();
        }

        const key = `${model}-${storage}`;
        if (!acc[key]) {
          acc[key] = {
            id: key,
            name: `${model} ${storage !== 'Standard' ? storage : ''}`,
            category: p.category,
            stock: 0,
            count: 0,
            purchasePrice: p.purchasePrice,
          };
        }
        acc[key].stock += p.stock;
        acc[key].count += 1;
        return acc;
      }, {});
      items = Object.values(smartGroups);
    }
    return items;
  }, [productList, viewMode]);

  const loading = productsLoading || suppliersLoading;

  const addProductMutation = useMutation({
    mutationFn: (payload: any) => productsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categoryStats'] });
      toast.success('Produit ajouté avec succès');
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      const message = error.message || "";
      if (message.includes("IMEI") && message.includes("existe déjà")) {
        toast.error("Un produit avec cet IMEI existe déjà dans le système.");
      } else {
        toast.error('Erreur lors de l\'ajout du produit');
      }
      console.error(error);
    }
  });

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload = {
      name: formData.get('name') as string,
      imei: formData.get('imei') as string,
      purchase_price: Number(formData.get('purchasePrice')),
      category: formData.get('category') as string,
      stock: Number(formData.get('stock')),
      supplier_id: (formData.get('supplier') as string) || undefined,
      description: formData.get('description') as string,
    };

    addProductMutation.mutate(payload);
  };

  const updateProductMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => productsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categoryStats'] });
      toast.success('Produit modifié avec succès');
      setEditingProduct(null);
    },
    onError: (error) => {
      toast.error('Erreur lors de la modification du produit');
      console.error(error);
    }
  });

  const handleEditProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;

    const formData = new FormData(e.currentTarget);

    const payload = {
      name: formData.get('name') as string,
      imei: formData.get('imei') as string,
      purchase_price: Number(formData.get('purchasePrice')),
      category: formData.get('category') as string,
      stock: Number(formData.get('stock')),
      supplier_id: (formData.get('supplier') as string) || undefined,
      description: formData.get('description') as string,
    };

    updateProductMutation.mutate({ id: editingProduct.id, payload });
  };

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categoryStats'] });
      toast.success('Produit supprimé');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    }
  });

  const bulkActionMutation = useMutation({
    mutationFn: ({ action, ids }: { action: 'archive' | 'delete', ids: string[] }) =>
      productsApi.bulkAction(action, ids),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categoryStats'] });
      toast.success(`Action groupée (${variables.action}) effectuée`);
      setSelectedProducts([]);
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'action groupée');
      console.error(error);
    }
  });

  const handleDeleteProduct = async (id: string) => {
    confirm({
      title: 'Supprimer le produit',
      message: 'Voulez-vous vraiment supprimer ce produit ? Cette action est irréversible.',
      variant: 'danger',
      confirmText: 'Supprimer',
      onConfirm: () => deleteProductMutation.mutate(id)
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(productList.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleBulkAction = (action: 'archive' | 'delete') => {
    if (selectedProducts.length === 0) return;

    confirm({
      title: action === 'delete' ? 'Suppression groupée' : 'Archivage groupé',
      message: `Voulez-vous vraiment ${action === 'delete' ? 'supprimer' : 'archiver'} ${selectedProducts.length} produits ?`,
      variant: action === 'delete' ? 'danger' : 'default',
      confirmText: action === 'delete' ? 'Supprimer' : 'Archiver',
      onConfirm: () => bulkActionMutation.mutate({ action, ids: selectedProducts })
    });
  };

  const handleExport = async () => {
    try {
      const blob = await productsApi.export(
        searchQuery,
        categoryFilter,
        isVendus,
        dateRange?.from?.toISOString(),
        dateRange?.to?.toISOString(),
        soldByFilter
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Export réussi");
    } catch (e) {
      toast.error("Erreur lors de l'export");
      console.error(e);
    }
  };

  const ProductForm = ({ product, onSubmit, isSubmitting }: { product?: Product; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void, isSubmitting: boolean }) => {
    const [formName, setFormName] = useState(product?.name || '');
    const [formCategory, setFormCategory] = useState(product?.category || (categories[0]?.name || "Autres"));
    const [formImei, setFormImei] = useState(product?.imei || '');

    // Smarter auto-category selection
    const handleNameChange = (value: string) => {
      setFormName(value);

      if (!product && value.length >= 2) {
        const lowerValue = value.toLowerCase();

        // 1. Try to match against category names directly
        const matchedCategory = categories.find(c =>
          lowerValue.includes(c.name.toLowerCase()) ||
          c.name.toLowerCase().includes(lowerValue)
        );

        if (matchedCategory) {
          setFormCategory(matchedCategory.name);
          return;
        }

        // 2. Try to match against existing product names
        if (value.length > 3) {
          const matchingProduct = productList.find(p =>
            p.name.toLowerCase().includes(lowerValue)
          );

          if (matchingProduct && matchingProduct.category) {
            setFormCategory(matchingProduct.category);
          }
        }
      }
    };

    return (
      <form onSubmit={onSubmit}>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom du produit</Label>
            <Input
              id="name"
              name="name"
              value={formName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="iPhone 15 Pro 256GB"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description / Caractéristiques (optionnel)</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={product?.description}
              placeholder="256GB, Bleu Titane, Excellent état..."
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="imei">IMEI</Label>
            <div className="flex gap-2">
              <Input
                id="imei"
                name="imei"
                value={formImei}
                onChange={(e) => setFormImei(e.target.value)}
                placeholder="123456789012345"
                required
              />
              <BarcodeScanner onScan={(val) => setFormImei(val)} label="Scanner l'IMEI" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select name="category" value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length > 0 ? (
                    categories.map(c => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="Autres">Autres</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock">Stock initial</Label>
              <Input id="stock" name="stock" type="number" defaultValue={product?.stock !== undefined ? product.stock : 1} required />
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
          <div className="grid gap-2">
            <Label htmlFor="purchasePrice">Prix d'achat (FCFA)</Label>
            <Input
              id="purchasePrice"
              name="purchasePrice"
              type={isPrivate ? "password" : "number"}
              defaultValue={product?.purchasePrice}
              placeholder="650000"
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => product ? setEditingProduct(null) : setIsAddDialogOpen(false)}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {product ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="text-2xl font-bold">Gestion des produits</h1>
            <p className="text-muted-foreground">Gérez votre inventaire d'articles</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              variant={isVendus ? "secondary" : "outline"}
              onClick={() => setIsVendus(!isVendus)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              {isVendus ? "Articles en stock" : "Vendus"}
            </Button>
            {!isVendus && (
              <>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate('/categories')}
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Catégories</span>
                </Button>
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
                    <ProductForm onSubmit={handleAddProduct} isSubmitting={addProductMutation.isPending} />
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
            <p className="text-xs text-muted-foreground mb-1 font-medium">{isVendus ? "Articles Vendus" : "Total Stock"}</p>
            <p className="text-2xl font-bold">{productsInfiniteData?.pages[0]?.total || 0}</p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
            <p className="text-xs text-muted-foreground mb-1 font-medium">{isVendus ? "Chiffre d'Affaires" : "Valeur Stock"}</p>
            <p className="text-2xl font-bold text-primary">
              {isVendus
                ? formatCurrency(productsInfiniteData?.pages[0]?.total_sales || 0)
                : (isPrivate ? "••••••" : formatCurrency(stats.totalValue))
              }
            </p>
          </div>

          {/* Top 2 Categories or Placeholder */}
          {(() => {
            const topCategories = isVendus
              ? (categoryStats?.categories?.slice(0, 2) || [])
              : categories.slice(0, 2).map(c => ({
                category: c.name,
                stock: productList.filter(p => !p.isArchived && p.category === c.name).reduce((acc, p) => acc + p.stock, 0)
              }));

            return (
              <>
                {topCategories.map((cat, idx) => (
                  <div key={idx} className="bg-card p-4 rounded-xl border border-border shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                      <p className="text-xs text-muted-foreground font-medium truncate">{cat.category}</p>
                    </div>
                    <p className="text-2xl font-bold">
                      {isVendus ? (isPrivate ? "•••" : formatCurrency((cat as any).sales)) : (cat as any).stock}
                      {isVendus && <span className="text-xs font-normal text-muted-foreground ml-1">FCFA</span>}
                    </p>
                  </div>
                ))}
                {/* Pad with placeholders if less than 2 categories */}
                {Array.from({ length: Math.max(0, 2 - topCategories.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-card p-4 rounded-xl border border-border shadow-sm opacity-50">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">N/A</p>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                ))}
              </>
            );
          })()}
        </div>

        {/* Category Analytics & Chart - Only show when viewing sold products */}
        {isVendus && categoryStats && categoryStats.categories && categoryStats.categories.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm p-4 md:p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Performance par Catégorie
                </h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryStats.categories}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                      dataKey="category"
                      axisLine={false}
                      tickLine={false}
                      fontSize={12}
                      tick={{ fill: '#6B7280' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      fontSize={12}
                      tick={{ fill: '#6B7280' }}
                      tickFormatter={(value) => `${value / 1000}k`}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any) => [formatCurrency(value), 'Ventes']}
                    />
                    <Bar
                      dataKey="sales"
                      radius={[4, 4, 0, 0]}
                      barSize={40}
                    >
                      {categoryStats.categories.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3B82F6' : '#60A5FA'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-6 animate-fade-in">
              <h3 className="text-lg font-semibold mb-4">Détails des Ventes</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {categoryStats.categories.map((cat: any) => (
                  <div key={cat.category} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold">{cat.category}</p>
                      <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                        {cat.count} articles
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Ventes:</span>
                      <span className="font-medium text-primary">{isPrivate ? "••••••" : formatCurrency(cat.sales)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Profit:</span>
                      <span className="font-medium text-success">{isPrivate ? "••••••" : formatCurrency(cat.profit)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-muted-foreground">Profit Total</p>
                  <p className="text-sm font-bold text-success">{isPrivate ? "••••••" : formatCurrency(categoryStats.total_profit)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher par nom ou IMEI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {selectedProducts.length > 0 && (
            <div className="flex items-center gap-2 bg-primary/10 p-1 rounded-md px-3 animate-in fade-in zoom-in-95">
              <span className="text-sm font-medium text-primary mr-2">{selectedProducts.length} sélectionné(s)</span>
              <Button size="sm" variant="outline" className="h-8 gap-1 border-destructive/20 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleBulkAction('delete')}>
                <Trash2 className="w-3 h-3" />
                Supprimer
              </Button>
              <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => handleBulkAction('archive')}>
                <Archive className="w-3 h-3" />
                Archiver
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={soldByFilter} onValueChange={setSoldByFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Vendeur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous vendeurs</SelectItem>
                {collaborators.map(c => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === 'detailed' ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode('detailed')}
                className="text-xs h-8"
              >
                Détaillée
              </Button>
              <Button
                variant={viewMode === 'grouped' ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode('grouped')}
                className="text-xs h-8"
              >
                Groupée
              </Button>
              <Button
                variant={viewMode === 'smart' ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode('smart')}
                className="text-xs h-8 gap-1"
              >
                <TrendingUp className="w-3 h-3 text-blue-500" />
                Smart
              </Button>
            </div>
          </div>
          <DateRangePicker
            date={dateRange}
            setDate={setDateRange}
            placeholder={isVendus ? "Date de vente" : "Date de création"}
          />
        </div>

        {/* Products Table */}
        {
          loading ? (
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
            <div className="space-y-4">
              <div className="space-y-4 pb-20 md:pb-0">
                {/* Desktop Table View */}
                <div className="hidden md:block bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-fade-in">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={productList.length > 0 && selectedProducts.length === productList.length}
                            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                          />
                        </TableHead>
                        <TableHead className="font-bold">Produit</TableHead>
                        {(viewMode === 'detailed') && <TableHead className="font-bold">IMEI</TableHead>}
                        <TableHead className="font-bold">Catégorie</TableHead>
                        {isVendus ? (
                          <>
                            <TableHead className="font-bold">Client</TableHead>
                            <TableHead className="font-bold">Vendu par</TableHead>
                            <TableHead className="text-right font-bold">Prix de vente</TableHead>
                            <TableHead className="text-right font-bold">Date</TableHead>
                          </>
                        ) : (
                          <>
                            {(viewMode === 'detailed') && <TableHead className="font-bold">Fournisseur</TableHead>}
                            <TableHead className="text-right font-bold">Prix d'achat</TableHead>
                            <TableHead className="text-center font-bold">Stock</TableHead>
                          </>
                        )}
                        <TableHead className="text-right font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayProducts.map((product: any) => (
                        <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{product.name}</span>
                              {viewMode !== 'detailed' && product.count > 1 && (
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                  {product.count} variations
                                </span>
                              )}
                            </div>
                          </TableCell>
                          {viewMode === 'detailed' && <TableCell className="font-mono text-xs text-muted-foreground">{product.imei}</TableCell>}
                          <TableCell>
                            <Badge variant="outline" className="font-normal">{product.category}</Badge>
                          </TableCell>
                          {isVendus ? (
                            <>
                              <TableCell className="text-xs">{product.clientName || '-'}</TableCell>
                              <TableCell className="text-xs">{product.soldBy || '-'}</TableCell>
                              <TableCell className="text-right font-bold text-success">{formatCurrency(product.sellingPrice || 0)}</TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">
                                {product.soldAt ? new Date(product.soldAt).toLocaleDateString('fr-BJ') : '-'}
                              </TableCell>
                            </>
                          ) : (
                            <>
                              {(viewMode === 'detailed') && (
                                <TableCell>
                                  {product.supplierName ? (
                                    <div className="flex items-center gap-1 text-xs">
                                      <Truck className="w-3 h-3 text-muted-foreground" />
                                      {product.supplierName}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                              )}
                              <TableCell className="text-right font-medium">
                                {isPrivate ? "••••••" : formatCurrency(product.purchasePrice)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={product.stock <= 5 ? 'destructive' : 'default'}
                                  className={cn(
                                    "min-w-[2rem] justify-center",
                                    product.stock > 0 && product.stock <= 5 && "bg-orange-500 hover:bg-orange-600"
                                  )}
                                >
                                  {product.stock}
                                </Badge>
                              </TableCell>
                            </>
                          )}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {product.description && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <Eye className="w-4 h-4 text-primary" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80">
                                    <div className="space-y-2">
                                      <h4 className="font-bold text-sm flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Description
                                      </h4>
                                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                        {product.description}
                                      </p>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                              {viewMode === 'detailed' && (
                                <>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingProduct(product)}>
                                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={deleteProductMutation.isPending}
                                    onClick={() => handleDeleteProduct(product.id)}
                                  >
                                    {deleteProductMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-destructive" />}
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {displayProducts.map((product: any) => (
                    <div
                      key={product.id}
                      className="bg-card p-4 rounded-xl border border-border shadow-sm active:scale-[0.98] transition-all animate-fade-in relative group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-3">
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                            className="mt-1"
                          />
                          <div>
                            <h3 className="font-bold text-base leading-tight">{product.name}</h3>
                            {viewMode === 'detailed' && product.imei && (
                              <p className="text-xs font-mono text-muted-foreground mt-1">IMEI: {product.imei}</p>
                            )}
                            {viewMode !== 'detailed' && product.count > 1 && (
                              <Badge variant="secondary" className="mt-1 h-5 text-[10px] uppercase font-bold">
                                {product.count} variations
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {!isVendus && (
                            <Badge
                              variant={product.stock <= 5 ? 'destructive' : 'default'}
                              className={cn(
                                "shadow-sm",
                                product.stock > 0 && product.stock <= 5 && "bg-orange-500"
                              )}
                            >
                              {product.stock} en stock
                            </Badge>
                          )}
                          {isVendus && (
                            <Badge className="bg-success text-success-foreground shadow-sm">Vendu</Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 my-4 py-4 border-y border-border/50">
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">
                            {isVendus ? "Prix de vente" : "Prix d'achat"}
                          </p>
                          <p className={cn(
                            "font-bold text-sm",
                            isVendus ? "text-success" : "text-foreground"
                          )}>
                            {isVendus ? formatCurrency(product.sellingPrice || 0) : (isPrivate ? "••••••" : formatCurrency(product.purchasePrice))}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Catégorie</p>
                          <p className="text-sm font-medium">{product.category}</p>
                        </div>
                        {isVendus && (
                          <>
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Vendu par</p>
                              <p className="text-sm font-medium truncate">{product.soldBy || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Date</p>
                              <p className="text-sm font-medium">
                                {product.soldAt ? new Date(product.soldAt).toLocaleDateString('fr-BJ') : 'N/A'}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {product.description && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 gap-2 px-3">
                                  <Eye className="w-3.5 h-3.5" />
                                  <span className="text-xs">Détails</span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[calc(100vw-2rem)] mx-4">
                                <div className="space-y-2">
                                  <h4 className="font-bold">Description</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                    {product.description}
                                  </p>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {viewMode === 'detailed' && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingProduct(product)}>
                                <Edit2 className="w-4 h-4 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={deleteProductMutation.isPending}
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                {deleteProductMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-destructive" />}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Load More Button */}
              {hasNextPage && (
                <div className="flex justify-center pb-6">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="w-full sm:w-auto min-w-[200px]"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      "Voir plus"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )
        }

        {/* Edit Dialog */}
        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Modifier le produit</DialogTitle>
              <DialogDescription>
                Modifiez les informations du produit.
              </DialogDescription>
            </DialogHeader>
            {editingProduct && <ProductForm product={editingProduct} onSubmit={handleEditProduct} isSubmitting={updateProductMutation.isPending} />}
          </DialogContent>
        </Dialog>

        <ConfirmationModal
          isOpen={isConfirmOpen}
          onClose={closeConfirm}
          onConfirm={handleConfirm}
          title={confirmOptions.title}
          message={confirmOptions.message}
          variant={confirmOptions.variant}
          confirmText={confirmOptions.confirmText}
          cancelText={confirmOptions.cancelText}
        />
      </div>
    </DashboardLayout>
  );
}
