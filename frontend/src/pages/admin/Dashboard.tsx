import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { ProfitChart } from '@/components/dashboard/ProfitChart';
import { formatCurrency } from '@/services/api';
import { TrendingUp, Package, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/services/api';
import type { DailyOverview, MonthlyStats } from '@/types';
import { cn } from '@/lib/utils';
import { usePrivacy } from '@/contexts/PrivacyContext';

export default function AdminDashboard() {
  const [dailyStats, setDailyStats] = useState<DailyOverview>({
    sales: 0,
    purchases: 0,
    globalBalance: 0,
    profit: 0,
    expenses: 0,
    netProfit: 0,
    newTasks: 0,
    completedTasks: 0,
  });
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    totalSales: 0,
    totalPurchases: 0,
    globalBalance: 0,
    totalProfit: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    cancelledTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const { isPrivate } = usePrivacy();

  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [daily, monthly, productsData] = await Promise.all([
          api.stats.getDaily(),
          api.stats.getMonthly(),
          api.products.getAll(1, 100), // Get first 100 products for quick stats
        ]);
        setDailyStats(daily);
        setMonthlyStats(monthly);
        setProducts(productsData.items);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const uniqueProducts = new Set(products.map(p => p.name || 'Inconnu')).size;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">Bienvenue ! Voici un aperçu de votre activité.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground animate-pulse">Chargement des statistiques...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatsCard title="Ventes du jour" value={formatCurrency(dailyStats.sales || 0)} change="Chiffre d'affaires" icon={TrendingUp} variant="primary" />
              <StatsCard title="Achats du jour" value={isPrivate ? "••••••" : formatCurrency(dailyStats.purchases || 0)} change="Investissement" icon={Package} variant="accent" />
              <StatsCard title="Profit Opérationnel" value={isPrivate ? "••••••" : formatCurrency(dailyStats.profit || 0)} change="Bénéfice brut" changeType="positive" icon={TrendingUp} variant="success" />
              <StatsCard title="Valeur Stock" value={isPrivate ? "••••••" : formatCurrency(dailyStats.total_value || 0)} change="Capital immobilisé" icon={Package} variant="warning" />
              <StatsCard title="Solde Global" value={isPrivate ? "••••••" : formatCurrency(dailyStats.global_balance || 0)} change="Flux de trésorerie" changeType={(dailyStats.global_balance || 0) >= 0 ? "positive" : "negative"} icon={Package} />
            </div>

            <div className="bg-card p-6 rounded-xl border border-border shadow-sm animate-fade-in">
              <h3 className="text-lg font-semibold mb-4">Résumé mensuel</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{formatCurrency(monthlyStats.totalSales || 0)}</p>
                  <p className="text-sm text-muted-foreground">Ventes totales</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-orange-500">{isPrivate ? "••••••" : formatCurrency(monthlyStats.totalPurchases || 0)}</p>
                  <p className="text-sm text-muted-foreground">Achats totaux</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-success">{isPrivate ? "••••••" : formatCurrency(monthlyStats.totalProfit || 0)}</p>
                  <p className="text-sm text-muted-foreground">Bénéfice opérationnel</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-warning">{isPrivate ? "••••••" : formatCurrency(monthlyStats.total_value || 0)}</p>
                  <p className="text-sm text-muted-foreground">Valeur du stock</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className={cn("text-2xl font-bold", (monthlyStats.global_balance || 0) >= 0 ? "text-blue-500" : "text-destructive")}>
                    {isPrivate ? "••••••" : formatCurrency(monthlyStats.global_balance || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Solde global</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/20">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <p className="text-2xl font-bold">{monthlyStats.completedTasks || 0}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Terminées</p>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/20">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5 text-info" />
                    <p className="text-2xl font-bold">{monthlyStats.inProgressTasks || 0}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">En cours</p>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/20">
                  <div className="flex items-center justify-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    <p className="text-2xl font-bold">{totalStock || 0}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Stock total</p>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/20">
                  <div className="flex items-center justify-center gap-2">
                    <XCircle className="w-5 h-5 text-destructive" />
                    <p className="text-2xl font-bold">{monthlyStats.cancelledTasks || 0}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Annulées</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SalesChart />
              <ProfitChart />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
