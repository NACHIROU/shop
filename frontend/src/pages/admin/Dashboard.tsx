import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { ProfitChart } from '@/components/dashboard/ProfitChart';
import { formatCurrency } from '@/services/api';
import { TrendingUp, Package, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/services/api';
import type { DailyOverview, MonthlyStats } from '@/types';

export default function AdminDashboard() {
  const [dailyStats, setDailyStats] = useState<DailyOverview>({
    sales: 0,
    profit: 0,
    expenses: 0,
    netProfit: 0,
    newTasks: 0,
    completedTasks: 0,
  });
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    totalSales: 0,
    totalProfit: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    cancelledTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [daily, monthly] = await Promise.all([
          api.stats.getDaily(),
          api.stats.getMonthly(),
        ]);
        setDailyStats(daily);
        setMonthlyStats(monthly);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">Bienvenue ! Voici un aperçu de votre activité.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Ventes du jour" value={formatCurrency(dailyStats.sales)} change="Données en temps réel" changeType="neutral" icon={TrendingUp} variant="primary" />
          <StatsCard title="Profit net du jour" value={formatCurrency(dailyStats.netProfit)} change="Après dépenses" changeType="positive" icon={TrendingUp} variant="success" />
          <StatsCard title="Articles en stock" value="0 articles" change="0 produits" changeType="neutral" icon={Package} />
          <StatsCard title="Tâches en cours" value={`${monthlyStats.inProgressTasks}`} change={`${dailyStats.newTasks} nouvelles`} changeType="neutral" icon={Clock} variant="accent" />
        </div>

        <div className="bg-card p-6 rounded-xl border border-border shadow-sm animate-fade-in">
          <h3 className="text-lg font-semibold mb-4">Résumé mensuel</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">{formatCurrency(monthlyStats.totalSales)}</p>
              <p className="text-sm text-muted-foreground">Ventes totales</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-success">{formatCurrency(monthlyStats.netProfit)}</p>
              <p className="text-sm text-muted-foreground">Profit net</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <p className="text-2xl font-bold">{monthlyStats.completedTasks}</p>
              </div>
              <p className="text-sm text-muted-foreground">Tâches terminées</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                <p className="text-2xl font-bold">{monthlyStats.cancelledTasks}</p>
              </div>
              <p className="text-sm text-muted-foreground">Tâches annulées</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesChart />
          <ProfitChart />
        </div>
      </div>
    </DashboardLayout>
  );
}
