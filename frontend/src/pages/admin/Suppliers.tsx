import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/loader';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import type { Supplier, SupplierInput } from '@/types';
import { formatDate, suppliersApi } from '@/services/api';

export default function Suppliers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [supplierList, setSupplierList] = useState<Supplier[]>([]);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const data = await suppliersApi.getAll();
      // Handle potential field mismatch if backend returns created_at
      const mappedData = data.map((item: any) => ({
        ...item,
        createdAt: item.createdAt || item.created_at || new Date().toISOString(),
      }));
      setSupplierList(mappedData);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      toast.error('Erreur lors du chargement des fournisseurs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filteredSuppliers = supplierList.filter(supplier =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.phone.includes(searchQuery)
  );

  const handleAddSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const payload: SupplierInput = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: (formData.get('email') as string) || undefined,
      address: (formData.get('address') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined,
    };

    try {
      await suppliersApi.create(payload);
      toast.success('Fournisseur ajouté avec succès');
      setIsAddDialogOpen(false);
      fetchSuppliers();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'ajout du fournisseur");
    }
  };


  const handleEditSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSupplier) return;

    const formData = new FormData(e.currentTarget);
    const payload: Partial<Supplier> = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string || undefined,
      address: formData.get('address') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    };

    try {
      await suppliersApi.update(editingSupplier.id, payload);
      toast.success('Fournisseur modifié avec succès');
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la modification du fournisseur");
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) return;

    try {
      await suppliersApi.delete(id);
      toast.success('Fournisseur supprimé');
      fetchSuppliers();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression du fournisseur");
    }
  };

  const SupplierForm = ({ supplier, onSubmit }: { supplier?: Supplier; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void }) => (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nom du fournisseur *</Label>
          <Input id="name" name="name" defaultValue={supplier?.name} placeholder="Apple Store Cotonou" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Téléphone *</Label>
          <Input id="phone" name="phone" defaultValue={supplier?.phone} placeholder="+229 97 00 00 00" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email (optionnel)</Label>
          <Input id="email" name="email" type="email" defaultValue={supplier?.email} placeholder="contact@fournisseur.com" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="address">Adresse (optionnel)</Label>
          <Input id="address" name="address" defaultValue={supplier?.address} placeholder="Cotonou, Bénin" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes (optionnel)</Label>
          <Textarea id="notes" name="notes" defaultValue={supplier?.notes} placeholder="Informations supplémentaires..." />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => supplier ? setEditingSupplier(null) : setIsAddDialogOpen(false)}>
          Annuler
        </Button>
        <Button type="submit">{supplier ? 'Modifier' : 'Ajouter'}</Button>
      </DialogFooter>
    </form>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up">
          <div>
            <h1 className="text-2xl font-bold">Gestion des fournisseurs</h1>
            <p className="text-muted-foreground">Gérez vos fournisseurs de produits</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 gradient-primary">
                <Plus className="w-4 h-4" />
                Ajouter un fournisseur
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Nouveau fournisseur</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouveau fournisseur à votre liste.
                </DialogDescription>
              </DialogHeader>
              <SupplierForm onSubmit={handleAddSupplier} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Card */}
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total fournisseurs</p>
              <p className="text-2xl font-bold">{supplierList.length}</p>
            </div>
            {isLoading && <span className="loading loading-spinner loading-sm"></span>}
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un fournisseur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Suppliers Table */}
        {isLoading ? (
          <PageLoader />
        ) : supplierList.length === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Aucun fournisseur</h3>
            <p className="text-muted-foreground mb-4">Commencez par ajouter votre premier fournisseur.</p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Ajouter un fournisseur
            </Button>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-fade-in">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Ajouté le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          {supplier.phone}
                        </div>
                        {supplier.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {supplier.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.address ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          {supplier.address}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.notes ? (
                        <span className="text-sm text-muted-foreground line-clamp-1">{supplier.notes}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{formatDate(supplier.createdAt)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingSupplier(supplier)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSupplier(supplier.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingSupplier} onOpenChange={(open) => !open && setEditingSupplier(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Modifier le fournisseur</DialogTitle>
              <DialogDescription>
                Modifiez les informations du fournisseur.
              </DialogDescription>
            </DialogHeader>
            {editingSupplier && <SupplierForm supplier={editingSupplier} onSubmit={handleEditSupplier} />}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
