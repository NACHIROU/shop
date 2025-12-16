import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { Collaborator } from '@/types';
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
import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Clock,
  User,
  MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Placeholder for API data
const initialCollaborators: Collaborator[] = [];

export default function Collaborators() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [collaboratorList, setCollaboratorList] = useState<Collaborator[]>(initialCollaborators);

  const filteredCollaborators = collaboratorList.filter(collab =>
    collab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collab.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCollaborator = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCollab: Collaborator = {
      id: String(Date.now()),
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      role: formData.get('role') as string,
      tasksCompleted: 0,
      tasksInProgress: 0,
      joinedAt: new Date().toISOString().split('T')[0],
    };
    setCollaboratorList([...collaboratorList, newCollab]);
    setIsAddDialogOpen(false);
    toast.success('Collaborateur ajouté avec succès');
  };

  const handleRemoveCollaborator = (id: string) => {
    setCollaboratorList(collaboratorList.filter(c => c.id !== id));
    toast.success('Collaborateur supprimé');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="text-2xl font-bold">Gestion des collaborateurs</h1>
            <p className="text-muted-foreground">Gérez votre équipe et suivez leurs performances</p>
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
                  <DialogDescription>Ajoutez un nouveau membre à votre équipe.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input id="name" name="name" placeholder="Jean Dupont" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="jean@iphoneshop.bj" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" name="phone" placeholder="+229 97 00 00 00" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Rôle</Label>
                    <Input id="role" name="role" placeholder="Vendeur, Livreur..." required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
                  <Button type="submit">Ajouter</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">Total collaborateurs</p>
            <p className="text-2xl font-bold">{collaboratorList.length}</p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">Tâches terminées</p>
            <p className="text-2xl font-bold text-success">{collaboratorList.reduce((acc, c) => acc + c.tasksCompleted, 0)}</p>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">Tâches en cours</p>
            <p className="text-2xl font-bold text-info">{collaboratorList.reduce((acc, c) => acc + c.tasksInProgress, 0)}</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input type="search" placeholder="Rechercher un collaborateur..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        {collaboratorList.length === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Aucun collaborateur</h3>
            <p className="text-muted-foreground mb-4">Commencez par ajouter votre premier collaborateur.</p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2"><Plus className="w-4 h-4" />Ajouter</Button>
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
                      <Badge variant="secondary">{collab.role}</Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Modifier</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleRemoveCollaborator(collab.id)}>Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4" /><span>{collab.email}</span></div>
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span>{collab.phone}</span></div>
                </div>
                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-success"><CheckCircle2 className="w-4 h-4" /><span className="font-medium">{collab.tasksCompleted}</span><span className="text-xs text-muted-foreground">terminées</span></div>
                  <div className="flex items-center gap-2 text-info"><Clock className="w-4 h-4" /><span className="font-medium">{collab.tasksInProgress}</span><span className="text-xs text-muted-foreground">en cours</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
