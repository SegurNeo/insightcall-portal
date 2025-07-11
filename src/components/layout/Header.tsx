
import React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Bell, 
  Settings, 
  Menu,
  User,
  Activity
} from "lucide-react";

interface HeaderProps {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarCollapsed, toggleSidebar }) => {
  return (
    <header className={cn(
      "fixed top-0 right-0 h-16 bg-background/80 backdrop-blur-sm border-b border-border/50 z-40 transition-all duration-300",
      sidebarCollapsed ? "left-[70px]" : "left-[240px]"
    )}>
      <div className="flex items-center justify-between h-full px-6">
        
        {/* Left side - Search */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="md:hidden p-2 h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar llamadas, transcripciones..."
              className="pl-10 w-80 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-border placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* Right side - Status and Actions */}
        <div className="flex items-center space-x-4">
          
          {/* Status indicator */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700">
            <Activity className="h-3 w-3" />
            <span className="text-xs font-medium">Sistema activo</span>
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2 h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white">
              3
            </Badge>
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            className="p-2 h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* User profile */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <User className="h-4 w-4" />
            </Button>
            
            <div className="hidden md:block">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">Admin</p>
                <p className="text-xs text-muted-foreground">admin@nogal.es</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
