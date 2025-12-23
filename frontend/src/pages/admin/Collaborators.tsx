import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
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
import { Label } from '@/components/ui/label';
import { Plus, Search, Mail, Phone, MoreVertical, User, CheckCircle2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/services/api';
import type { Collaborator } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageLoader } from '@/components/ui/loader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { useConfirmation } from '@/hooks/useConfirmation';

export default function Collaborators() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
  const { confirm, isOpen: isConfirmOpen, options: confirmOptions, close: closeConfirm, handleConfirm } = useConfirmation();

  const { data: collaborators = [], isLoading: loading } = useQuery({
    queryKey: ['collaborators'],
    queryFn: async () => {
      const data = await authApi.getCollaborators();
      return data.map((c: any) => ({
        ...c,
        role: c.role || 'collaborator',
        joinedAt: c.joined_at || c.joinedAt,
        tasksCompleted: c.tasks_completed || c.tasksCompleted || 0,
        tasksInProgress: c.tasks_in_progress || c.tasksInProgress || 0,
        isActive: c.is_active !== undefined ? c.is_active : true
      }));
    }
  });

  const addCollaboratorMutation = useMutation({
    mutationFn: (data: any) => authApi.createCollaborator(data),
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ['collaborators'] });
      toast.success('Collaborateur créé avec succès');
      setIsAddDialogOpen(false);

      try {
        const inviteData = await authApi.generateInviteLink(response.id);
        setInviteLink(inviteData.invite_url);
        setShowInviteDialog(true);
      } catch (error) {
        console.error('Erreur génération lien:', error);
        toast.error('Collaborateur créé mais erreur lors de la génération du lien');
      }
    },
    onError: (error: any) => {
      const message = error.message.includes('API Error')
        ? error.message.split(' - ')[1]
        : "Erreur lors de l'ajout du collaborateur";
      toast.error(message);
    }
  });

  const updateCollaboratorMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Collaborator> }) => authApi.updateCollaborator(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators'] });
      toast.success('Collaborateur modifié avec succès');
      setEditingCollaborator(null);
    },
    onError: () => toast.error("Erreur lors de la modification du collaborateur")
  });

  const deleteCollaboratorMutation = useMutation({
    mutationFn: (id: string) => authApi.deleteCollaborator(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators'] });
      toast.success('Collaborateur supprimé avec succès');
    },
    onError: () => toast.error('Erreur lors de la suppression')
  });

  const filteredCollaborators = collaborators
    .filter(collab =>
      collab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collab.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => (b.tasksCompleted || 0) - (a.tasksCompleted || 0));

  const handleAddCollaborator = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addCollaboratorMutation.mutate({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      role: 'collaborator',
    });
  };

  const handleEditCollaborator = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCollaborator) return;
    const formData = new FormData(e.currentTarget);
    updateCollaboratorMutation.mutate({
      id: editingCollaborator.id,
      data: {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
      }
    });
  };

  const handleDeleteCollaborator = async (id: string) => {
    confirm({
      title: 'Supprimer le collaborateur',
      message: 'Voulez-vous vraiment supprimer ce collaborateur ? Cette action est irréversible.',
      variant: 'danger',
      confirmText: 'Supprimer',
      onConfirm: () => deleteCollaboratorMutation.mutate(id)
    });
  };

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="text-2xl font-bold">Collaborateurs</h1>
            <p className="text-muted-foreground">Gérez l'accès à votre espace de travail</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 gradient-primary">
                <Plus className="w-4 h-4" />
                Ajouter un collaborateur
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAddCollaborator}>
                <DialogHeader>
                  <DialogTitle>Nouveau collaborateur</DialogTitle>
                  <DialogDescription>
                    Créez un compte pour un nouveau membre de l'équipe.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input id="name" name="name" placeholder="Jean Dupont" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="jean@exemple.com" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="+229 97 00 00 00" />
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    ℹ️ Un lien d'invitation sera généré pour permettre au collaborateur de créer son mot de passe
                  </p>
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

        {/* Invite Link Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Lien d'invitation généré</DialogTitle>
              <DialogDescription>
                Partagez ce lien avec le collaborateur pour qu'il active son compte
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <code className="flex-1 text-sm break-all">{inviteLink}</code>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={copyInviteLink}
                >
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                ⏰ Ce lien est valide pendant 7 jours
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowInviteDialog(false)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">Total collaborateurs</p>
            <p className="text-2xl font-bold">{collaborators.length}</p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">Tâches terminées</p>
            <p className="text-2xl font-bold text-success">{collaborators.reduce((acc, c) => acc + (c.tasksCompleted || 0), 0)}</p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">Tâches en cours</p>
            <p className="text-2xl font-bold text-info">{collaborators.reduce((acc, c) => acc + (c.tasksInProgress || 0), 0)}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un collaborateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Collaborators List */}
        {loading ? (
          <PageLoader />
        ) : collaborators.length === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Aucun collaborateur</h3>
            <p className="text-muted-foreground mb-4">Commencez par ajouter votre premier collaborateur.</p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Ajouter un collaborateur
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCollaborators.map((collab) => (
              <div key={collab.id} className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all animate-fade-in">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                      <User className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{collab.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{collab.role}</Badge>
                        {!collab.isActive && (
                          <Badge variant="destructive">Inactif</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingCollaborator(collab)}>Modifier</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        disabled={collab.role === 'admin'}
                        onClick={() => handleDeleteCollaborator(collab.id)}
                      >
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4" /><span>{collab.email}</span></div>
                  {collab.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span>{collab.phone}</span></div>}
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">{collab.tasksCompleted || 0}</span>
                    <span className="text-xs text-muted-foreground">terminées</span>
                  </div>
                  <div className="flex items-center gap-2 text-info">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">{collab.tasksInProgress || 0}</span>
                    <span className="text-xs text-muted-foreground">en cours</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingCollaborator} onOpenChange={(open) => !open && setEditingCollaborator(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleEditCollaborator}>
              <DialogHeader>
                <DialogTitle>Modifier le collaborateur</DialogTitle>
                <DialogDescription>
                  Modifiez les informations du collaborateur.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nom complet</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingCollaborator?.name}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={editingCollaborator?.email}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Téléphone</Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    type="tel"
                    defaultValue={editingCollaborator?.phone}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingCollaborator(null)}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

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
    </DashboardLayout >
  );
}
