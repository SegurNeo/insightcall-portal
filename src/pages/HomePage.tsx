
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowUpRight, 
  Calendar, 
  Phone, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  MessageSquare, 
  BarChart3,
  Target,
  RefreshCw,
  Euro
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, PieChart, Pie, Cell } from "recharts";
import RealCallsList from "@/components/calls/RealCallsList";
import { Link } from "react-router-dom";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useState } from "react";

const HomePage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('month');
  const { stats, isLoading, error, lastUpdated, refresh } = useDashboardStats(selectedPeriod);

  // Función para formatear duración en minutos:segundos
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Función para formatear tendencias
  const formatTrend = (trend: number): string => {
    if (trend === 0) return "=";
    return trend > 0 ? `+${trend}%` : `${trend}%`;
  };

  // Función para obtener el texto del período
  const getPeriodText = (period: string): string => {
    switch (period) {
      case 'today': return 'Hoy';
      case 'week': return 'Últimos 7 días';
      case 'month': return 'Últimos 30 días';
      default: return 'Últimos 30 días';
    }
  };

  // Configurar métricas principales con datos reales
  const keyMetrics = stats ? [
    {
      title: "Llamadas almacenadas",
      value: stats.totalCalls.toLocaleString(),
      subtitle: getPeriodText(selectedPeriod),
      icon: Phone,
      trend: formatTrend(stats.trends.calls),
      trendValue: `${Math.abs(stats.trends.calls)} vs período anterior`,
      positive: stats.trends.calls >= 0,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Duración promedio",
      value: formatDuration(stats.avgDuration),
      subtitle: "Por llamada",
      icon: Clock,
      trend: formatTrend(stats.trends.duration),
      trendValue: `${Math.abs(stats.trends.duration)}% vs período anterior`,
      positive: stats.trends.duration <= 0, // Menor duración es mejor
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Tasa de éxito",
      value: `${stats.successRate}%`,
      subtitle: "Llamadas exitosas",
      icon: CheckCircle,
      trend: formatTrend(stats.trends.success),
      trendValue: `${Math.abs(stats.trends.success)}% vs período anterior`,
      positive: stats.trends.success >= 0,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    {
      title: "Tickets creados",
      value: stats.ticketsCreated.toLocaleString(),
      subtitle: "Automáticamente",
      icon: MessageSquare,
      trend: formatTrend(stats.trends.tickets),
      trendValue: `${Math.abs(stats.trends.tickets)} vs período anterior`,
      positive: stats.trends.tickets >= 0,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ] : [];

  // Datos para el gráfico de área (últimos días)
  const chartData = stats?.dailyVolume.map(day => ({
    name: new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short' }),
    calls: day.calls,
    successful: day.successful,
    failed: day.failed
  })) || [];

  // Datos para el gráfico circular de estados
  const statusData = stats?.callsByStatus.map((item, index) => ({
    name: item.status === 'completed' ? 'Completadas' : 
          item.status === 'failed' ? 'Fallidas' : 
          item.status === 'in_progress' ? 'En progreso' : item.status,
    value: item.count,
    percentage: item.percentage,
    color: `hsl(var(--chart-${index + 1}))`
  })) || [];

  // Métricas de rendimiento
  const performanceData = stats ? [
    { metric: "Tasa de éxito", value: stats.successRate, target: 90 },
    { metric: "Análisis completados", value: stats.analysisRate, target: 95 },
    { metric: "Audio disponible", value: stats.audioAvailability, target: 85 },
    { metric: "Uptime del sistema", value: stats.systemStatus.uptime, target: 99 },
  ] : [];

  // Actividad reciente simulada (esto podría venir de un log real)
  const recentActivity = [
    {
      id: 1,
      type: "call",
      title: "Nueva llamada procesada",
      description: `Última llamada: ${stats?.systemStatus.lastCallTime ? 
        new Date(stats.systemStatus.lastCallTime).toLocaleString('es-ES') : 'No disponible'}`,
      time: stats?.systemStatus.lastCallTime ? 
        `hace ${Math.round((new Date().getTime() - new Date(stats.systemStatus.lastCallTime).getTime()) / (1000 * 60))} min` : 
        'No disponible',
      status: "success"
    },
    {
      id: 2,
      type: "ticket",
      title: "Tickets generados",
      description: `${stats?.ticketsCreated || 0} tickets creados en el período`,
      time: "actualizado ahora",
      status: "info"
    },
    {
      id: 3,
      type: "system",
      title: "Estado del sistema",
      description: stats?.systemStatus.isActive ? "Sistema activo y procesando" : "Sistema inactivo",
      time: lastUpdated ? `actualizado ${lastUpdated.toLocaleTimeString('es-ES')}` : '',
      status: stats?.systemStatus.isActive ? "success" : "warning"
    }
  ];

  if (error) {
    return (
      <DashboardLayout>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">Error al cargar estadísticas</h3>
                <p className="text-sm text-red-600">{error}</p>
                <Button variant="outline" size="sm" onClick={refresh} className="mt-2">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header mejorado con selector de período */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Resumen de actividad y métricas del sistema
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
              {['today', 'week', 'month'].map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period as any)}
                  className="h-8"
                >
                  {period === 'today' ? 'Hoy' : period === 'week' ? '7 días' : '30 días'}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {isLoading ? (
          // Skeletons mientras carga
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          keyMetrics.map((metric, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-md ${metric.bgColor}`}>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    {metric.subtitle}
                  </p>
                  <div className="flex items-center">
                    {metric.positive ? (
                      <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                    )}
                    <span className={`text-xs font-medium ${
                      metric.positive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.trend}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.trendValue}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Contenido principal con tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            
            {/* Gráfico principal */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Volumen de llamadas</CardTitle>
                <CardDescription>
                  Llamadas procesadas en {getPeriodText(selectedPeriod).toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="name" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          boxShadow: 'var(--shadow-md)'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="calls" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorCalls)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Panel lateral con estado del sistema */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Estado del sistema</CardTitle>
                <CardDescription>
                  Monitoreo en tiempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Estado general */}
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${stats?.systemStatus.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                        <Activity className={`h-5 w-5 ${stats?.systemStatus.isActive ? 'text-green-600' : 'text-red-600'}`} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {stats?.systemStatus.isActive ? 'Sistema activo' : 'Sistema inactivo'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {stats?.systemStatus.isActive ? 'Procesando llamadas' : 'Sin actividad reciente'}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Información del sistema */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Uptime</span>
                        <Badge variant="secondary" className="text-green-700 bg-green-50">
                          {stats?.systemStatus.uptime}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Última llamada</span>
                        <span className="text-sm font-medium">
                          {stats?.systemStatus.lastCallTime ? 
                            new Date(stats.systemStatus.lastCallTime).toLocaleString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit'
                            }) : 
                            'No disponible'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total llamadas</span>
                        <span className="text-sm font-medium">{stats?.totalCalls || 0}</span>
                      </div>
                      {stats?.totalCost && stats.totalCost > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Costo total</span>
                          <span className="text-sm font-medium flex items-center">
                            <Euro className="h-3 w-3 mr-1" />
                            {stats.totalCost.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}

              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Gráfico de barras */}
            <Card>
              <CardHeader>
                <CardTitle>Llamadas exitosas vs fallidas</CardTitle>
                <CardDescription>
                  Distribución por día en {getPeriodText(selectedPeriod).toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="successful" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="failed" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Gráfico circular */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por estado</CardTitle>
                <CardDescription>
                  Estado de todas las llamadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {statusData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm text-muted-foreground">{item.name}</span>
                          </div>
                          <span className="text-sm font-medium">{item.value} ({item.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de rendimiento</CardTitle>
              <CardDescription>
                Análisis de la calidad y eficiencia del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))
              ) : (
                performanceData.map((metric, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {metric.metric}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Objetivo: {metric.target}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{metric.value}%</p>
                        <Badge 
                          variant={metric.value >= metric.target ? "default" : "secondary"}
                          className={metric.value >= metric.target ? "bg-green-100 text-green-700" : ""}
                        >
                          {metric.value >= metric.target ? "✓ Objetivo alcanzado" : "⚠ Por debajo del objetivo"}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={metric.value} className="h-3" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actividad del sistema</CardTitle>
              <CardDescription>
                Estado actual y última actividad registrada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id} className="flex items-start space-x-4">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={
                        activity.status === 'success' ? 'bg-green-100 text-green-600' :
                        activity.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-blue-100 text-blue-600'
                      }>
                        {activity.type === 'call' ? <Phone className="h-4 w-4" /> :
                         activity.type === 'ticket' ? <MessageSquare className="h-4 w-4" /> :
                         <Activity className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Acciones rápidas */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Acciones rápidas</CardTitle>
          <CardDescription>
            Acceso directo a las funciones más utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-24 flex-col space-y-2" asChild>
              <Link to="/calls">
                <Phone className="h-6 w-6" />
                <span>Ver llamadas</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex-col space-y-2" asChild>
              <Link to="/analytics">
                <BarChart3 className="h-6 w-6" />
                <span>Analíticas</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex-col space-y-2" asChild>
              <Link to="/tickets">
                <MessageSquare className="h-6 w-6" />
                <span>Tickets</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex-col space-y-2" asChild>
              <Link to="/settings">
                <Target className="h-6 w-6" />
                <span>Configuración</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Llamadas recientes */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Llamadas recientes</CardTitle>
            <CardDescription>
              Últimas llamadas almacenadas en el sistema
            </CardDescription>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/calls">
              Ver todas
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <RealCallsList limit={8} showHeader={false} />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default HomePage;
