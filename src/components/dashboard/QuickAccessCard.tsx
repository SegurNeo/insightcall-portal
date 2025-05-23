
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon, Phone, Search, FileText, Settings } from "lucide-react";
import { Link } from "react-router-dom";

interface QuickAccessLink {
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  color: string;
}

const QuickAccessCard = () => {
  const quickLinks: QuickAccessLink[] = [
    {
      title: "Ver llamadas",
      description: "Accede a todas las llamadas registradas",
      icon: Phone,
      to: "/calls",
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Buscar transcripciones",
      description: "Busca transcripciones por contenido",
      icon: Search,
      to: "/transcriptions",
      color: "bg-blue-400/10 text-blue-500",
    },
    {
      title: "Revisar acciones",
      description: "Gestiona tickets y tareas pendientes",
      icon: FileText,
      to: "/actions",
      color: "bg-blue-300/10 text-blue-400",
    },
    {
      title: "Configuración",
      description: "Ajusta parámetros del sistema",
      icon: Settings,
      to: "/settings",
      color: "bg-blue-200/10 text-blue-300",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accesos rápidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {quickLinks.map((link, index) => (
            <Link to={link.to} key={index} className="block w-full">
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-3 px-4 hover:bg-accent"
              >
                <div className={`p-2.5 rounded-full mr-3 ${link.color}`}>
                  <link.icon className="h-5 w-5" />
                </div>
                <div className="text-left flex-1 overflow-hidden">
                  <div className="font-medium truncate">{link.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{link.description}</div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickAccessCard;
