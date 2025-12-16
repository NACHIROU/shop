import { TrendingUp, Package } from 'lucide-react';
import { formatCurrency } from '@/services/api';
import type { Product } from '@/types';

// Placeholder - will be fetched from API
const products: Product[] = [];

export function TopProducts() {
  const topProducts = [...products]
    .sort((a, b) => (b.sellingPrice - b.purchasePrice) - (a.sellingPrice - a.purchasePrice))
    .slice(0, 5);

  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Produits rentables</h3>
          <p className="text-sm text-muted-foreground">Meilleurs marges bénéficiaires</p>
        </div>
        <a href="/products" className="text-sm text-primary hover:underline font-medium">Voir tout</a>
      </div>
      
      {topProducts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun produit ajouté</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topProducts.map((product, index) => {
            const profit = product.sellingPrice - product.purchasePrice;
            const margin = ((profit / product.purchasePrice) * 100).toFixed(0);
            return (
              <div key={product.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">{index + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">Stock: {product.stock} unités</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-success">{formatCurrency(profit)}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><TrendingUp className="w-3 h-3" />{margin}%</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
