import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  PlayCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity, 
  Database, 
  Key, 
  Send,
  RefreshCw,
  AlertCircle,
  Eye,
  BarChart3,
  FileText
} from 'lucide-react';
import { useVoiceCalls } from '../hooks/useVoiceCalls';

const VoiceCallsTestPage: React.FC = () => {
  const {
    isLoading,
    error,
    lastResponse,
    testResults,
    sendVoiceCall,
    getVoiceCall,
    getRecentVoiceCalls,
    getStats,
    healthCheck,
    runAllTestScenarios,
    clearResults,
    testScenarios
  } = useVoiceCalls();

  const [apiKey, setApiKey] = useState('');
  const [callId, setCallId] = useState('');
  const [customPayload, setCustomPayload] = useState('');
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentCalls, setRecentCalls] = useState<any>(null);

  // Load saved API key from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('nogal_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Save API key to localStorage
  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    localStorage.setItem('nogal_api_key', value);
  };

  const handleHealthCheck = async () => {
    try {
      const response = await healthCheck();
      setHealthStatus(response);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const handleGetStats = async () => {
    try {
      const response = await getStats(apiKey);
      setStats(response);
    } catch (error) {
      console.error('Get stats failed:', error);
    }
  };

  const handleGetRecentCalls = async () => {
    try {
      const response = await getRecentVoiceCalls(10, apiKey);
      setRecentCalls(response);
    } catch (error) {
      console.error('Get recent calls failed:', error);
    }
  };

  const handleGetCall = async () => {
    if (!callId.trim()) {
      alert('Por favor, introduce un Call ID');
      return;
    }
    
    try {
      await getVoiceCall(callId, apiKey);
    } catch (error) {
      console.error('Get call failed:', error);
    }
  };

  const handleSendCustomPayload = async () => {
    if (!customPayload.trim()) {
      alert('Por favor, introduce un payload JSON');
      return;
    }
    
    try {
      const payload = JSON.parse(customPayload);
      await sendVoiceCall(payload, apiKey);
    } catch (error) {
      if (error instanceof SyntaxError) {
        alert('JSON inválido. Por favor, verifica el formato.');
      } else {
        console.error('Send custom payload failed:', error);
      }
    }
  };

  const handleRunAllTests = async () => {
    await runAllTestScenarios(apiKey);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const samplePayload = {
    call_id: "a1b2c3d4-e5f6-4789-a123-456789abcdef",
    conversation_id: "conv_elevenlabs_12345",
    agent_id: "agent_segurneo_001",
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 300000).toISOString(), // 5 minutes later
    duration_seconds: 300,
    status: "completed",
    cost: 1500,
    termination_reason: "User hung up normally",
    transcript_summary: "Cliente consultó sobre estado de su pedido.",
    call_successful: true,
    participant_count: {
      agent_messages: 8,
      user_messages: 12,
      total_messages: 20
    },
    audio_available: true,
    created_at: new Date().toISOString()
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Voice Calls API - Testing</h1>
          <p className="text-gray-600 mt-2">
            Prueba y monitorea el endpoint de Nogal para llamadas de voz
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleHealthCheck}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Activity className="h-4 w-4" />
            <span>Health Check</span>
          </Button>
          <Button
            onClick={clearResults}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* API Key Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Configuración de API Key</span>
          </CardTitle>
          <CardDescription>
            Configura tu API key para autenticación (opcional en desarrollo)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              type="password"
              placeholder="Introduce tu API key (opcional)"
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              className="flex-1"
            />
            <Badge variant={apiKey ? "default" : "secondary"}>
              {apiKey ? "Configurada" : "Sin configurar"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Health Status */}
      {healthStatus && (
        <Alert className={healthStatus.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <strong>Estado del servicio:</strong> {healthStatus.message}
            {healthStatus.data && (
              <pre className="mt-2 text-xs bg-white p-2 rounded">
                {JSON.stringify(healthStatus.data, null, 2)}
              </pre>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="scenarios" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="scenarios">Escenarios de Prueba</TabsTrigger>
          <TabsTrigger value="custom">Payload Personalizado</TabsTrigger>
          <TabsTrigger value="query">Consultar Llamadas</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoreo</TabsTrigger>
          <TabsTrigger value="response">Respuesta</TabsTrigger>
        </TabsList>

        {/* Test Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PlayCircle className="h-5 w-5" />
                <span>Escenarios de Prueba Automatizados</span>
              </CardTitle>
              <CardDescription>
                Ejecuta escenarios predefinidos para validar el endpoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">
                  {testScenarios.length} escenarios disponibles
                </p>
                <Button
                  onClick={handleRunAllTests}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <PlayCircle className="h-4 w-4" />
                  )}
                  <span>Ejecutar Todos</span>
                </Button>
              </div>

              <div className="space-y-3">
                {testScenarios.map((scenario) => {
                  const result = testResults.find(r => r.scenario === scenario.name);
                  return (
                    <div
                      key={scenario.name}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {result && getStatusIcon(result.status)}
                          <h4 className="font-medium">{scenario.name}</h4>
                          <Badge className={getStatusColor(result?.status || 'pending')}>
                            {result?.status || 'pending'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {scenario.description}
                        </p>
                        {result?.error && (
                          <p className="text-sm text-red-600 mt-1">
                            Error: {result.error}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Payload Tab */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="h-5 w-5" />
                <span>Payload Personalizado</span>
              </CardTitle>
              <CardDescription>
                Envía un payload JSON personalizado al endpoint
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="custom-payload">Payload JSON</Label>
                <Textarea
                  id="custom-payload"
                  placeholder="Introduce tu payload JSON aquí..."
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCustomPayload(JSON.stringify(samplePayload, null, 2))}
                >
                  Usar Ejemplo
                </Button>
                <Button
                  onClick={handleSendCustomPayload}
                  disabled={isLoading || !customPayload.trim()}
                  className="flex items-center space-x-2"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>Enviar</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Query Tab */}
        <TabsContent value="query" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Consultar Llamadas</span>
              </CardTitle>
              <CardDescription>
                Consulta llamadas específicas por ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="call-id">Call ID (UUID)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="call-id"
                    placeholder="a1b2c3d4-e5f6-4789-a123-456789abcdef"
                    value={callId}
                    onChange={(e) => setCallId(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleGetCall}
                    disabled={isLoading || !callId.trim()}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Estadísticas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleGetStats}
                  disabled={isLoading}
                  className="w-full mb-4"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Obtener Estadísticas
                </Button>
                {stats && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-medium">{stats.data?.total || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completadas:</span>
                      <span className="font-medium text-green-600">{stats.data?.completed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fallidas:</span>
                      <span className="font-medium text-red-600">{stats.data?.failed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Abandonadas:</span>
                      <span className="font-medium text-yellow-600">{stats.data?.abandoned || 0}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span>Coste Total:</span>
                      <span className="font-medium">
                        €{((stats.data?.totalCost || 0) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Llamadas Recientes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleGetRecentCalls}
                  disabled={isLoading}
                  className="w-full mb-4"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Obtener Recientes
                </Button>
                {recentCalls && (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2 text-sm">
                      {recentCalls.data?.map((call: any, index: number) => (
                        <div key={index} className="p-2 border rounded">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-xs">
                              {call.segurneo_call_id?.slice(0, 8)}...
                            </span>
                            <Badge className={getStatusColor(call.status)}>
                              {call.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {call.duration_seconds}s • €{(call.cost / 100).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Response Tab */}
        <TabsContent value="response" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Última Respuesta</span>
              </CardTitle>
              <CardDescription>
                Respuesta completa de la última petición
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lastResponse ? (
                <ScrollArea className="h-[400px]">
                  <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto">
                    {JSON.stringify(lastResponse, null, 2)}
                  </pre>
                </ScrollArea>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No hay respuestas aún. Ejecuta una petición para ver los resultados.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VoiceCallsTestPage; 