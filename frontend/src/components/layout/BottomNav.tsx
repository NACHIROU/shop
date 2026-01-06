import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    Package,
    ClipboardList,
    Users,
    Receipt,
    Store,
    ScrollText
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
    const { role } = useAuth();

    const adminNavItems = [
        { title: 'Dashboard', url: '/', icon: LayoutDashboard },
        { title: 'Produits', url: '/products', icon: Package },
        { title: 'Tâches', url: '/tasks', icon: ClipboardList },
        { title: 'Dépenses', url: '/expenses', icon: Receipt },
        { title: 'Équipe', url: '/collaborators', icon: Users },
    ];

    const superadminNavItems = [
        { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
        { title: 'Marchands', url: '/merchants', icon: Store },
        { title: 'Logs', url: '/logs', icon: ScrollText },
    ];

    const collaboratorNavItems = [
        { title: 'Dashboard', url: '/', icon: LayoutDashboard },
        { title: 'Produits', url: '/products', icon: Package },
        { title: 'Tâches', url: '/tasks', icon: ClipboardList },
    ];

    const navItems = role === 'superadmin' ? superadminNavItems : (role === 'admin' ? adminNavItems : collaboratorNavItems);

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border animate-slide-up">
            <nav className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.url}
                        to={item.url}
                        end={item.url === '/'}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 w-full h-full text-xs font-medium transition-colors",
                            "text-muted-foreground hover:text-foreground"
                        )}
                        activeClassName="text-primary"
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="truncate max-w-[64px]">{item.title}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
