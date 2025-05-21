import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CallsTable } from "@/components/calls/CallsTable";
import { CallDetailsDialog } from "@/components/calls/CallDetailsDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Call, CallStatus, CallListResponse } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { callService } from "@/services/callService";

const CallsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<CallStatus>("all");
  const [selectedCall, setSelectedCall] = useState<Call>();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const { data, isLoading } = useQuery<CallListResponse, Error>({
    queryKey: ['calls', currentPage, selectedStatus, searchQuery],
    queryFn: () => callService.getCalls(currentPage, 10, {
      status: selectedStatus,
      searchQuery: searchQuery || undefined
    }),
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });

  const handleViewDetails = (callId: string) => {
    const call = data?.calls?.find(c => c.call_id === callId);
    if (call) {
      setSelectedCall(call);
      setIsDetailsOpen(true);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset página al buscar
  };

  const handleStatusChange = (status: CallStatus) => {
    setSelectedStatus(status);
    setCurrentPage(1); // Reset página al cambiar filtros
  };

  const filteredCalls = (data?.calls || []).filter((call) => {
    if (!call?.call_id || !call?.status) return false;
    const matchesSearch = searchQuery ? call.call_id.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    const matchesStatus = selectedStatus === "all" || call.status.toLowerCase() === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Llamadas</h1>
          <p className="text-muted-foreground">
            Gestiona y consulta todas las llamadas del asistente virtual
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-10" 
            placeholder="Buscar por ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
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
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full mb-6" onValueChange={(value) => setSelectedStatus(value as CallStatus)}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="completed">Completadas</TabsTrigger>
          <TabsTrigger value="processing">En Proceso</TabsTrigger>
          <TabsTrigger value="failed">Fallidas</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="mb-6">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Cargando llamadas...
          </div>
        ) : (
          <CallsTable 
            initialPage={currentPage}
            onViewDetails={handleViewDetails}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      <CallDetailsDialog
        call={selectedCall}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </DashboardLayout>
  );
};

export default CallsPage;
