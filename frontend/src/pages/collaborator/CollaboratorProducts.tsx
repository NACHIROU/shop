import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { Product } from '@/types';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, Eye, Loader2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { productsApi } from '@/services/api';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useInfiniteQuery } from '@tanstack/react-query';

export default function CollaboratorProducts() {
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Fetch products with Infinite Query
    const {
        data: productsInfiniteData,
        isLoading: productsLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: ['products', searchQuery, categoryFilter],
        queryFn: async ({ pageParam = 1 }) => {
            const response = await productsApi.getAll(pageParam, 20, searchQuery, categoryFilter, false);
            return {
                ...response,
                items: response.items.map((p: any) => ({
                    ...p,
                    id: p.id,
                    name: p.name,
                    imei: p.imei,
                    stock: p.stock,
                    category: p.category,
                    description: p.description,
                    isArchived: p.is_archived,
                    sellingPrice: p.selling_price,
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

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
                    <div>
                        <h1 className="text-2xl font-bold">Liste des produits</h1>
                        <p className="text-muted-foreground">Consultez l'inventaire disponible</p>
                    </div>
                </div>

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
                    <div className="flex items-center gap-2">
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes catégories</SelectItem>
                                <SelectItem value="iPhone">iPhone</SelectItem>
                                <SelectItem value="Samsung">Samsung</SelectItem>
                                <SelectItem value="Autres">Autres</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Products Table */}
                {productsLoading ? (
                    <PageLoader />
                ) : productList.length === 0 ? (
                    <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center animate-fade-in">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                            <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold mb-2">Aucun produit trouvé</h3>
                        <p className="text-muted-foreground">Il n'y a pas encore de produits dans cette catégorie.</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4 pb-20 md:pb-0"> {/* Extra bottom space for mobile nav */}
                            {/* Desktop Table View */}
                            <div className="hidden md:block bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-fade-in transition-all">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="font-bold">Produit</TableHead>
                                            <TableHead className="font-bold">IMEI</TableHead>
                                            <TableHead className="font-bold">Catégorie</TableHead>
                                            <TableHead className="text-center font-bold">Stock</TableHead>
                                            <TableHead className="text-right font-bold">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {productList.map((product: any) => (
                                            <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell className="font-semibold">{product.name}</TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground">{product.imei}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-normal">{product.category}</Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        variant={product.stock <= 0 ? 'destructive' : 'default'}
                                                        className={cn(
                                                            "min-w-8 justify-center shadow-sm",
                                                            product.stock > 0 && product.stock <= 2 && "bg-orange-500 hover:bg-orange-600"
                                                        )}
                                                    >
                                                        {product.stock}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {product.description && (
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="hover:bg-blue-50">
                                                                        <Eye className="w-4 h-4 text-blue-500" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-80">
                                                                    <div className="space-y-2">
                                                                        <h4 className="font-medium flex items-center gap-2">
                                                                            <Package className="w-4 h-4" /> Description
                                                                        </h4>
                                                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                                                            {product.description}
                                                                        </p>
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
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
                                {productList.map((product: any) => (
                                    <div
                                        key={product.id}
                                        className="bg-card p-4 rounded-xl border border-border shadow-sm active:scale-[0.98] transition-transform animate-fade-in"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-bold text-base leading-tight">{product.name}</h3>
                                                <p className="text-xs font-mono text-muted-foreground mt-1">IMEI: {product.imei || 'N/A'}</p>
                                            </div>
                                            <Badge
                                                variant={product.stock <= 0 ? 'destructive' : 'default'}
                                                className={cn(
                                                    "shadow-sm",
                                                    product.stock > 0 && product.stock <= 2 && "bg-orange-500"
                                                )}
                                            >
                                                {product.stock} en stock
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <Badge variant="secondary" className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold">
                                                {product.category}
                                            </Badge>
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
                                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                                {product.description}
                                                            </p>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
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
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
