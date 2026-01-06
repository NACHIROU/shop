import { ReactNode, useState } from 'react';
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

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 md:hidden"
      >
        <Menu className="w-6 h-6" />
      </Button>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden w-full">
        <Header />
        <main className={cn(
          "flex-1 overflow-auto p-4 md:p-6 transition-all duration-300",
          "pb-20 md:pb-6" // Extra padding for BottomNav on mobile
        )}>
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
