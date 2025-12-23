import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UserPlus, Power, Store, Mail, Phone, Calendar, LockKeyhole, RefreshCcw, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function MerchantManagement() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
    });

    const { data: merchants = [], isLoading } = useQuery({
        queryKey: ['merchants'],
        queryFn: authApi.getMerchants,
    });

    const [inviteLink, setInviteLink] = useState('');
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

    const generateLinkMutation = useMutation({
        mutationFn: authApi.generateMerchantInviteLink,
        onSuccess: (data) => {
            setInviteLink(data.invite_url);
            setInviteDialogOpen(true);
            toast.success('Lien d\'invitation généré');
        },
        onError: (error: any) => {
            toast.error('Erreur lors de la génération du lien: ' + error.message);
        }
    });

    const createMerchantMutation = useMutation({
        mutationFn: authApi.createMerchant,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['merchants'] });
            setIsDialogOpen(false);
            setFormData({ name: '', email: '', phone: '' });
            // Auto generate invite link
            generateLinkMutation.mutate(data.id);
        },
        onError: (error: any) => {
            toast.error('Erreur lors de la création: ' + error.message);
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: authApi.toggleUserStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['merchants'] });
            toast.success('Statut mis à jour');
        },
    });

    const resetPasswordMutation = useMutation({
        mutationFn: authApi.resetUserPassword,
        onSuccess: () => {
            toast.success('Réinitialisation demandée. L\'utilisateur devra changer son mot de passe.');
        },
        onError: (error: any) => {
            toast.error('Erreur: ' + error.message);
        }
    });

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        toast.success('Lien copié !');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMerchantMutation.mutate(formData);
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Gestion des Marchands</h1>
                        <p className="text-muted-foreground">Pilotez les boutiques et propriétaires sur la plateforme</p>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gradient-primary shadow-glow">
                                <UserPlus className="mr-2 h-4 w-4" /> Ajouter un Marchand
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Nouveau Marchand</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nom de la Boutique / Propriétaire</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="ex: iPhone Shop Benin"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="marchand@example.bj"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Téléphone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="ex: 0167581898"
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full gradient-primary" disabled={createMerchantMutation.isPending}>
                                    {createMerchantMutation.isPending ? 'Création...' : 'Créer le compte'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Invite Link Dialog */}
                    <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Lien d'activation généré</DialogTitle>
                            </DialogHeader>
                            <div className="flex items-center space-x-2">
                                <div className="grid flex-1 gap-2">
                                    <Label htmlFor="link" className="sr-only">
                                        Lien
                                    </Label>
                                    <Input
                                        id="link"
                                        defaultValue={inviteLink}
                                        readOnly
                                    />
                                </div>
                                <Button type="submit" size="sm" className="px-3" onClick={copyToClipboard}>
                                    <span className="sr-only">Copier</span>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Envoyez ce lien au marchand pour qu'il active son compte et définisse son mot de passe.
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <p>Chargement des marchands...</p>
                    ) : merchants.map((merchant: any) => (
                        <Card key={merchant.id} className="overflow-hidden border-none shadow-premium hover:shadow-glow transition-all duration-300">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Store className="h-6 w-6 text-primary" />
                                    </div>
                                    <Button
                                        variant={merchant.is_active ? "ghost" : "destructive"}
                                        size="icon"
                                        className="rounded-full"
                                        onClick={() => toggleStatusMutation.mutate(merchant.id)}
                                    >
                                        <Power className="h-4 w-4" />
                                    </Button>
                                </div>
                                <CardTitle className="mt-4 text-xl">{merchant.name}</CardTitle>
                                <div className={`mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${merchant.is_active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                                    {merchant.is_active ? 'Actif' : 'Suspendu'}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{merchant.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{merchant.phone}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>Inscrit le {format(new Date(merchant.created_at), 'dd MMMM yyyy', { locale: fr })}</span>
                                </div>

                                <div className="pt-4 border-t flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-muted-foreground uppercase">Actions</span>
                                        <span className="text-xs bg-muted px-2 py-1 rounded font-mono">MARCHAND</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 text-xs gap-2"
                                            onClick={() => resetPasswordMutation.mutate(merchant.id)}
                                            disabled={resetPasswordMutation.isPending}
                                        >
                                            <LockKeyhole className="h-3 w-3" /> Réinitialiser
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 text-xs gap-2"
                                            onClick={() => generateLinkMutation.mutate(merchant.id)}
                                            disabled={generateLinkMutation.isPending}
                                        >
                                            <RefreshCcw className="h-3 w-3" /> Lien
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
