
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  CalendarDays, 
  Download, 
  Filter, 
  Headphones, 
  PhoneCall, 
  Search, 
  SlidersHorizontal 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import RecentCallsList from "@/components/calls/RecentCallsList";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CallsPage = () => {
  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Llamadas</h1>
          <p className="text-muted-foreground">
            Gestiona y consulta todas las llamadas del asistente virtual
          </p>
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Buscar por teléfono o ID..." />
          </div>
          <Button variant="outline" className="hidden md:flex">
            <CalendarDays className="h-4 w-4 mr-2" />
            Filtrar por fecha
          </Button>
          <Button variant="default">
            <Headphones className="h-4 w-4 mr-2" />
            Nueva Llamada
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Tabs defaultValue="all" className="w-full md:w-auto">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">Todas</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">Completadas</TabsTrigger>
            <TabsTrigger value="forwarded" className="flex-1">Derivadas</TabsTrigger>
            <TabsTrigger value="issues" className="flex-1">Incidencias</TabsTrigger>
            <TabsTrigger value="missed" className="flex-1">Perdidas</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Select defaultValue="7days">
            <SelectTrigger className="w-[180px]">
              <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="yesterday">Ayer</SelectItem>
              <SelectItem value="7days">Últimos 7 días</SelectItem>
              <SelectItem value="30days">Últimos 30 días</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-[160px]">
              <PhoneCall className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="consulta">Consultas</SelectItem>
              <SelectItem value="siniestro">Siniestros</SelectItem>
              <SelectItem value="venta">Ventas</SelectItem>
              <SelectItem value="otros">Otros</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <RecentCallsList />
      </Card>

      <div className="flex justify-end">
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Datos
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default CallsPage;
