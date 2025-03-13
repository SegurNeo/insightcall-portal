
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, CreditCard, FileStack, Home, MessageSquare, PhoneCall, Phone, Settings, UserCog } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import NogalLogo from '../branding/NogalLogo';

const Sidebar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  
  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  const navItems = [
    { name: 'Panel Principal', icon: Home, path: '/' },
    { name: 'Llamadas', icon: PhoneCall, path: '/calls' },
    { name: 'Transcripciones', icon: FileStack, path: '/transcriptions' },
    { name: 'Analytics', icon: BarChart3, path: '/analytics' },
    { name: 'Números', icon: Phone, path: '/phones' },
    { name: 'Facturación', icon: CreditCard, path: '/invoicing' },
    { name: 'Configuración', icon: Settings, path: '/settings' },
  ];

  return (
    <div 
      className={cn(
        "fixed h-screen bg-background border-r border-border z-40 flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-[70px]" : "w-[240px]"
      )}
    >
      <div className="p-4 flex items-center justify-between border-b">
        <div className={cn("overflow-hidden flex items-center", collapsed ? "justify-center w-full" : "")}>
          <NogalLogo className={cn("h-8 w-8 text-nogal-500", collapsed ? "mx-auto" : "mr-2")} />
          {!collapsed && <span className="font-semibold text-lg whitespace-nowrap">Nogal Seguros</span>}
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("h-8 w-8", collapsed && "absolute -right-4 top-4 bg-background border border-border rounded-full")}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center py-3 px-3 rounded-md transition-all group hover:bg-accent",
                  isActive ? "bg-accent text-accent-foreground font-medium" : "text-foreground/70",
                  collapsed ? "justify-center" : ""
                )}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                {!collapsed && (
                  <span className="ml-3 transition-opacity">{item.name}</span>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 rounded bg-popover p-2 shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t">
        <div className={cn(
          "flex items-center",
          collapsed ? "justify-center" : "space-x-3"
        )}>
          <div className="h-8 w-8 rounded-full bg-nogal-100 flex items-center justify-center text-nogal-700 font-semibold">
            NS
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">Nogal Admin</p>
              <p className="text-xs text-muted-foreground truncate">admin@nogalseguros.es</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
