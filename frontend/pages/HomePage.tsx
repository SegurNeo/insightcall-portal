
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Calendar, CalendarDays, ChevronRight, Clock, Download, FileText, Phone, Settings, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import RealCallsList from "@/components/calls/RealCallsList";
import QuickAccessCard from "@/components/dashboard/QuickAccessCard";
import { Link } from "react-router-dom";
import AlertsCard from "@/components/dashboard/AlertsCard";

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: {
    value: string;
    positive: boolean;
  };
  indicator?: React.ReactNode;
}

// Datos de ejemplo para el gráfico
const callVolumeData = [
  { name: "Lun", calls: 42 },
  { name: "Mar", calls: 38 },
  { name: "Mié", calls: 45 },
  { name: "Jue", calls: 39 },
  { name: "Vie", calls: 53 },
  { name: "Sáb", calls: 18 },
  { name: "Dom", calls: 12 },
];

// Datos para las tarjetas KPI
const kpiData = [
  {
    title: "Llamadas hoy",
    value: "48",
    icon: <Phone className="h-4 w-4" />,
    change: {
      value: "+12%",
      positive: true,
    },
  },
  {
    title: "Duración media",
    value: "2m 38s",
    icon: <Clock className="h-4 w-4" />,
    change: {
      value: "-8%",
      positive: true,
    },
  },
  {
    title: "Incidencias",
    value: "17%",
    icon: <Phone className="h-4 w-4" />,
    indicator: (
      <Badge variant="destructive" className="ml-2">
        +5%
      </Badge>
    ),
  },
  {
    title: "Transcripciones",
    value: "35",
    icon: <FileText className="h-4 w-4" />,
    change: {
      value: "92%",
      positive: true,
    },
  },
];

// Datos para las alertas
const alertsData = [
  {
    id: "alert-1",
    type: "ticket",
    title: "Ticket #12345 sin resolver",
    description: "Cliente solicitó información sobre su póliza",
    time: "hace 2 horas",
    severity: "high",
    route: "/actions"
  },
  {
    id: "alert-2",
    type: "repeat_call",
    title: "3 llamadas del mismo cliente",
    description: "+34 922 456 789 ha llamado 3 veces hoy",
    time: "hoy",
    severity: "medium",
    route: "/calls"
  },
  {
    id: "alert-3",
    type: "error",
    title: "Error en número virtual",
    description: "El número #12 no está recibiendo llamadas",
    time: "hace 30 minutos",
    severity: "high",
    route: "/phones"
  },
];

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, change, indicator }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">{title}</div>
            <div className="flex items-baseline">
              <div className="text-3xl font-bold">{value}</div>
              {indicator}
            </div>
          </div>
          <div className="p-2 bg-primary/10 rounded-full">
            <div className="text-primary">{icon}</div>
          </div>
        </div>
        {change && (
          <div className="flex items-center mt-4 text-xs">
            <span
              className={
                change.positive ? "text-green-600" : "text-red-600"
              }
            >
              {change.value}
            </span>
            <span className="text-muted-foreground ml-1">
              vs ayer
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const HomePage = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Panel de control</h1>
        <p className="text-muted-foreground">
          Resumen de la actividad y analíticas principales
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {kpiData.map((kpi, index) => (
          <KpiCard
            key={index}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            change={kpi.change}
            indicator={kpi.indicator}
          />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-12 mb-6">
        {/* Call Volume Chart - Restaurando el gráfico de área original */}
        <Card className="md:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Volumen de llamadas</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="h-8">
                <CalendarDays className="h-3.5 w-3.5 mr-2" />
                Últimos 7 días
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={callVolumeData}>
                <defs>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsla(var(--muted-foreground) / 0.1)" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="calls" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorCalls)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alerts Card */}
        <div className="md:col-span-4">
          <AlertsCard alerts={alertsData} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12 mb-6">
        {/* Recent Calls */}
        <Card className="md:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Llamadas recientes</CardTitle>
            <Button variant="ghost" size="sm" className="h-8" asChild>
              <Link to="/calls">
                Ver todas
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
                          <RealCallsList limit={5} />
        </Card>

        {/* Quick Access y Agent Activity */}
        <div className="md:col-span-4 space-y-6">
          <QuickAccessCard />
          
          {/* Agent Activity Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Actividad de agentes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {["María García", "Luis Martínez", "Ana Rodríguez"].map((agent, index) => (
                  <div key={index} className="p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-secondary-foreground mr-3">
                        {agent.split(' ').map(name => name[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium">{agent}</div>
                        <div className="text-xs text-muted-foreground">
                          {["12 llamadas", "8 llamadas", "10 llamadas"][index]} hoy
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HomePage;
