import { useLocation, Link } from 'react-router-dom';
import { cn } from "@/lib/utils";
import NogalLogo from '../branding/NogalLogo';
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  ChevronLeft, 
  ChevronRight, 
  CreditCard, 
  FileText, 
  Home, 
  Phone, 
  PhoneCall, 
  Search, 
  Settings,
  FlaskConical,
  Ticket,
  MessageSquare
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

interface SidebarItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggleSidebar }) => {
  const location = useLocation();
  
  const navigationItems: SidebarItem[] = [
    { name: 'Resumen', icon: Home, path: '/' },
    { name: 'Llamadas', icon: PhoneCall, path: '/calls' },
    { name: 'Buscar', icon: Search, path: '/search' },
    { name: 'Transcripciones', icon: FileText, path: '/transcriptions' },
    { name: 'Analítica', icon: BarChart3, path: '/analytics' },
    { name: 'Tickets', icon: Ticket, path: '/tickets' },
    { name: 'Números', icon: Phone, path: '/phones' },
    { name: 'Lab', icon: FlaskConical, path: '/lab' },
  ];

  const bottomItems: SidebarItem[] = [
    { name: 'Configuración', icon: Settings, path: '/settings' },
    { name: 'Facturación', icon: CreditCard, path: '/invoicing' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-background border-r border-border/50 transition-all duration-300 z-50",
      collapsed ? "w-[70px]" : "w-[240px]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <div className={cn("flex items-center", collapsed && "justify-center")}>
          <NogalLogo className="h-8 w-8 text-foreground" />
          {!collapsed && (
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-foreground">Nogal</h1>
              <p className="text-xs text-muted-foreground">InsightCall</p>
            </div>
          )}
        </div>
        
        {!collapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-1 h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Botón de expandir cuando está colapsado */}
      {collapsed && (
        <div className="p-4 border-b border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-full p-2 h-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Navegación principal */}
      <nav className="flex-1 px-3 py-6">
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                "hover:bg-muted/50 hover:text-foreground",
                isActive(item.path) 
                  ? "bg-muted text-foreground" 
                  : "text-muted-foreground",
                collapsed && "justify-center"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <span className="ml-3 font-light">{item.name}</span>
              )}
              {!collapsed && item.badge && (
                <span className="ml-auto bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Navegación inferior */}
      <div className="px-3 py-6 border-t border-border/50">
        <div className="space-y-1">
          {bottomItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                "hover:bg-muted/50 hover:text-foreground",
                isActive(item.path) 
                  ? "bg-muted text-foreground" 
                  : "text-muted-foreground",
                collapsed && "justify-center"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <span className="ml-3 font-light">{item.name}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
