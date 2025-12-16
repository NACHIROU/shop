import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api, getStatusLabel, getStatusColor, getTaskTypeLabel } from '@/services/api';
import { Task, TaskStatus, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search,
  Package,
  Truck,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const typeIcons: Record<string, React.ElementType> = {
  sale: Package,
  delivery: Truck,
  client_visit: Users,
  exchange: Package,
  purchase: Package,
  other: Clock,
};

const statusButtons: { status: TaskStatus; label: string; icon: React.ElementType; color: string }[] = [
  { status: 'in_progress', label: 'En cours', icon: Clock, color: 'bg-info hover:bg-info/90' },
  { status: 'in_delivery', label: 'En livraison', icon: Truck, color: 'bg-warning hover:bg-warning/90' },
  { status: 'completed', label: 'Terminée', icon: CheckCircle2, color: 'bg-success hover:bg-success/90' },
  { status: 'cancelled', label: 'Annulée', icon: XCircle, color: 'bg-destructive hover:bg-destructive/90' },
];

export default function CollaboratorTasks() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    api.tasks.getAll().then(tasks => {
      setTaskList(tasks.filter(t => t.assignedTo === '2'));
    });
    api.products.getAll().then(setProducts);
  }, []);

  const filteredTasks = taskList.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productId = formData.get('product') as string;
    const product = products.find(p => p.id === productId);
    
    const newTask: Task = {
      id: String(Date.now()),
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as Task['type'],
      status: 'in_progress',
      assignedTo: '2',
      assignedToName: user?.name || 'Collaborateur',
      productId: productId || undefined,
      productName: product?.name,
      clientName: formData.get('clientName') as string,
      clientPhone: formData.get('clientPhone') as string,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTaskList([newTask, ...taskList]);
    setIsAddDialogOpen(false);
    toast.success('Tâche ajoutée avec succès');
  };

  const handleUpdateStatus = (taskId: string, newStatus: TaskStatus) => {
    setTaskList(taskList.map(t => 
      t.id === taskId 
        ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
        : t
    ));
    toast.success(`Statut mis à jour: ${getStatusLabel(newStatus)}`);
  };

  const inProgressCount = taskList.filter(t => t.status === 'in_progress' || t.status === 'in_delivery').length;
  const completedCount = taskList.filter(t => t.status === 'completed').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="text-2xl font-bold">Mes tâches</h1>
            <p className="text-muted-foreground">
              {inProgressCount} en cours • {completedCount} terminées
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 gradient-primary">
                <Plus className="w-4 h-4" />
                Nouvelle tâche
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleAddTask}>
                <DialogHeader>
                  <DialogTitle>Ajouter une tâche</DialogTitle>
                  <DialogDescription>
                    Enregistrez une nouvelle vente, livraison ou visite client.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Titre</Label>
                    <Input id="title" name="title" placeholder="Vente iPhone 15 Pro" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type de tâche</Label>
                    <Select name="type" defaultValue="sale">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sale">🛒 Vente</SelectItem>
                        <SelectItem value="delivery">🚚 Livraison</SelectItem>
                        <SelectItem value="client_visit">👥 Visite client</SelectItem>
                        <SelectItem value="exchange">🔄 Échange (Troc)</SelectItem>
                        <SelectItem value="purchase">📦 Achat</SelectItem>
                        <SelectItem value="other">📋 Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="product">Produit (optionnel)</Label>
                    <Select name="product">
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un produit" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="clientName">Nom du client</Label>
                      <Input id="clientName" name="clientName" placeholder="M. Adjovi" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="clientPhone">Téléphone</Label>
                      <Input id="clientPhone" name="clientPhone" placeholder="+229 97 00 00 00" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Notes</Label>
                    <Textarea id="description" name="description" placeholder="Détails supplémentaires..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Ajouter</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher une tâche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Aucune tâche trouvée</h3>
              <p className="text-sm text-muted-foreground">
                Ajoutez votre première tâche pour commencer.
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const Icon = typeIcons[task.type] || Clock;
              return (
                <div 
                  key={task.id}
                  className="bg-card p-5 rounded-xl border border-border shadow-sm hover:shadow-md transition-all animate-fade-in"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg">{task.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{getTaskTypeLabel(task.type)}</Badge>
                            <Badge className={cn("text-xs", getStatusColor(task.status))}>
                              {getStatusLabel(task.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-2">{task.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                        {task.productName && (
                          <span className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            {task.productName}
                          </span>
                        )}
                        {task.clientName && (
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {task.clientName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Update Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                    <span className="text-sm text-muted-foreground mr-2 self-center">Mettre à jour:</span>
                    {statusButtons.map(({ status, label, icon: StatusIcon, color }) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={task.status === status ? 'default' : 'outline'}
                        className={cn(
                          "gap-1.5",
                          task.status === status && color
                        )}
                        onClick={() => handleUpdateStatus(task.id, status)}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
