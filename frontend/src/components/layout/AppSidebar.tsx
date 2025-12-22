import {
  LayoutDashboard,
  Package,
  Users,
  ClipboardList,
  LogOut,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Truck,
  Receipt,
  BarChart,
  Store,
  ScrollText
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const adminNavItems = [
  { title: 'Tableau de bord', url: '/', icon: LayoutDashboard },
  { title: 'Produits', url: '/products', icon: Package },
  { title: 'Fournisseurs', url: '/suppliers', icon: Truck },
  { title: 'Collaborateurs', url: '/collaborators', icon: Users },
  { title: 'Tâches', url: '/tasks', icon: ClipboardList },
  { title: 'Dépenses', url: '/expenses', icon: Receipt },
  { title: 'Rapports', url: '/reports', icon: BarChart },
];

const superadminNavItems = [
  {
    title: "Tableau de Bord",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Gestion Marchands",
    url: "/merchants",
    icon: Store,
  },
  {
    title: "Historique (Logs)",
    url: "/logs",
    icon: ScrollText,
  },
];

const collaboratorNavItems = [
  { title: 'Mon tableau de bord', url: '/', icon: LayoutDashboard },
  { title: 'Produits', url: '/products', icon: Package },
  { title: 'Mes tâches', url: '/tasks', icon: ClipboardList },
];

export function AppSidebar() {
  const { role, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = role === 'superadmin' ? superadminNavItems : (role === 'admin' ? adminNavItems : collaboratorNavItems);

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Smartphone className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-bold text-lg text-primary">EasyManaging</h1>
              <p className="text-xs text-sidebar-foreground/60">Gestion Intelligente</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === '/'}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              collapsed && "justify-center px-2"
            )}
            activeClassName="bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "px-2"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span>Réduire</span>
            </>
          )}
        </Button>
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={logout}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-all duration-200",
            "text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
