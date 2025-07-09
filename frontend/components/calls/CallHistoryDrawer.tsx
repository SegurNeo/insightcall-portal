
import React from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { XCircle, Phone, Clock, AlertTriangle, FileText, MessageSquare, Calendar, Database, ExternalLink, Info } from "lucide-react";

// Tipos para el historial
export interface HistoryEvent {
  id: string;
  type: "call" | "transcription" | "ticket" | "note" | "email";
  title: string;
  description: string;
  date: string;
  callId?: string;
}

interface CallHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  callId: string;
}

// Datos de ejemplo para el historial
const generateHistoryForPhone = (phoneNumber: string, currentCallId: string) => {
  return [
    {
      id: "hist-001",
      type: "call",
      title: "Llamada entrante",
      description: "Consulta sobre cobertura de seguro de hogar",
      date: "2023-05-01T14:30:00",
      callId: "CALL-1230",
    },
    {
      id: "hist-002",
      type: "transcription",
      title: "Transcripción generada",
      description: "Transcripción completa de la llamada anterior",
      date: "2023-05-01T14:35:00",
      callId: "CALL-1230",
    },
    {
      id: "hist-003",
      type: "ticket",
      title: "Ticket creado",
      description: "Seguimiento para ampliar cobertura",
      date: "2023-05-01T14:40:00",
      callId: "CALL-1230",
    },
    {
      id: "hist-004",
      type: "email",
      title: "Email enviado",
      description: "Información sobre ampliación de cobertura",
      date: "2023-05-02T09:15:00"
    },
    {
      id: "hist-005",
      type: "call",
      title: "Llamada saliente",
      description: "Seguimiento de ampliación de cobertura",
      date: "2023-05-04T11:20:00",
      callId: "CALL-1235",
    },
    {
      id: "hist-006",
      type: "note",
      title: "Nota añadida",
      description: "Cliente interesado en producto adicional",
      date: "2023-05-04T11:25:00",
      callId: "CALL-1235",
    },
    {
      id: "hist-007",
      type: "call",
      title: "Llamada actual",
      description: "Consulta sobre siniestro reciente",
      date: new Date().toISOString(),
      callId: currentCallId,
    },
  ];
};

const getEventIcon = (type: string) => {
  switch (type) {
    case "call":
      return <Phone className="h-4 w-4" />;
    case "transcription":
      return <FileText className="h-4 w-4" />;
    case "ticket":
      return <AlertTriangle className="h-4 w-4" />;
    case "note":
      return <MessageSquare className="h-4 w-4" />;
    case "email":
      return <MessageSquare className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  if (isToday) {
    return `Hoy, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (isYesterday) {
    return `Ayer, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', ' -');
  }
};

const CallHistoryDrawer: React.FC<CallHistoryDrawerProps> = ({ 
  open, 
  onOpenChange, 
  phoneNumber,
  callId 
}) => {
  const { toast } = useToast();
  const historyEvents = generateHistoryForPhone(phoneNumber, callId);
  
  const handleConnectERP = () => {
    toast({
      title: "Conexión con ERP",
      description: "Contacta con Segurneo para comenzar esta implementación",
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[80vh] max-h-[80vh]">
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
        <DrawerHeader className="pb-0">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-xl">Historial de interacciones</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <XCircle className="h-5 w-5" />
              </Button>
            </DrawerClose>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            <Phone className="inline-block h-3.5 w-3.5 mr-1" />
            {phoneNumber}
          </div>
        </DrawerHeader>
        
        <div className="px-4 py-3">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            onClick={handleConnectERP}
          >
            <Database className="h-4 w-4 mr-2" />
            Conectar con ERP
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
        
        <Alert variant="default" className="mx-4 bg-amber-50 text-amber-900 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-sm">
            Conecta con tu ERP para tener acceso completo al historial del cliente
          </AlertDescription>
        </Alert>
        
        <div className="p-4">
          <div className="text-sm font-medium mb-2 flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            Eventos recientes
          </div>
          
          <ScrollArea className="h-[calc(80vh-200px)]">
            <div className="relative ml-2">
              {/* Línea de tiempo vertical */}
              <div className="absolute left-3 top-1 bottom-1 w-0.5 bg-muted"></div>
              
              <div className="space-y-4">
                {historyEvents.map((event) => (
                  <div key={event.id} className="relative pl-8">
                    {/* Punto en la línea de tiempo */}
                    <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full bg-background border border-input flex items-center justify-center">
                      {getEventIcon(event.type)}
                    </div>
                    
                    <div className="bg-card border rounded-md p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-muted-foreground mt-0.5">
                            {event.description}
                          </div>
                        </div>
                        
                        <Badge variant="outline" className="ml-2 text-xs">
                          {event.type}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs mt-2">
                        <span className="text-muted-foreground">
                          <Clock className="inline-block h-3 w-3 mr-1" />
                          {formatDate(event.date)}
                        </span>
                        
                        {event.callId && (
                          <Button variant="ghost" size="sm" className="h-7 px-2">
                            Ver detalle
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CallHistoryDrawer;
