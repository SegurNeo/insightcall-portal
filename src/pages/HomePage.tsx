
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight, CalendarDays, Clock, Headphones, MessageSquare, Phone, PhoneCall, UserCheck } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import StatCard from "@/components/dashboard/StatCard";
import AlertsCard from "@/components/dashboard/AlertsCard";
import QuickAccessCard from "@/components/dashboard/QuickAccessCard";
import RecentCallsList from "@/components/calls/RecentCallsList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Sample data for stats
const stats = [
  { title: "Llamadas Hoy", value: "48", icon: PhoneCall, change: "+12%", changeType: "positive" as const },
  { title: "Tiempo Medio", value: "2:38", icon: Clock, change: "-8%", changeType: "positive" as const },
  { title: "Tasa Resolución", value: "83%", icon: UserCheck, change: "+2%", changeType: "positive" as const },
  { title: "Transcripciones", value: "35", icon: MessageSquare, change: "=", changeType: "neutral" as const },
];

// Sample data for the chart
const callVolumeData = [
  { day: 'Lun', calls: 34 },
  { day: 'Mar', calls: 42 },
  { day: 'Mié', calls: 53 },
  { day: 'Jue', calls: 48 },
  { day: 'Vie', calls: 62 },
  { day: 'Sáb', calls: 23 },
  { day: 'Dom', calls: 12 },
];

// Sample alerts data
const alertsData = [
  {
    id: "alert-1",
    type: "ticket" as const,
    title: "5 tickets sin resolver",
    description: "Tickets de clientes esperando resolución desde hace más de 24h",
    time: "Hace 2 horas",
    severity: "high" as const
  },
  {
    id: "alert-2",
    type: "repeat_call" as const,
    title: "Cliente con llamadas repetidas",
    description: "El cliente +34 612 345 678 ha llamado 3 veces hoy",
    time: "Hace 45 minutos",
    severity: "medium" as const
  },
  {
    id: "alert-3",
    type: "line_issue" as const,
    title: "Línea con problemas",
    description: "El número 'Soporte Madrid' tiene problemas de conexión",
    time: "Hace 3 horas",
    severity: "low" as const
  }
];

const HomePage = () => {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido al panel de control de Nogal Seguros
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select defaultValue="7days">
            <SelectTrigger className="w-[180px]">
              <CalendarDays className="h-4 w-4 mr-2" />
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
          <Button variant="default">
            <Headphones className="h-4 w-4 mr-2" />
            Nueva Llamada
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {stats.map((stat, index) => (
          <StatCard 
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            change={stat.change}
            changeType={stat.changeType}
          />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Volumen de Llamadas</CardTitle>
              <CardDescription>Llamadas por día en la última semana</CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="px-2">
            <div className="h-[250px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={callVolumeData}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsla(var(--muted-foreground) / 0.1)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="calls" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorCalls)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <AlertsCard alerts={alertsData} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <QuickAccessCard />
        
        <Card>
          <CardHeader>
            <CardTitle>Actividad Agentes</CardTitle>
            <CardDescription>Top por volumen de llamadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "María García", calls: 38, avatar: "MG" },
                { name: "Luis Martínez", calls: 31, avatar: "LM" },
                { name: "Ana Rodríguez", calls: 28, avatar: "AR" },
                { name: "Carlos López", calls: 24, avatar: "CL" }
              ].map((agent, i) => (
                <div key={i} className="flex items-center">
                  <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-secondary-foreground mr-3">
                    {agent.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{agent.name}</p>
                    <div className="w-full h-2 bg-secondary rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${(agent.calls / 40) * 100}%` }} 
                      />
                    </div>
                  </div>
                  <div className="ml-2 text-sm font-medium">{agent.calls}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Llamadas Recientes</h2>
          <Button variant="link" className="text-sm">
            Ver todas <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <Card>
          <RecentCallsList limit={5} />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default HomePage;
