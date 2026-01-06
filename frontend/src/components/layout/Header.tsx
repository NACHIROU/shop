import { Bell, Search, User, LogOut, CheckCheck, Eye, EyeOff, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDate } from '@/services/api';

export function Header() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { isPrivate, togglePrivacy } = usePrivacy();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="h-16 bg-card border-b border-border px-4 md:px-6 flex items-center justify-between md:justify-end sticky top-0 z-10 w-full">
      {/* Brand logo for mobile (hidden on desktop where sidebar is visible) */}
      <div className="flex items-center gap-2 md:hidden ml-12">
        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-sm border border-border/50">
          <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Privacy Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePrivacy}
          className="h-9 w-9 text-muted-foreground hover:text-primary"
          title={isPrivate ? "Afficher les prix d'achat" : "Masquer les prix d'achat"}
        >
          {isPrivate ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[320px] p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                  onClick={(e) => {
                    e.preventDefault();
                    markAllAsRead();
                  }}
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Tout marquer comme lu
                </Button>
              )}
            </div>
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Aucune notification
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex flex-col gap-1 p-4 border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                      onClick={() => !n.is_read && markAsRead(n.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-sm font-medium ${!n.is_read ? 'text-primary' : ''}`}>
                          {n.title}
                        </span>
                        {!n.is_read && <Badge className="h-1.5 w-1.5 p-0 rounded-full bg-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground mt-1 text-right">
                        {formatDate(n.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm hidden sm:inline-block">{user?.name || 'Utilisateur'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Mon profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

