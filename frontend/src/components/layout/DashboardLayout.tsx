import { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(true)}
        className="absolute top-3.5 left-4 z-30 md:hidden"
      >
        <Menu className="w-6 h-6" />
      </Button>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden w-full">
        <Header />
        <main className={cn(
          "flex-1 overflow-auto p-4 md:p-6 transition-all duration-300",
          "pb-20 md:pb-6", // Extra padding for BottomNav on mobile
          isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        )}>
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
