
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Search, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface HeaderProps {
  sidebarCollapsed: boolean;
  toggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarCollapsed, toggleSidebar }) => {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className={cn(
      "h-16 border-b border-border bg-background/95 backdrop-blur-sm fixed top-0 right-0 z-30 flex items-center justify-between px-4 transition-all duration-300",
      sidebarCollapsed ? "left-[70px]" : "left-[240px]"
    )}>
      <div className="flex items-center w-full max-w-md">
        <div className={cn(
          "relative flex items-center w-full transition-all", 
          searchFocused ? "w-96" : "w-64"
        )}>
          <Search className="h-4 w-4 absolute left-3 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar llamadas, transcripciones..."
            className="pl-9 bg-secondary/50 border-secondary focus:bg-background"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchFocused && (
            <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-background border border-border rounded-md shadow-lg slide-in">
              <div className="text-xs text-muted-foreground mb-2">Búsquedas recientes</div>
              <div className="space-y-1">
                <div className="px-2 py-1.5 hover:bg-secondary rounded-sm text-sm cursor-pointer">+34 911 234 567</div>
                <div className="px-2 py-1.5 hover:bg-secondary rounded-sm text-sm cursor-pointer">Llamada ID: CS12345</div>
                <div className="px-2 py-1.5 hover:bg-secondary rounded-sm text-sm cursor-pointer">Consulta: Seguro de hogar</div>
              </div>
              <div className="mt-2 pt-2 border-t border-border">
                <Button variant="link" size="sm" className="text-xs text-primary h-auto p-0">
                  Búsqueda avanzada
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <HelpCircle className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full"></span>
        </Button>
      </div>
    </header>
  );
};

export default Header;
