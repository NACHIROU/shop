import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { login, register, user, loading } = useAuth();
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', phone: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginData.email, loginData.password);
      // Actual redirection is often handled by AuthContext state change or useEffect here
      toast.success('Connexion réussie');
    } catch (error) {
      toast.error('Erreur de connexion');
      console.error(error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(registerData);
      toast.success('Inscription réussie');
    } catch (error) {
      toast.error('Erreur d\'inscription');
      console.error(error);
    }
  };

  useEffect(() => {
    if (user && user.must_change_password) {
      toast.info('Vous devez changer votre mot de passe pour continuer', { id: 'must-change-password' });
      navigate('/profile');
    }
  }, [user, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <Card className="w-full max-w-md shadow-2xl border-none backdrop-blur-sm bg-white/80">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600 mb-2">
            EasyManaging
          </CardTitle>
          <CardDescription className="text-base font-medium">Plateforme de Gestion de Commerce</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-8 p-3 rounded-lg bg-muted/50 text-center">
            <h2 className="font-semibold text-primary">Accès Sécurisé</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="login-email">Identifiant (Email ou Téléphone)</Label>
              <Input
                id="login-email"
                placeholder="admin@example.com ou 01..."
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Mot de passe</Label>
              <Input
                id="login-password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
                maxLength={72}
                className="h-12"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg font-semibold gradient-primary" disabled={loading}>
              {loading ? "Chargement..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}