import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, ArrowUpRight, CalendarDays, Clock, Headphones, MessageSquare, Phone, PhoneCall, PhoneForwarded, PhoneIncoming, PhoneMissed, PieChart, UserCheck } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, LineChart, Line } from "recharts";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import RealCallsList from "@/components/calls/RealCallsList";
import { useState } from "react";
import ElevenLabsWidget from "@/components/calls/ElevenLabsWidget";

const callVolumeData = [
  { day: 'Lun', calls: 34 },
  { day: 'Mar', calls: 42 },
  { day: 'Mié', calls: 53 },
  { day: 'Jue', calls: 48 },
  { day: 'Vie', calls: 62 },
  { day: 'Sáb', calls: 23 },
  { day: 'Dom', calls: 12 },
];

const callTypeData = [
  { name: 'Consultas', value: 42 },
  { name: 'Siniestros', value: 28 },
  { name: 'Ventas', value: 15 },
  { name: 'Otros', value: 10 },
];

const callLengthData = [
  { time: '0-1m', calls: 12 },
  { time: '1-2m', calls: 24 },
  { time: '2-5m', calls: 38 },
  { time: '5-10m', calls: 18 },
  { time: '>10m', calls: 8 },
];

const callSuccessData = [
  { date: 'Lun', successful: 28, issues: 6 },
  { date: 'Mar', successful: 34, issues: 8 },
  { date: 'Mié', successful: 42, issues: 11 },
  { date: 'Jue', successful: 39, issues: 9 },
  { date: 'Vie', successful: 53, issues: 9 },
  { date: 'Sáb', successful: 19, issues: 4 },
  { date: 'Dom', successful: 10, issues: 2 },
];

const Index = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  const stats = [
    { title: "Llamadas Hoy", value: "32", icon: PhoneCall, change: "+12%", changeType: "positive" },
    { title: "Tiempo Medio", value: "3:24", icon: Clock, change: "-8%", changeType: "positive" },
    { title: "Tasa Resolución", value: "84%", icon: UserCheck, change: "+2%", changeType: "positive" },
    { title: "Transcripciones", value: "28", icon: MessageSquare, change: "=", changeType: "neutral" },
  ];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === "calls") {
      toast({
        title: "Vista actualizada",
        description: "Mostrando la actividad de llamadas recientes.",
      });
    }
  };

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
          <Button variant="outline" className="hidden md:flex">
            <CalendarDays className="h-4 w-4 mr-2" />
            Últimos 7 días
          </Button>
          <Button variant="default">
            <Headphones className="h-4 w-4 mr-2" />
            Nueva Llamada
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6 fade-in">
        {stats.map((stat, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                </div>
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <Badge variant={stat.changeType === "positive" ? "outline" : "secondary"} className="font-normal">
                  {stat.change} 
                </Badge>
                <span className="text-xs text-muted-foreground ml-2">vs. semana pasada</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview">Visión General</TabsTrigger>
          <TabsTrigger value="calls">Llamadas</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="assistant">Asistente IA</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

            <Card>
              <CardHeader>
                <CardTitle>Tipos de Llamada</CardTitle>
                <CardDescription>Distribución por categoría</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={callTypeData} layout="vertical">
                      <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" scale="band" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="hsl(var(--primary))" 
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Duración de Llamadas</CardTitle>
                <CardDescription>Distribución por tiempo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={callLengthData}>
                      <XAxis dataKey="time" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem'
                        }}
                      />
                      <Bar 
                        dataKey="calls" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                        barSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Resultado de Llamadas</CardTitle>
                  <CardDescription>Proporción de llamadas exitosas vs. con incidencias</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-8">
                  Ver Detalle
                </Button>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={callSuccessData}>
                      <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsla(var(--muted-foreground) / 0.1)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="successful" 
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="issues" 
                        stroke="hsl(var(--destructive))" 
                        strokeWidth={2}
                        dot={{ r: 4, fill: 'hsl(var(--destructive))', strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agentes Más Activos</CardTitle>
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
        </TabsContent>

        <TabsContent value="calls">
          <Card>
              <RealCallsList />
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Métricas Detalladas</CardTitle>
              <CardDescription>Análisis completo de la actividad de llamadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Llamadas", value: "1,248", change: "+18%", icon: Phone },
                  { label: "Duración Media", value: "3m 45s", change: "-5%", icon: Clock },
                  { label: "Tasa Transferencia", value: "12%", change: "-3%", icon: PhoneForwarded },
                  { label: "Abandonos", value: "5%", change: "-2%", icon: PhoneMissed },
                  { label: "Primera Llamada", value: "72%", change: "+4%", icon: PhoneIncoming },
                  { label: "Llamadas Repetidas", value: "28%", change: "-4%", icon: PhoneCall },
                  { label: "NPS", value: "8.5", change: "+0.5", icon: UserCheck },
                  { label: "Coste Promedio", value: "€1.24", change: "-12%", icon: PieChart },
                ].map((metric, i) => (
                  <Card key={i} className="bg-secondary/50 border-0">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-muted-foreground">{metric.label}</p>
                          <p className="text-2xl font-bold mt-1">{metric.value}</p>
                          <Badge variant="outline" className="mt-2 font-normal">{metric.change}</Badge>
                        </div>
                        <div className="bg-background rounded-md p-2 shadow-sm">
                          <metric.icon className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assistant">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <ElevenLabsWidget />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Integración con ElevenLabs</CardTitle>
                <CardDescription>
                  Configura tu asistente virtual con Conversational AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <h3 className="font-medium">¿Cómo funciona?</h3>
                <p className="text-sm text-muted-foreground">
                  La integración con ElevenLabs Conversational AI te permite crear un asistente virtual 
                  que puede atender llamadas, responder preguntas de los clientes y realizar tareas básicas 
                  automáticamente.
                </p>
                
                <h3 className="font-medium mt-4">Pasos para la configuración:</h3>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Obtén una API Key de ElevenLabs</li>
                  <li>Crea un agente conversacional en el panel de ElevenLabs</li>
                  <li>Configura las respuestas y comportamientos del agente</li>
                  <li>Copia el ID del agente y pegalo en el formulario</li>
                  <li>Selecciona la voz que más se adapte a tus necesidades</li>
                </ol>
                
                <div className="bg-primary/5 p-4 rounded-md mt-4">
                  <h3 className="font-medium text-primary">Beneficios</h3>
                  <ul className="text-sm space-y-2 mt-2">
                    <li className="flex items-start">
                      <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2 mt-0.5">✓</span>
                      Atiende llamadas 24/7 sin intervención humana
                    </li>
                    <li className="flex items-start">
                      <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2 mt-0.5">✓</span>
                      Reduce tiempos de espera y mejora la satisfacción
                    </li>
                    <li className="flex items-start">
                      <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2 mt-0.5">✓</span>
                      Redirige casos complejos a agentes humanos cuando sea necesario
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Llamadas Recientes</h2>
          <Button variant="link" className="text-sm" onClick={() => window.location.href = "/calls"}>
            Ver todas <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <Card>
                          <RealCallsList limit={5} />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Index;

