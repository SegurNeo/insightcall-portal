
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line } from "recharts";
import { CalendarDays, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Sample data for charts
const callVolumeData = [
  { day: 'Lun', calls: 34, completed: 28, issues: 6 },
  { day: 'Mar', calls: 42, completed: 34, issues: 8 },
  { day: 'Mié', calls: 53, completed: 42, issues: 11 },
  { day: 'Jue', calls: 48, completed: 39, issues: 9 },
  { day: 'Vie', calls: 62, completed: 53, issues: 9 },
  { day: 'Sáb', calls: 23, completed: 19, issues: 4 },
  { day: 'Dom', calls: 12, completed: 10, issues: 2 },
];

const callTypeData = [
  { name: 'Consultas', value: 42 },
  { name: 'Siniestros', value: 28 },
  { name: 'Ventas', value: 15 },
  { name: 'Otros', value: 10 },
];

const durationData = [
  { day: 'Lun', duration: 3.2 },
  { day: 'Mar', duration: 3.7 },
  { day: 'Mié', duration: 4.1 },
  { day: 'Jue', duration: 3.8 },
  { day: 'Vie', duration: 3.5 },
  { day: 'Sáb', duration: 2.9 },
  { day: 'Dom', duration: 2.6 },
];

const hourlyData = Array.from({ length: 24 }, (_, i) => {
  // Generate a pattern: busier during business hours
  let calls = 0;
  if (i >= 8 && i <= 18) {
    calls = 5 + Math.floor(Math.random() * 15); // Higher during business hours
    if (i >= 10 && i <= 15) {
      calls += 10; // Peak hours
    }
  } else {
    calls = Math.floor(Math.random() * 5); // Lower outside business hours
  }
  
  return {
    hour: `${i}:00`,
    calls,
  };
});

const satisfactionData = [
  { day: 'Lun', score: 8.2 },
  { day: 'Mar', score: 8.5 },
  { day: 'Mié', score: 8.1 },
  { day: 'Jue', score: 8.4 },
  { day: 'Vie', score: 8.7 },
  { day: 'Sáb', score: 8.3 },
  { day: 'Dom', score: 8.5 },
];

const COLORS = ['#3d904b', '#8eca93', '#bbe1be', '#dcf1de'];

const AnalyticsPage = () => {
  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Analiza el rendimiento de las llamadas del asistente virtual
          </p>
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
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
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visión General</TabsTrigger>
          <TabsTrigger value="detailed">Detalle</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Volumen de Llamadas</CardTitle>
                <CardDescription>Número total de llamadas por día</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={callVolumeData}>
                      <defs>
                        <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsla(var(--muted-foreground) / 0.1)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem'
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
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={callTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {callTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Duración Media</CardTitle>
                <CardDescription>Tiempo promedio por llamada (minutos)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={durationData}>
                      <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 5]} />
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsla(var(--muted-foreground) / 0.1)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem'
                        }}
                        formatter={(value: number) => [`${value} min`, 'Duración']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="duration" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Llamadas por Hora</CardTitle>
                <CardDescription>Distribución horaria del volumen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData}>
                      <XAxis 
                        dataKey="hour" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(value) => value.split(':')[0]}
                      />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsla(var(--muted-foreground) / 0.1)" />
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
                        barSize={12}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Resultado de Llamadas</CardTitle>
                <CardDescription>Llamadas completadas vs. con incidencias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={callVolumeData}>
                      <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsla(var(--muted-foreground) / 0.1)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem'
                        }}
                      />
                      <Bar 
                        dataKey="completed" 
                        stackId="a" 
                        fill="hsl(var(--primary))" 
                        name="Completadas"
                      />
                      <Bar 
                        dataKey="issues" 
                        stackId="a" 
                        fill="hsl(var(--destructive))" 
                        name="Incidencias"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>Satisfacción del Cliente</CardTitle>
              <CardDescription>Puntuación media por día (escala 1-10)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={satisfactionData}>
                    <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[7, 10]} />
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
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias de Volumen</CardTitle>
              <CardDescription>Análisis de tendencias mensuales</CardDescription>
            </CardHeader>
            <CardContent className="h-[500px]">
              <div className="text-center h-full flex items-center justify-center">
                <p className="text-muted-foreground">Datos de tendencias en desarrollo</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
