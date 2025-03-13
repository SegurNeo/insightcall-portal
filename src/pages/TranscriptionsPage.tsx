
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, Filter, Download, Clock, MessageSquare, Copy, Phone, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// Sample data for transcriptions
const transcriptionsData = [
  {
    id: "TRANS-1234",
    callId: "CALL-1234",
    date: "2023-05-03T09:24:00",
    phone: "+34 911 234 567",
    duration: "3:45",
    summary: "Consulta sobre cobertura de seguro de hogar para daños por agua",
    agent: "María García",
    category: "Consulta",
    content: `
Cliente: Buenos días, llamo por un tema de mi seguro de hogar.
Asistente: Buenos días, ¿en qué puedo ayudarle?
Cliente: Tengo una duda sobre la cobertura de daños por agua. Ayer tuve una fuga en el baño y quería saber si está cubierto.
Asistente: Por supuesto, voy a revisar su póliza. ¿Podría facilitarme su número de póliza o DNI?
Cliente: Sí, mi DNI es 12345678A.
Asistente: Gracias. Estoy consultando su póliza... Efectivamente, su seguro de hogar incluye cobertura por daños por agua, incluyendo fugas accidentales. ¿Podría describir brevemente qué ha ocurrido?
Cliente: Se rompió una tubería bajo el lavabo y se ha mojado parte del suelo del baño y algo de la pared.
Asistente: Entiendo. En este caso, está cubierto por su póliza. Voy a iniciar el proceso de reclamación. ¿Ha tomado fotos de los daños?
Cliente: Sí, tengo algunas fotos en el móvil.
Asistente: Perfecto. Le enviaré un email con un enlace donde podrá subir las fotos y completar algunos detalles adicionales. Después un perito se pondrá en contacto con usted para evaluar los daños. ¿Le parece bien?
Cliente: Sí, perfecto. ¿Cuánto tardará aproximadamente?
Asistente: El perito se pondrá en contacto en un plazo máximo de 48 horas laborables. ¿Hay alguna franja horaria que le venga mejor para la visita?
Cliente: Preferiblemente por las tardes, después de las 17:00.
Asistente: Perfecto, lo anotaré en la solicitud. ¿Tiene alguna otra pregunta?
Cliente: No, eso es todo. Gracias por la ayuda.
Asistente: Ha sido un placer atenderle. Recibirá el email en breve. Que tenga un buen día.
Cliente: Igualmente, adiós.
`
  },
  {
    id: "TRANS-1235",
    callId: "CALL-1235",
    date: "2023-05-03T10:12:00",
    phone: "+34 922 345 678",
    duration: "2:13",
    summary: "Comunicación de siniestro de vehículo por golpe en estacionamiento",
    agent: "Luis Martínez",
    category: "Siniestro",
    content: "Transcripción completa..."
  },
  {
    id: "TRANS-1236",
    callId: "CALL-1236",
    date: "2023-05-03T11:30:00",
    phone: "+34 933 456 789",
    duration: "4:27",
    summary: "Consulta sobre planes de seguro de vida con inversión",
    agent: "Ana Rodríguez",
    category: "Venta",
    content: "Transcripción completa..."
  },
  {
    id: "TRANS-1238",
    callId: "CALL-1238",
    date: "2023-05-03T14:05:00",
    phone: "+34 955 678 901",
    duration: "5:18",
    summary: "Denuncia de siniestro por robo en domicilio asegurado",
    agent: "Laura Fernández",
    category: "Siniestro",
    content: "Transcripción completa..."
  },
  {
    id: "TRANS-1240",
    callId: "CALL-1240",
    date: "2023-05-03T16:48:00",
    phone: "+34 977 890 123",
    duration: "2:39",
    summary: "Consulta sobre modificación de coberturas en póliza actual",
    agent: "Elena Díaz",
    category: "Consulta",
    content: "Transcripción completa..."
  },
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(',', ' -');
};

const TranscriptionsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTranscription, setSelectedTranscription] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredTranscriptions = transcriptionsData.filter(
    transcription => 
      transcription.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transcription.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transcription.phone.includes(searchTerm)
  );

  const openTranscription = (transcription: any) => {
    setSelectedTranscription(transcription);
    setDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Transcripciones</h1>
          <p className="text-muted-foreground">
            Consulta las transcripciones de las llamadas
          </p>
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-10" 
              placeholder="Buscar transcripciones..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Tabs defaultValue="all" className="w-full md:w-auto">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">Todas</TabsTrigger>
            <TabsTrigger value="consulta" className="flex-1">Consultas</TabsTrigger>
            <TabsTrigger value="siniestro" className="flex-1">Siniestros</TabsTrigger>
            <TabsTrigger value="venta" className="flex-1">Ventas</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Select defaultValue="7days">
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
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

          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTranscriptions.map((transcription) => (
          <Card 
            key={transcription.id} 
            className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={() => openTranscription(transcription)}
          >
            <CardHeader className="p-4 pb-2 space-y-0">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="mb-1">
                  {transcription.category}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <CardTitle className="text-base">{transcription.summary}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="flex items-center text-sm mb-3 text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                <span className="mr-3">{transcription.id}</span>
                <Phone className="h-3.5 w-3.5 mr-1" />
                <span>{transcription.callId}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  <span>{transcription.duration}</span>
                </div>
                <div className="text-muted-foreground text-xs">
                  {formatDate(transcription.date)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Transcripción {selectedTranscription?.id}</DialogTitle>
            <DialogDescription>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="outline">
                  <Phone className="h-3.5 w-3.5 mr-1" />
                  {selectedTranscription?.callId}
                </Badge>
                <Badge variant="outline">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {selectedTranscription && formatDate(selectedTranscription.date)}
                </Badge>
                <Badge variant="outline">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  {selectedTranscription?.duration}
                </Badge>
                <Badge variant="secondary">
                  {selectedTranscription?.category}
                </Badge>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-2">
            <h3 className="font-medium mb-1">Resumen</h3>
            <p className="text-muted-foreground">{selectedTranscription?.summary}</p>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <h3 className="font-medium">Transcripción Completa</h3>
              <Button variant="outline" size="sm" className="h-8">
                <Copy className="h-3.5 w-3.5 mr-2" />
                Copiar
              </Button>
            </div>
            <Card className="border-dashed">
              <ScrollArea className="h-[300px] p-4">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {selectedTranscription?.content || "Contenido no disponible"}
                </pre>
              </ScrollArea>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TranscriptionsPage;
