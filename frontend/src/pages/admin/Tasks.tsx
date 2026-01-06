import { useState } from 'react';
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
  RefreshCw,
  Archive,
  Trash2,
  CheckSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { useConfirmation } from '@/hooks/useConfirmation';

const typeIcons = {
  vente: Package,
  troc: RefreshCw,
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
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState<'vente' | 'troc' | 'other'>('vente');
  const [isArchived, setIsArchived] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const { confirm, isOpen: isConfirmOpen, options: confirmOptions, close: closeConfirm, handleConfirm } = useConfirmation();

  // Fetch tasks
  const { data: taskList = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', selectedDate, isArchived],
    queryFn: async () => {
      const data = await tasksApi.getAll(selectedDate || undefined, isArchived);
      return data.map((t: any) => ({
        ...t,
        assignedTo: t.assigned_to,
        assignedToName: t.assigned_to_name || t.assignedToName,
        productId: t.product_id,
        productName: t.product_name,
        productImei: t.product_imei,
        clientName: t.client_name,
        clientPhone: t.client_phone,
        createdAt: t.created_at || t.createdAt,
        updatedAt: t.updated_at || t.updatedAt,
        sellingPrice: t.selling_price,
        outgoingProductId: t.outgoing_product_id,
        outgoingProductPrice: t.outgoing_product_price,
        incomingProductName: t.incoming_product_name,
        incomingProductImei: t.incoming_product_imei,
        incomingProductPrice: t.incoming_product_price,
        incomingProductCategory: t.incoming_product_category,
        recoveredFrom: t.recovered_from,
      }));
    }
  });

  // Fetch collaborators
  const { data: collaborators = [], isLoading: collaboratorsLoading } = useQuery({
    queryKey: ['collaborators'],
    queryFn: () => authApi.getCollaborators(),
  });

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 1, '', 'all'], // Reuse generic product fetch key
    queryFn: () => productsApi.getAll(1, 100),
  });

  const products = productsData?.items || [];
  const isLoading = tasksLoading || collaboratorsLoading || productsLoading;

  const addTaskMutation = useMutation({
    mutationFn: (payload: any) => tasksApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock might have changed
      toast.success('Tâche créée avec succès');
      setIsAddDialogOpen(false);
    },
    onError: () => toast.error("Erreur lors de la création de la tâche")
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => tasksApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Statut mis à jour');
    },
    onError: () => toast.error("Erreur lors de la mise à jour du statut")
  });



  const bulkActionMutation = useMutation({
    mutationFn: ({ action, ids }: { action: 'archive' | 'delete', ids: string[] }) =>
      tasksApi.bulkAction(action, ids),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`Action groupée (${variables.action}) effectuée`);
      setSelectedTasks([]);
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'action groupée');
      console.error(error);
    }
  });

  const cleanupMutation = useMutation({
    mutationFn: () => tasksApi.cleanup(),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`Nettoyage effectué : ${data.archived_count} tâches archivées`);
    },
    onError: (error) => {
      toast.error('Erreur lors du nettoyage');
      console.error(error);
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tâche supprimée');
    },
    onError: () => toast.error("Erreur lors de la suppression")
  });

  const filteredTasks = taskList.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignedToName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.productImei?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    let payload: any = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: selectedTaskType,
      assigned_to: formData.get('assignedTo') as string,
      date: formData.get('date') as string,
    };

    if (selectedTaskType === 'vente') {
      payload.product_id = formData.get('product') as string;
      payload.selling_price = Number(formData.get('sellingPrice'));
      payload.client = formData.get('client') as string || undefined;
    }

    if (selectedTaskType === 'troc') {
      payload.outgoing_product_id = formData.get('outgoingProduct') as string;
      payload.outgoing_product_price = Number(formData.get('outgoingPrice'));
      payload.incoming_product_name = formData.get('incomingName') as string;
      payload.incoming_product_imei = formData.get('incomingImei') as string;
      payload.incoming_product_price = Number(formData.get('incomingPrice'));
      payload.incoming_product_category = formData.get('incomingCategory') as string;
      payload.recovered_from = formData.get('recoveredFrom') as string;
    }

    addTaskMutation.mutate(payload);
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  const handleDeleteTask = async (taskId: string) => {
    confirm({
      title: 'Supprimer la tâche',
      message: 'Voulez-vous vraiment supprimer cette tâche ?',
      variant: 'danger',
      confirmText: 'Supprimer',
      onConfirm: () => deleteTaskMutation.mutate(taskId)
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(filteredTasks.map(t => t.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks(prev => [...prev, taskId]);
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleBulkAction = (action: 'archive' | 'delete') => {
    if (selectedTasks.length === 0) return;

    confirm({
      title: action === 'delete' ? 'Suppression groupée' : 'Archivage groupé',
      message: `Voulez-vous vraiment ${action === 'delete' ? 'supprimer' : 'archiver'} ${selectedTasks.length} tâches ?`,
      variant: action === 'delete' ? 'danger' : 'default',
      confirmText: action === 'delete' ? 'Supprimer' : 'Archiver',
      onConfirm: () => bulkActionMutation.mutate({ action, ids: selectedTasks })
    });
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                      <Select value={selectedTaskType} onValueChange={(v: any) => setSelectedTaskType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vente">Vente</SelectItem>
                          <SelectItem value="troc">Troc (Échange)</SelectItem>
                          <SelectItem value="repair">Réparation</SelectItem>
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

                  {/* Vente Form */}
                  {selectedTaskType === 'vente' && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="product">Produit</Label>
                        <Select name="product">
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un produit" />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="p-2">
                              <Input
                                placeholder="Rechercher par nom ou IMEI..."
                                onChange={(e) => {
                                  const search = e.target.value.toLowerCase();
                                  const items = document.querySelectorAll('[data-product-item]');
                                  items.forEach((item: any) => {
                                    const text = item.textContent.toLowerCase();
                                    item.style.display = text.includes(search) ? '' : 'none';
                                  });
                                }}
                                className="mb-2"
                              />
                            </div>
                            {products.filter(p => p.stock > 0).map(p => (
                              <SelectItem key={p.id} value={p.id} data-product-item>
                                {p.name} {p.imei && `(${p.imei})`} ({p.stock} en stock)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="sellingPrice">Prix de vente (FCFA)</Label>
                        <Input id="sellingPrice" name="sellingPrice" type="number" placeholder="820000" required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="client">Client (optionnel)</Label>
                        <Input id="client" name="client" placeholder="M. Dupont" />
                      </div>
                    </>
                  )}

                  {/* Troc Form */}
                  {selectedTaskType === 'troc' && (
                    <>
                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-3">Produit sortant</h3>
                        <div className="grid gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="outgoingProduct">Produit</Label>
                            <Select name="outgoingProduct">
                              <SelectTrigger>
                                <SelectValue placeholder="Produit à échanger" />
                              </SelectTrigger>
                              <SelectContent>
                                <div className="p-2">
                                  <Input
                                    placeholder="Rechercher par nom ou IMEI..."
                                    onChange={(e) => {
                                      const search = e.target.value.toLowerCase();
                                      const items = document.querySelectorAll('[data-outgoing-product]');
                                      items.forEach((item: any) => {
                                        const text = item.textContent.toLowerCase();
                                        item.style.display = text.includes(search) ? '' : 'none';
                                      });
                                    }}
                                    className="mb-2"
                                  />
                                </div>
                                {products.filter(p => p.stock > 0).map(p => (
                                  <SelectItem key={p.id} value={p.id} data-outgoing-product>
                                    {p.name} {p.imei && `(${p.imei})`} ({p.stock} en stock)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="outgoingPrice">Prix du produit sortant (FCFA)</Label>
                            <Input id="outgoingPrice" name="outgoingPrice" type="number" placeholder="500000" required />
                          </div>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-3">Produit entrant (nouveau)</h3>
                        <div className="grid gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="incomingName">Nom/Modèle</Label>
                            <Input id="incomingName" name="incomingName" placeholder="Samsung Galaxy S24" required />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="incomingImei">IMEI</Label>
                            <Input id="incomingImei" name="incomingImei" placeholder="987654321098765" required />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="incomingPrice">Prix estimé (FCFA)</Label>
                              <Input id="incomingPrice" name="incomingPrice" type="number" placeholder="550000" required />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="incomingCategory">Catégorie</Label>
                              <Select name="incomingCategory" defaultValue="Autres">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="iPhone">iPhone</SelectItem>
                                  <SelectItem value="Samsung">Samsung</SelectItem>
                                  <SelectItem value="Autres">Autres</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="recoveredFrom">Récupéré de</Label>
                            <Input id="recoveredFrom" name="recoveredFrom" placeholder="M. Martin" required />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
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
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 w-[180px]"
              />
            </div>
            {selectedDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate('')}
                className="text-muted-foreground"
              >
                Réinitialiser
              </Button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {!isArchived ? statusFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(filter.value)}
                className="whitespace-nowrap"
              >
                {filter.label}
              </Button>
            )) : (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  Archives
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cleanupMutation.mutate()}
                  disabled={cleanupMutation.isPending}
                  className="gap-2"
                >
                  <Trash2 className="w-3 h-3" />
                  Nettoyer (auto)
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs & Bulk Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div className="flex bg-muted p-1 rounded-lg">
            <Button
              variant={!isArchived ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setIsArchived(false)}
              className="text-sm"
            >
              Tâches actives
            </Button>
            <Button
              variant={isArchived ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setIsArchived(true)}
              className="text-sm gap-2"
            >
              <Archive className="w-3 h-3" />
              Archives
            </Button>
          </div>

          {selectedTasks.length > 0 && (
            <div className="flex items-center gap-2 bg-primary/10 p-1 rounded-md px-3 animate-in fade-in zoom-in-95">
              <span className="text-sm font-medium text-primary mr-2">{selectedTasks.length} sélectionné(s)</span>
              {!isArchived && (
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => handleBulkAction('archive')}>
                  <Archive className="w-3 h-3" />
                  Archiver
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-8 gap-1 border-destructive/20 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleBulkAction('delete')}>
                <Trash2 className="w-3 h-3" />
                Supprimer
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={filteredTasks.length > 0 && selectedTasks.length === filteredTasks.length}
              onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
            />
            <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer select-none">
              Tout sélectionner
            </label>
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
          <div className="space-y-3 md:space-y-4 pb-20 md:pb-6">
            {filteredTasks.map((task) => {
              const Icon = typeIcons[task.type as keyof typeof typeIcons] || Clock;
              return (
                <div
                  key={task.id}
                  className="bg-card p-3 md:p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-all animate-fade-in relative group active:scale-[0.99]"
                >
                  <div className="absolute top-3 right-3 md:top-4 md:right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity data-[selected=true]:opacity-100" data-selected={selectedTasks.includes(task.id)}>
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={(checked) => handleSelectTask(task.id, checked as boolean)}
                    />
                  </div>
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="mt-1 flex flex-col gap-2">
                      <Checkbox
                        checked={selectedTasks.includes(task.id)}
                        onCheckedChange={(checked) => handleSelectTask(task.id, checked as boolean)}
                        className="md:hidden"
                      />
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm md:text-base pr-6 truncate">{task.title}</h3>
                          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mt-0.5">{task.description}</p>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2">
                          <Badge className={cn("text-[10px] md:text-xs px-1.5 py-0 md:px-2 md:py-0.5 whitespace-nowrap", getStatusColor(task.status))}>
                            <span className="hidden sm:inline">{getStatusLabel(task.status)}</span>
                            <span className="sm:hidden">
                              {task.status === 'completed' ? '✓' :
                                task.status === 'in_progress' ? '⏳' :
                                  task.status === 'in_delivery' ? '🚚' : '✕'}
                            </span>
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
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
                              <DropdownMenuItem onClick={() => handleUpdateStatus(task.id, 'cancelled')}>
                                Marquer annulée
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive font-bold"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-3 text-[10px] md:text-sm text-muted-foreground pt-3 border-t border-border/50">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                          {formatDate(task.date)}
                        </span>
                        {task.assignedToName && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="max-w-[80px] md:max-w-none truncate">{task.assignedToName}</span>
                          </span>
                        )}
                        <Badge variant="outline" className="text-[10px] h-5">{getTaskTypeLabel(task.type)}</Badge>

                        {task.sellingPrice && (
                          <span className="text-success font-bold">{task.sellingPrice.toLocaleString()} FCFA</span>
                        )}

                        {task.productImei && (
                          <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono">
                            IMEI: {task.productImei}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
