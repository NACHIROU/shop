import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  getStatusLabel,
  getStatusColor,
  getTaskTypeLabel,
  formatDate,
  tasksApi,
  authApi,
  productsApi
} from '@/services/api';
import type { Task, TaskStatus, Collaborator, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/loader';
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
  MoreVertical,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const typeIcons = {
  sale: Package,
  delivery: Truck,
  client_visit: Users,
  exchange: RefreshCw,
  purchase: Package,
  other: Clock,
};

const statusFilters: { label: string; value: TaskStatus | 'all' }[] = [
  { label: 'Toutes', value: 'all' },
  { label: 'En cours', value: 'in_progress' },
  { label: 'En livraison', value: 'in_delivery' },
  { label: 'Terminées', value: 'completed' },
  { label: 'Annulées', value: 'cancelled' },
];

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [tasksData, collaboratorsData, productsData] = await Promise.all([
        tasksApi.getAll(),
        authApi.getCollaborators(),
        productsApi.getAll()
      ]);

      // Map backend snake_case to frontend camelCase
      const mappedTasks = tasksData.map((t: any) => ({
        ...t,
        assignedTo: t.assigned_to,
        assignedToName: t.assigned_to_name || t.assignedToName,
        productId: t.product_id,
        productName: t.product_name,
        clientName: t.client_name,
        clientPhone: t.client_phone,
        createdAt: t.created_at || t.createdAt,
        updatedAt: t.updated_at || t.updatedAt,
      }));

      setTaskList(mappedTasks);
      setCollaborators(collaboratorsData);
      setProducts(productsData.items);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTasks = taskList.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignedToName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Prepare payload for backend (snake_case generally preferred/expected if Pydantic uses it, 
    // but verifying api.ts service might just pass through. 
    // If backend uses Pydantic BaseModel, it accepts snake_case by default or aliases.
    // Let's use what we used elsewhere or default to snake_case for safety).
    const payload = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as Task['type'],
      status: 'in_progress',
      assigned_to: formData.get('assignedTo') as string,
      product_id: (formData.get('product') as string) || undefined,
      client_name: (formData.get('clientName') as string) || undefined,
      client_phone: (formData.get('clientPhone') as string) || undefined,
      date: formData.get('date') as string,
    };

    try {
      await tasksApi.create(payload as any);
      toast.success('Tâche créée avec succès');
      setIsAddDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la création de la tâche");
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await tasksApi.updateStatus(taskId, newStatus);
      toast.success('Statut mis à jour');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) return;
    try {
      await tasksApi.delete(taskId);
      toast.success('Tâche supprimée');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const statusCounts = {
    in_progress: taskList.filter(t => t.status === 'in_progress').length,
    in_delivery: taskList.filter(t => t.status === 'in_delivery').length,
    completed: taskList.filter(t => t.status === 'completed').length,
    cancelled: taskList.filter(t => t.status === 'cancelled').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="text-2xl font-bold">Gestion des tâches</h1>
            <p className="text-muted-foreground">Suivez les ventes, livraisons et échanges</p>
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
                  <DialogTitle>Nouvelle tâche</DialogTitle>
                  <DialogDescription>
                    Créez une nouvelle tâche pour votre équipe.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Titre</Label>
                    <Input id="title" name="title" placeholder="Vente iPhone 15" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" placeholder="Détails de la tâche..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">Type</Label>
                      <Select name="type" defaultValue="sale">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sale">Vente</SelectItem>
                          <SelectItem value="delivery">Livraison</SelectItem>
                          <SelectItem value="client_visit">Visite client</SelectItem>
                          <SelectItem value="exchange">Échange (Troc)</SelectItem>
                          <SelectItem value="purchase">Achat</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="date">Date de l'opération</Label>
                      <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="assignedTo">Assigné à</Label>
                    <Select name="assignedTo">
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un collaborateur" />
                      </SelectTrigger>
                      <SelectContent>
                        {collaborators.length === 0 ? (
                          <SelectItem value="none" disabled>Aucun collaborateur disponible</SelectItem>
                        ) : (
                          collaborators.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))
                        )}
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
                        {products.length === 0 ? (
                          <SelectItem value="none" disabled>Aucun produit disponible</SelectItem>
                        ) : (
                          products.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="clientName">Nom du client</Label>
                      <Input id="clientName" name="clientName" placeholder="M. Dupont" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="clientPhone">Téléphone client</Label>
                      <Input id="clientPhone" name="clientPhone" placeholder="+229 97 00 00 00" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Créer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-info/10 p-4 rounded-xl border border-info/20">
            <p className="text-sm text-info">En cours</p>
            <p className="text-2xl font-bold">{statusCounts.in_progress}</p>
          </div>
          <div className="bg-warning/10 p-4 rounded-xl border border-warning/20">
            <p className="text-sm text-warning">En livraison</p>
            <p className="text-2xl font-bold">{statusCounts.in_delivery}</p>
          </div>
          <div className="bg-success/10 p-4 rounded-xl border border-success/20">
            <p className="text-sm text-success">Terminées</p>
            <p className="text-2xl font-bold">{statusCounts.completed}</p>
          </div>
          <div className="bg-destructive/10 p-4 rounded-xl border border-destructive/20">
            <p className="text-sm text-destructive">Annulées</p>
            <p className="text-2xl font-bold">{statusCounts.cancelled}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher une tâche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(filter.value)}
                className="whitespace-nowrap"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        {isLoading ? (
          <PageLoader />
        ) : taskList.length === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Aucune tâche</h3>
            <p className="text-muted-foreground mb-4">Commencez par créer votre première tâche.</p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle tâche
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const Icon = typeIcons[task.type];
              return (
                <div
                  key={task.id}
                  className="bg-card p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-all animate-fade-in"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{task.title}</h3>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-xs", getStatusColor(task.status))}>
                            {getStatusLabel(task.status)}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleUpdateStatus(task.id, 'in_progress')}>
                                Marquer en cours
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(task.id, 'in_delivery')}>
                                Marquer en livraison
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(task.id, 'completed')}>
                                Marquer terminée
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleUpdateStatus(task.id, 'cancelled')}
                              >
                                Annuler
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(task.date)}
                        </span>
                        {task.assignedToName && (
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {task.assignedToName}
                          </span>
                        )}
                        <Badge variant="secondary">{getTaskTypeLabel(task.type)}</Badge>
                        {task.productName && (
                          <span className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            {task.productName}
                          </span>
                        )}
                        {task.clientName && (
                          <span>Client: {task.clientName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
