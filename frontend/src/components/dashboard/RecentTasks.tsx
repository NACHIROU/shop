import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, Package, Truck, Users, RefreshCw } from 'lucide-react';
import { getStatusLabel, getStatusColor, getTaskTypeLabel } from '@/services/api';
import type { Task } from '@/types';

const typeIcons = {
  sale: Package,
  delivery: Truck,
  client_visit: Users,
  exchange: RefreshCw,
  purchase: Package,
  other: Clock,
};

// Placeholder - will be fetched from API
const recentTasks: Task[] = [];

export function RecentTasks() {
  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tâches récentes</h3>
          <p className="text-sm text-muted-foreground">Dernières activités</p>
        </div>
        <a href="/tasks" className="text-sm text-primary hover:underline font-medium">Voir tout</a>
      </div>
      
      {recentTasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune tâche récente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentTasks.slice(0, 5).map((task) => {
            const Icon = typeIcons[task.type];
            return (
              <div key={task.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{task.assignedToName} • {getTaskTypeLabel(task.type)}</p>
                </div>
                <Badge className={cn("text-xs", getStatusColor(task.status))}>{getStatusLabel(task.status)}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
