
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Calendar, Phone, Clock, CheckCircle, AlertCircle, Activity, TrendingUp, Users, MessageSquare, ChevronRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import RealCallsList from "@/components/calls/RealCallsList";
import { Link } from "react-router-dom";

// Datos simplificados para el diseño minimalista
const callVolumeData = [
  { name: "Lun", calls: 34 },
  { name: "Mar", calls: 42 },
  { name: "Mié", calls: 53 },
  { name: "Jue", calls: 48 },
  { name: "Vie", calls: 62 },
  { name: "Sáb", calls: 23 },
  { name: "Dom", calls: 12 },
];

// Métricas principales simplificadas
const keyMetrics = [
  {
    title: "Llamadas procesadas",
    value: "2,847",
    subtitle: "Este mes",
    icon: Phone,
    trend: "+12%",
    positive: true
  },
  {
    title: "Tiempo promedio",
    value: "2:34",
    subtitle: "Duración media",
    icon: Clock,
    trend: "-8%",
    positive: true
  },
  {
    title: "Satisfacción",
    value: "94%",
    subtitle: "Clientes satisfechos",
    icon: CheckCircle,
    trend: "+3%",
    positive: true
  },
  {
    title: "Tickets creados",
    value: "156",
    subtitle: "Automáticamente",
    icon: MessageSquare,
    trend: "+24%",
    positive: true
  }
];

const HomePage = () => {
  return (
    <DashboardLayout>
      {/* Header minimalista */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-light text-foreground mb-2">
              Resumen
            </h1>
            <p className="text-muted-foreground text-lg font-light">
              Actividad de llamadas de voz
            </p>
          </div>
          <Button variant="outline" className="rounded-full px-6">
            <Calendar className="h-4 w-4 mr-2" />
            Últimos 30 días
          </Button>
        </div>
      </div>

      {/* Métricas principales - layout limpio */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {keyMetrics.map((metric, index) => (
          <Card key={index} className="border-none shadow-none bg-muted/20 hover:bg-muted/30 transition-colors">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 rounded-full bg-background">
                  <metric.icon className="h-5 w-5 text-foreground" />
                </div>
                <Badge 
                  variant="secondary" 
                  className={`text-xs font-light ${metric.positive ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}
                >
                  {metric.trend}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-3xl font-light text-foreground">
                  {metric.value}
                </p>
                <p className="text-sm font-light text-muted-foreground">
                  {metric.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contenido principal - dos columnas limpias */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Gráfico principal - minimalista */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-none bg-background">
            <CardHeader className="pb-8">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-light text-foreground">
                  Actividad de llamadas
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Ver detalles
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={callVolumeData}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="calls" 
                    stroke="hsl(var(--foreground))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCalls)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral - información rápida */}
        <div className="space-y-8">
          
          {/* Estado del sistema */}
          <Card className="border-none shadow-none bg-muted/20">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="p-2 rounded-full bg-green-50 mr-4">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Sistema activo</p>
                  <p className="text-sm text-muted-foreground">Procesando llamadas</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="text-sm font-medium">99.9%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Última llamada</span>
                  <span className="text-sm font-medium">hace 2 min</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones rápidas */}
          <Card className="border-none shadow-none bg-background">
            <CardContent className="p-8">
              <h3 className="font-medium text-foreground mb-6">Acciones rápidas</h3>
              <div className="space-y-4">
                <Link to="/calls" className="block">
                  <Button variant="ghost" className="w-full justify-between p-4 h-auto hover:bg-muted/50">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-3" />
                      <span className="font-light">Ver llamadas</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </Link>
                
                <Link to="/analytics" className="block">
                  <Button variant="ghost" className="w-full justify-between p-4 h-auto hover:bg-muted/50">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-3" />
                      <span className="font-light">Analíticas</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </Link>
                
                <Link to="/tickets" className="block">
                  <Button variant="ghost" className="w-full justify-between p-4 h-auto hover:bg-muted/50">
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-3" />
                      <span className="font-light">Tickets</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Llamadas recientes - sección simplificada */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-light text-foreground">
            Actividad reciente
          </h2>
          <Button variant="ghost" asChild>
            <Link to="/calls" className="text-muted-foreground">
              Ver todas las llamadas
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <Card className="border-none shadow-none bg-background">
          <RealCallsList limit={8} showHeader={false} />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default HomePage;
