import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { api, getStatusLabel, getStatusColor, getTaskTypeLabel } from '@/services/api';
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
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const typeIcons: Record<string, React.ElementType> = {
  sale: Package,
  delivery: Truck,
  client_visit: Users,
  exchange: Package,
  purchase: Package,
  other: Clock,
};

export default function CollaboratorDashboard() {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState<Task[]>([]);

  useEffect(() => {
    api.tasks.getAll().then(tasks => {
      // Filter tasks for current collaborator
      setMyTasks(tasks.filter(t => t.assignedTo === '2'));
    });
  }, []);

  const completedTasks = myTasks.filter(t => t.status === 'completed');
  const inProgressTasks = myTasks.filter(t => t.status === 'in_progress' || t.status === 'in_delivery');
  const recentTasks = myTasks.slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold">Bonjour, {user?.name?.split(' ')[0]} !</h1>
          <p className="text-muted-foreground">Voici un aperçu de vos tâches du jour.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Tâches en cours"
            value={String(inProgressTasks.length)}
            icon={Clock}
            variant="primary"
          />
          <StatsCard
            title="Tâches terminées"
            value={String(completedTasks.length)}
            icon={CheckCircle2}
            variant="success"
          />
          <StatsCard
            title="Total tâches"
            value={String(myTasks.length)}
            icon={ClipboardList}
          />
          <StatsCard
            title="Performance"
            value="95%"
            change="Excellent"
            changeType="positive"
            icon={TrendingUp}
            variant="accent"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm animate-fade-in">
          <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/collaborator/tasks">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:bg-muted">
                <Package className="w-6 h-6 text-primary" />
                <span>Nouvelle vente</span>
              </Button>
            </Link>
            <Link to="/collaborator/tasks">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:bg-muted">
                <Truck className="w-6 h-6 text-warning" />
                <span>Nouvelle livraison</span>
              </Button>
            </Link>
            <Link to="/collaborator/tasks">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:bg-muted">
                <Users className="w-6 h-6 text-info" />
                <span>Visite client</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Mes tâches récentes</h3>
              <p className="text-sm text-muted-foreground">Dernières activités</p>
            </div>
            <Link to="/collaborator/tasks">
              <Button variant="ghost" className="gap-2">
                Voir tout
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentTasks.map((task) => {
              const Icon = typeIcons[task.type] || Clock;
              return (
                <div 
                  key={task.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getTaskTypeLabel(task.type)} • {task.clientName || 'Pas de client'}
                    </p>
                  </div>
                  <Badge className={cn("text-xs", getStatusColor(task.status))}>
                    {getStatusLabel(task.status)}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-xl border border-primary/20 animate-fade-in">
          <h3 className="font-semibold mb-2">💡 Conseil du jour</h3>
          <p className="text-sm text-muted-foreground">
            Mettez à jour le statut de vos tâches en temps réel pour une meilleure coordination avec l'équipe.
            Cliquez sur une tâche pour modifier son statut.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
