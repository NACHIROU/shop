import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, Lock, Save } from 'lucide-react';
import { PageLoader } from '@/components/ui/loader';
import { useTheme } from '@/contexts/ThemeContext';
import { Palette, Sun, Moon, Leaf, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Profile() {
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // TODO: Implement API call to update profile
            // await authApi.updateProfile(formData);
            toast.success('Profil mis à jour avec succès');
        } catch (error) {
            toast.error('Erreur lors de la mise à jour du profil');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setLoading(true);
        try {
            // TODO: Implement API call to change password
            // await authApi.changePassword({ new_password: passwordData.newPassword });
            toast.success('Mot de passe modifié avec succès');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error('Erreur lors du changement de mot de passe');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6 pb-6">
                {/* Header */}
                <div className="animate-slide-up">
                    <h1 className="text-2xl font-bold">Mon profil</h1>
                    <p className="text-muted-foreground">Gérez vos informations personnelles</p>
                </div>

                {/* Profile Information */}
                <Card className="animate-fade-in">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Informations personnelles
                        </CardTitle>
                        <CardDescription>
                            Mettez à jour vos informations de profil
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nom complet</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="pl-10"
                                            placeholder="Jean Dupont"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="pl-10"
                                            placeholder="jean@exemple.com"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Téléphone</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="pl-10"
                                            placeholder="+229 97 00 00 00"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Rôle</Label>
                                    <Input
                                        value={user?.role === 'admin' ? 'Administrateur' : 'Collaborateur'}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={loading} className="gap-2">
                                    <Save className="w-4 h-4" />
                                    Enregistrer les modifications
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Change Password */}
                <Card className="animate-fade-in">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            Changer le mot de passe
                        </CardTitle>
                        <CardDescription>
                            Assurez-vous que votre compte utilise un mot de passe fort
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={loading} variant="secondary" className="gap-2">
                                    <Lock className="w-4 h-4" />
                                    Changer le mot de passe
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Theme Selection */}
                <Card className="animate-fade-in border-none shadow-premium overflow-hidden">
                    <CardHeader className="bg-primary/5">
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="w-5 h-5 text-primary" />
                            Personnalisation du thème
                        </CardTitle>
                        <CardDescription>
                            Choisissez l'ambiance visuelle qui vous convient le mieux
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Default Theme */}
                            <button
                                onClick={() => setTheme('default')}
                                className={cn(
                                    "relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300",
                                    theme === 'default'
                                        ? "border-primary bg-primary/10 shadow-glow scale-105"
                                        : "border-muted hover:border-primary/50 bg-card"
                                )}
                            >
                                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white">
                                    <Sun className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <span className="font-bold block">Vibrant</span>
                                    <span className="text-xs text-muted-foreground italic">Défaut</span>
                                </div>
                                {theme === 'default' && <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />}
                            </button>

                            {/* Dark Theme */}
                            <button
                                onClick={() => setTheme('dark')}
                                className={cn(
                                    "relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300",
                                    theme === 'dark'
                                        ? "border-primary bg-primary/10 shadow-glow scale-105"
                                        : "border-muted hover:border-primary/50 bg-card"
                                )}
                            >
                                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white">
                                    <Moon className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <span className="font-bold block">Sombre</span>
                                    <span className="text-xs text-muted-foreground italic">Sleek Dark</span>
                                </div>
                                {theme === 'dark' && <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />}
                            </button>

                            {/* Natural Theme */}
                            <button
                                onClick={() => setTheme('natural')}
                                className={cn(
                                    "relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300",
                                    theme === 'natural'
                                        ? "border-primary bg-primary/10 shadow-glow scale-105"
                                        : "border-muted hover:border-primary/50 bg-card"
                                )}
                            >
                                <div className="w-12 h-12 rounded-full bg-[#4a3728] flex items-center justify-center text-white">
                                    <Leaf className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <span className="font-bold block">Naturel</span>
                                    <span className="text-xs text-muted-foreground italic">Beige & Marron</span>
                                </div>
                                {theme === 'natural' && <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />}
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Info */}
                <Card className="animate-fade-in">
                    <CardHeader>
                        <CardTitle>Informations du compte</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Statut du compte</span>
                            <span className="font-medium text-success">Actif</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Membre depuis</span>
                            <span className="font-medium">{new Date(user?.created_at || Date.now()).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Identifiant</span>
                            <span className="font-mono text-xs">{user?.id}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
