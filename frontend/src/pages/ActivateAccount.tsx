import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { authApi } from '@/services/api';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function ActivateAccount() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (!token) {
            toast.error('Lien d\'invitation invalide');
            navigate('/login');
            return;
        }

        // Verify token and get user info
        const verifyToken = async () => {
            try {
                const userData = await authApi.verifyInviteToken(token);
                setUserEmail(userData.email);
                setUserName(userData.name);
                setLoading(false);
            } catch (error) {
                console.error(error);
                toast.error('Lien d\'invitation invalide ou expiré');
                setTimeout(() => navigate('/login'), 2000);
            }
        };

        verifyToken();
    }, [token, navigate]);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }

        if (password.length < 6) {
            toast.error('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setVerifying(true);
        try {
            const response = await authApi.activateAccount(token!, password);

            // Store tokens
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
            localStorage.setItem('user', JSON.stringify(response.user));

            toast.success('Compte activé avec succès !');

            // Redirect to dashboard
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } catch (error: any) {
            console.error(error);
            const message = error.message.includes('API Error')
                ? error.message.split(' - ')[1]
                : 'Erreur lors de l\'activation du compte';
            toast.error(message);
        } finally {
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Vérification du lien...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Activez votre compte</CardTitle>
                    <CardDescription>
                        Bienvenue {userName} ! Créez votre mot de passe pour accéder à votre espace.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleActivate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={userEmail}
                                disabled
                                className="bg-muted"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Minimum 6 caractères"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Retapez votre mot de passe"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={verifying}
                        >
                            {verifying ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Activation en cours...
                                </>
                            ) : (
                                'Créer mon compte'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
