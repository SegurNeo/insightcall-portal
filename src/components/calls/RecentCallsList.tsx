
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, Clock, Download, ExternalLink, Filter, MoreHorizontal, PhoneIncoming, PhoneMissed, UserCheck, X, History } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import CallHistoryDrawer from "./CallHistoryDrawer";

interface RecentCallsListProps {
  limit?: number;
}

// Sample data for recent calls
const recentCallsData = [
  {
    id: "CALL-1234",
    phone: "+34 911 234 567",
    date: "2023-05-03T09:24:00",
    duration: "3:45",
    agent: "María García",
    status: "Completada",
    category: "Consulta",
    recording: true,
    transcript: true,
  },
  {
    id: "CALL-1235",
    phone: "+34 922 345 678",
    date: "2023-05-03T10:12:00",
    duration: "2:13",
    agent: "Luis Martínez",
    status: "Completada",
    category: "Siniestro",
    recording: true,
    transcript: true,
  },
  {
    id: "CALL-1236",
    phone: "+34 933 456 789",
    date: "2023-05-03T11:30:00",
    duration: "4:27",
    agent: "Ana Rodríguez",
    status: "Derivada",
    category: "Venta",
    recording: true,
    transcript: true,
  },
  {
    id: "CALL-1237",
    phone: "+34 944 567 890",
    date: "2023-05-03T13:15:00",
    duration: "1:42",
    agent: "Carlos López",
    status: "Incidencia",
    category: "Consulta",
    recording: true,
    transcript: false,
  },
  {
    id: "CALL-1238",
    phone: "+34 955 678 901",
    date: "2023-05-03T14:05:00",
    duration: "5:18",
    agent: "Laura Fernández",
    status: "Completada",
    category: "Siniestro",
    recording: true,
    transcript: true,
  },
  {
    id: "CALL-1239",
    phone: "+34 966 789 012",
    date: "2023-05-03T15:32:00",
    duration: "3:05",
    agent: "Javier Hernández",
    status: "Perdida",
    category: "Venta",
    recording: false,
    transcript: false,
  },
  {
    id: "CALL-1240",
    phone: "+34 977 890 123",
    date: "2023-05-03T16:48:00",
    duration: "2:39",
    agent: "Elena Díaz",
    status: "Completada",
    category: "Consulta",
    recording: true,
    transcript: true,
  },
];

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
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', ' -');
  }
};

