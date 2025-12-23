import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Tag, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { categoriesApi } from '@/services/api';
import { useConfirmation } from '@/hooks/useConfirmation';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { formatDate } from '@/services/api';

export default function Categories() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const { confirm, isOpen: isConfirmOpen, options: confirmOptions, close: closeConfirm, handleConfirm } = useConfirmation();

    // Fetch categories
    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoriesApi.getAll(),
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (data: { name: string }) => categoriesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Catégorie créée avec succès');
            setIsAddDialogOpen(false);
            setNewCategoryName('');
        },
        onError: (error) => {
            toast.error('Erreur lors de la création');
            console.error(error);
        }
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => categoriesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Catégorie supprimée');
        },
        onError: (error) => {
            toast.error('Erreur lors de la suppression');
            console.error(error);
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        createMutation.mutate({ name: newCategoryName });
    };

    const handleDelete = (id: string) => {
        confirm({
            title: 'Supprimer la catégorie',
            message: 'Êtes-vous sûr de vouloir supprimer cette catégorie ?',
            variant: 'danger',
            confirmText: 'Supprimer',
            onConfirm: () => deleteMutation.mutate(id)
        });
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-4">
                    <Button
                        variant="ghost"
                        className="w-fit pl-0 hover:pl-2 transition-all gap-2"
                        onClick={() => navigate('/products')}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour aux produits
                    </Button>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">Catégories</h1>
                            <p className="text-muted-foreground">Gérez les catégories de produits ({categories.length}/7)</p>
                        </div>

                        <Button
                            className="gap-2"
                            onClick={() => {
                                if (categories.length >= 7) {
                                    toast.error("Limite de 7 catégories atteinte. Supprimez-en une pour en ajouter.");
                                    return;
                                }
                                setIsAddDialogOpen(true);
                            }}
                            disabled={isLoading}
                        >
                            <Plus className="w-4 h-4" />
                            Nouvelle catégorie
                        </Button>

                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Ajouter une catégorie</DialogTitle>
                                    <DialogDescription>Créer une nouvelle catégorie pour vos produits.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nom</Label>
                                        <Input
                                            id="name"
                                            placeholder="Ex: Tablettes"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={createMutation.isPending}>
                                            {createMutation.isPending && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                                            Créer
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <Tag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>Aucune catégorie trouvée</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Date de création</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                        <TableCell>{formatDate(category.created_at)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(category.id)}
                                                disabled={deleteMutation.isPending}
                                            >
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>

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
        </DashboardLayout>
    );
}
