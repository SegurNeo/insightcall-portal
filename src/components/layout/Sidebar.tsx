import { useLocation, Link } from 'react-router-dom';
import { cn } from "@/lib/utils";
import NogalLogo from '../branding/NogalLogo';
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  BarChart3, 
  ChevronDown,
  ChevronLeft, 
  ChevronRight, 
  ChevronUp,
  CreditCard, 
  FileText, 
  FolderClosed, 
  Home, 
  Lock,
  Phone, 
  PhoneCall, 
  Search, 
  Settings,
  ShoppingCart,
  FlaskConical,
  Workflow,
  Ticket
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
}

interface SidebarCategory {
  name: string;
  icon: React.ElementType;
  path?: string;
  items?: {
    name: string;
    icon: React.ElementType;
    path: string;
  }[];
  locked?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggleSidebar }) => {
  const location = useLocation();
  const [openCategories, setOpenCategories] = useState<string[]>(["Soporte"]);
  
  const toggleCategory = (category: string) => {
    setOpenCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const isOpen = (category: string) => openCategories.includes(category);
  
  const categories: SidebarCategory[] = [
    { 
      name: 'Soporte', 
      icon: PhoneCall,
      items: [
        { name: 'Llamadas', icon: PhoneCall, path: '/calls' },
        { name: 'Buscar', icon: Search, path: '/search' },
        { name: 'Transcripciones', icon: FileText, path: '/transcriptions' },
        { name: 'Analítica', icon: BarChart3, path: '/analytics' },
        { name: 'Acciones posteriores', icon: FolderClosed, path: '/actions' },
        { name: 'Números de teléfono', icon: Phone, path: '/phones' },
        { name: 'Tickets', icon: Ticket, path: '/tickets' },
        { name: 'Lab', icon: FlaskConical, path: '/lab' },
      ] 
    },
    { 
      name: 'Ventas', 
      icon: ShoppingCart,
      locked: true 
    },
    { 
      name: 'Operaciones', 
      icon: Workflow,
      locked: true 
    },
    { name: 'Ajustes', icon: Settings, path: '/settings' },
    { name: 'Facturación', icon: CreditCard, path: '/invoicing' },
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
          {!collapsed && <span className="font-semibold text-xl whitespace-nowrap">Insurcall<span className="text-blue-500">.</span></span>}
          {collapsed && <div className="h-8 w-8"></div>}
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("h-8 w-8", collapsed && "absolute -right-4 top-4 bg-background border border-border rounded-full")}
          onClick={toggleSidebar}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-2">
          <Link
            to="/"
            className={cn(
              "flex items-center py-3 px-3 rounded-md transition-all group hover:bg-accent",
              location.pathname === "/" ? "bg-accent text-accent-foreground font-medium" : "text-foreground/70",
              collapsed ? "justify-center" : ""
            )}
          >
            <Home className={cn("h-5 w-5 flex-shrink-0", location.pathname === "/" ? "text-primary" : "text-muted-foreground")} />
            {!collapsed && (
              <span className="ml-3 transition-opacity">Inicio</span>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 rounded bg-popover p-2 shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                Inicio
              </div>
            )}
          </Link>

          {categories.map((category) => {
            if (category.items) {
              // Category with subitems
              return (
                <div key={category.name} className="space-y-1">
                  {!collapsed ? (
                    <Collapsible open={isOpen(category.name)}>
                      <CollapsibleTrigger asChild>
                        <button
                          onClick={() => toggleCategory(category.name)}
                          className={cn(
                            "w-full flex items-center justify-between py-3 px-3 rounded-md transition-all hover:bg-accent",
                            "text-foreground/70"
                          )}
                        >
                          <div className="flex items-center">
                            <category.icon className="h-5 w-5 text-muted-foreground" />
                            <span className="ml-3">{category.name}</span>
                          </div>
                          {isOpen(category.name) ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-6 mt-1 space-y-1">
                          {category.items.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                              <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                  "flex items-center py-2 px-2 rounded-md transition-all hover:bg-accent",
                                  isActive ? "bg-accent text-accent-foreground font-medium" : "text-foreground/70"
                                )}
                              >
                                <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                                <span className="ml-3 transition-opacity">{item.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <div className="relative group">
                      <button
                        className="flex justify-center items-center py-3 px-3 rounded-md transition-all w-full hover:bg-accent"
                        onClick={() => !collapsed && toggleCategory(category.name)}
                      >
                        <category.icon className="h-5 w-5 text-muted-foreground" />
                      </button>
                      <div className="absolute left-full top-0 ml-2 rounded bg-popover p-2 shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                        {category.name}
                      </div>
                    </div>
                  )}
                </div>
              );
            } else if (category.locked) {
              // Locked category
              return (
                <div key={category.name} className="relative group">
                  <div
                    className={cn(
                      "flex items-center py-3 px-3 rounded-md transition-all cursor-not-allowed opacity-60",
                      collapsed ? "justify-center" : ""
                    )}
                  >
                    <category.icon className="h-5 w-5 text-muted-foreground" />
                    {!collapsed && (
                      <span className="ml-3 flex items-center gap-2">
                        {category.name}
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      </span>
                    )}
                  </div>
                  {collapsed && (
                    <div className="absolute left-full ml-2 rounded bg-popover p-2 shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 flex items-center gap-2">
                      {category.name}
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            } else {
              // Regular link
              const isActive = location.pathname === category.path;
              return (
                <Link
                  key={category.path}
                  to={category.path || '#'}
                  className={cn(
                    "flex items-center py-3 px-3 rounded-md transition-all group hover:bg-accent",
                    isActive ? "bg-accent text-accent-foreground font-medium" : "text-foreground/70",
                    collapsed ? "justify-center" : ""
                  )}
                >
                  <category.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                  {!collapsed && (
                    <span className="ml-3 transition-opacity">{category.name}</span>
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-2 rounded bg-popover p-2 shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      {category.name}
                    </div>
                  )}
                </Link>
              );
            }
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
              <p className="text-sm font-medium truncate">Insurcall Admin</p>
              <p className="text-xs text-muted-foreground truncate">admin@insurcall.es</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
