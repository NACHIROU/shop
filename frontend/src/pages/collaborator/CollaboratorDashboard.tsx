import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api, getStatusLabel, getStatusColor, getTaskTypeLabel, formatDate } from '@/services/api';
import { Task } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  ClipboardList,
  Package,
  Truck,
  Users,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PageLoader } from '@/components/ui/loader';

const typeIcons: Record<string, React.ElementType> = {
  vente: Package,
  troc: RefreshCw,
  delivery: Truck,
  client_visit: Users,
  exchange: RefreshCw,
  purchase: Package,
  other: Clock,
};

export default function CollaboratorDashboard() {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyTasks = async () => {
      try {
        const tasks = await api.tasks.getAll();
        // Filter tasks assigned to current user
        const mappedTasks = tasks.map((t: any) => ({
          ...t,
          assignedTo: t.assigned_to || t.assignedTo,
          assignedToName: t.assigned_to_name || t.assignedToName,
          productId: t.product_id,
          productName: t.product_name,
          clientName: t.client_name,
          clientPhone: t.client_phone,
          createdAt: t.created_at || t.createdAt,
          updatedAt: t.updated_at || t.updatedAt,
        }));
        setMyTasks(mappedTasks.filter((t: Task) => t.assignedTo === user?.id));
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTasks();
  }, [user?.id]);

  const completedTasks = myTasks.filter(t => t.status === 'completed');
  const inProgressTasks = myTasks.filter(t => t.status === 'in_progress' || t.status === 'in_delivery');
  const recentTasks = myTasks.slice(0, 5);
  const completionRate = myTasks.length > 0 ? Math.round((completedTasks.length / myTasks.length) * 100) : 0;

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 pb-6">
        {/* Welcome Header - Mobile optimized */}
        <div className="animate-slide-up">
          <h1 className="text-xl md:text-2xl font-bold">Bonjour, {user?.name?.split(' ')[0]} !</h1>
          <p className="text-sm md:text-base text-muted-foreground">Voici un aperçu de vos tâches.</p>
        </div>

        {/* Stats Grid - Mobile responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-info/10 p-3 md:p-4 rounded-xl border border-info/20">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-info" />
              <p className="text-xs md:text-sm text-info font-medium">En cours</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold">{inProgressTasks.length}</p>
          </div>

          <div className="bg-success/10 p-3 md:p-4 rounded-xl border border-success/20">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-success" />
              <p className="text-xs md:text-sm text-success font-medium">Terminées</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold">{completedTasks.length}</p>
          </div>

          <div className="bg-primary/10 p-3 md:p-4 rounded-xl border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              <p className="text-xs md:text-sm text-primary font-medium">Total</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold">{myTasks.length}</p>
          </div>

          <div className="bg-accent/10 p-3 md:p-4 rounded-xl border border-accent/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-accent" />
              <p className="text-xs md:text-sm text-accent font-medium">Taux</p>
            </div>
            <p className="text-2xl md:text-3xl font-bold">{completionRate}%</p>
          </div>
        </div>

        {/* Quick Actions - Mobile optimized */}
        <div className="bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm animate-fade-in">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Actions rapides</h3>
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <Link to="/tasks" className="block">
              <Button variant="outline" className="w-full h-auto py-3 md:py-4 flex-col gap-1 md:gap-2 hover:bg-muted text-xs md:text-sm">
                <Package className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                <span className="hidden sm:inline">Nouvelle vente</span>
                <span className="sm:hidden">Vente</span>
              </Button>
            </Link>
            <Link to="/tasks" className="block">
              <Button variant="outline" className="w-full h-auto py-3 md:py-4 flex-col gap-1 md:gap-2 hover:bg-muted text-xs md:text-sm">
                <RefreshCw className="w-5 h-5 md:w-6 md:h-6 text-warning" />
                <span className="hidden sm:inline">Nouveau troc</span>
                <span className="sm:hidden">Troc</span>
              </Button>
            </Link>
            <Link to="/tasks" className="block">
              <Button variant="outline" className="w-full h-auto py-3 md:py-4 flex-col gap-1 md:gap-2 hover:bg-muted text-xs md:text-sm">
                <ClipboardList className="w-5 h-5 md:w-6 md:h-6 text-info" />
                <span className="hidden sm:inline">Voir toutes</span>
                <span className="sm:hidden">Toutes</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Tasks - Mobile optimized */}
        <div className="bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm animate-fade-in">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h3 className="text-base md:text-lg font-semibold">Mes tâches récentes</h3>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Dernières activités</p>
            </div>
            <Link to="/tasks">
              <Button variant="ghost" size="sm" className="gap-1 md:gap-2 text-xs md:text-sm">
                <span className="hidden sm:inline">Voir tout</span>
                <span className="sm:hidden">Tout</span>
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune tâche assignée</p>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {recentTasks.map((task) => {
                const Icon = typeIcons[task.type] || Clock;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs md:text-sm truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {getTaskTypeLabel(task.type)} • {formatDate(task.date)}
                      </p>
                    </div>
                    <Badge className={cn("text-xs whitespace-nowrap", getStatusColor(task.status))}>
                      <span className="hidden sm:inline">{getStatusLabel(task.status)}</span>
                      <span className="sm:hidden">
                        {task.status === 'completed' ? '✓' : task.status === 'in_progress' ? '⏳' : '🚚'}
                      </span>
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tips - Mobile optimized */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 md:p-6 rounded-xl border border-primary/20 animate-fade-in">
          <h3 className="font-semibold mb-2 text-sm md:text-base">💡 Conseil du jour</h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            Mettez à jour le statut de vos tâches en temps réel pour une meilleure coordination avec l'équipe.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