const RecentCallsList: React.FC<RecentCallsListProps> = ({ limit }) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: [] as string[],
    category: [] as string[],
    agent: [] as string[],
  });
  const [filteredData, setFilteredData] = useState(recentCallsData);
  const { toast } = useToast();
  
  // Estado para controlar la apertura del historial
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  
  const openHistory = (call: any) => {
    setSelectedCall(call);
    setHistoryOpen(true);
  };
  
  const applyFilters = () => {
    let result = [...recentCallsData];
    
    if (filters.status.length > 0) {
      result = result.filter(call => filters.status.includes(call.status));
    }
    
    if (filters.category.length > 0) {
      result = result.filter(call => filters.category.includes(call.category));
    }
    
    if (filters.agent.length > 0) {
      result = result.filter(call => filters.agent.includes(call.agent));
    }
    
    setFilteredData(result);
    
    toast({
      title: "Filtros aplicados",
      description: `Mostrando ${result.length} de ${recentCallsData.length} llamadas`,
    });
  };
  
  const resetFilters = () => {
    setFilters({
      status: [],
      category: [],
      agent: [],
    });
    setFilteredData(recentCallsData);
    
    toast({
      title: "Filtros reiniciados",
      description: "Mostrando todas las llamadas",
    });
  };
  
  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "Completada":
        return "outline";
      case "Derivada":
        return "secondary";
      case "Incidencia":
        return "destructive";
      case "Perdida":
        return "outline";
      default:
        return "secondary";
    }
  };
  
  const statusIcon = (status: string) => {
    switch (status) {
      case "Completada":
        return <Check className="h-3 w-3 text-primary" />;
      case "Derivada":
        return <ExternalLink className="h-3 w-3" />;
      case "Incidencia":
        return <X className="h-3 w-3" />;
      case "Perdida":
        return <PhoneMissed className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const displayData = limit ? filteredData.slice(0, limit) : filteredData;
  
  // Get unique values for filters
  const uniqueStatuses = [...new Set(recentCallsData.map(call => call.status))];
  const uniqueCategories = [...new Set(recentCallsData.map(call => call.category))];
  const uniqueAgents = [...new Set(recentCallsData.map(call => call.agent))];

  return (
    <>
      <CardContent className="p-0">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-sm font-medium">Mostrando {displayData.length} llamadas recientes</h3>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="h-3.5 w-3.5 mr-2" />
                Filtrar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Filtrar llamadas</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <h4 className="mb-2 text-sm font-medium">Estado</h4>
                  <ToggleGroup type="multiple" variant="outline" className="flex flex-wrap gap-2">
                    {uniqueStatuses.map(status => (
                      <ToggleGroupItem 
                        key={status} 
                        value={status}
                        aria-label={`Filtrar por ${status}`}
                        data-state={filters.status.includes(status) ? "on" : "off"}
                        onClick={() => {
                          setFilters(prev => {
                            if (prev.status.includes(status)) {
                              return {...prev, status: prev.status.filter(s => s !== status)};
                            } else {
                              return {...prev, status: [...prev.status, status]};
                            }
                          });
                        }}
                      >
                        {status}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
                
                <div>
                  <h4 className="mb-2 text-sm font-medium">Categoría</h4>
                  <ToggleGroup type="multiple" variant="outline" className="flex flex-wrap gap-2">
                    {uniqueCategories.map(category => (
                      <ToggleGroupItem 
                        key={category} 
                        value={category}
                        aria-label={`Filtrar por ${category}`}
                        data-state={filters.category.includes(category) ? "on" : "off"}
                        onClick={() => {
                          setFilters(prev => {
                            if (prev.category.includes(category)) {
                              return {...prev, category: prev.category.filter(c => c !== category)};
                            } else {
                              return {...prev, category: [...prev.category, category]};
                            }
                          });
                        }}
                      >
                        {category}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
                
                <div>
                  <h4 className="mb-2 text-sm font-medium">Agente</h4>
                  <ToggleGroup type="multiple" variant="outline" className="flex flex-wrap gap-2">
                    {uniqueAgents.map(agent => (
                      <ToggleGroupItem 
                        key={agent} 
                        value={agent}
                        aria-label={`Filtrar por ${agent}`}
                        data-state={filters.agent.includes(agent) ? "on" : "off"}
                        onClick={() => {
                          setFilters(prev => {
                            if (prev.agent.includes(agent)) {
                              return {...prev, agent: prev.agent.filter(a => a !== agent)};
                            } else {
                              return {...prev, agent: [...prev.agent, agent]};
                            }
                          });
                        }}
                      >
                        {agent.split(' ')[0]}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={resetFilters}>
                  Reiniciar
                </Button>
                <DialogClose asChild>
                  <Button onClick={applyFilters}>Aplicar filtros</Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Agente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Archivos</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((call) => (
                <TableRow 
                  key={call.id}
                  className="group hover:bg-secondary/40 transition-colors"
                  onMouseEnter={() => setHoveredRow(call.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <PhoneIncoming className="h-3.5 w-3.5 mr-2 text-primary" />
                      {call.id}
                    </div>
                  </TableCell>
                  <TableCell>{call.phone}</TableCell>
                  <TableCell>{formatDate(call.date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                      {call.duration}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground mr-2">
                        {call.agent.split(' ').map(name => name[0]).join('')}
                      </div>
                      {call.agent}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={statusBadgeVariant(call.status)}
                      className={cn(
                        "inline-flex items-center",
                        call.status === "Incidencia" ? "bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/20" : null,
                        call.status === "Completada" ? "text-primary" : null
                      )}
                    >
                      {statusIcon(call.status)}
                      <span className={cn("ml-1", statusIcon(call.status) ? "ml-1" : "ml-0")}>
                        {call.status}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {call.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {call.recording && (
                        <Badge variant="outline" className="bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors">
                          <Download className="h-3 w-3 mr-1" />
                          Audio
                        </Badge>
                      )}
                      {call.transcript && (
                        <Badge variant="outline" className="bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors">
                          <Download className="h-3 w-3 mr-1" />
                          Txt
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-primary"
                        onClick={() => openHistory(call)}
                        title="Ver historial"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                          <DropdownMenuItem>Escuchar grabación</DropdownMenuItem>
                          <DropdownMenuItem>Ver transcripción</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openHistory(call)}>
                            <History className="h-4 w-4 mr-2" />
                            Ver historial
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">Marcar incidencia</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {!limit && (
        <CardFooter className="flex items-center justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {displayData.length} de {recentCallsData.length} llamadas
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              Anterior
            </Button>
            <Button variant="outline" size="sm">
              Siguiente
            </Button>
          </div>
        </CardFooter>
      )}
      
      {/* Drawer para mostrar el historial de la llamada */}
      {selectedCall && (
        <CallHistoryDrawer
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          phoneNumber={selectedCall.phone}
          callId={selectedCall.id}
        />
      )}
    </>
  );
};

export default RecentCallsList;
