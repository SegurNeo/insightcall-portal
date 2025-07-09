import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Call, CallListResponse } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { callService } from "@/services/callService";

interface CallsTableProps {
  onViewDetails: (callId: string) => void;
  initialPage?: number;
  onPageChange?: (page: number) => void;
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getTicketBadgeVariant = (type: string | undefined) => {
  switch (type?.toLowerCase()) {
    case 'incidencia':
      return 'bg-destructive/20 text-destructive border-destructive/50';
    case 'consulta':
      return 'bg-primary/20 text-primary border-primary/50';
    case 'soporte':
      return 'bg-secondary/20 text-secondary border-secondary/50';
    default:
      return 'bg-muted/20 text-muted-foreground border-muted';
  }
};

export function CallsTable({ onViewDetails, initialPage = 1, onPageChange }: CallsTableProps) {
  const { data, isLoading, isError } = useQuery<CallListResponse>({
    queryKey: ['calls', initialPage],
    queryFn: () => callService.getCalls(initialPage, 10),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60, // 1 minuto
    refetchInterval: 1000 * 30 // 30 segundos
  });

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <div className="p-4 text-center text-destructive">Error al cargar las llamadas</div>;
  }

  const totalPages = Math.ceil((data?.total || 0) / 10);

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Fecha y Hora</TableHead>
            <TableHead>Duración</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Ticket</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.calls.map((call) => (
            <TableRow key={call.call_id} className="group hover:bg-muted/50">
              <TableCell className="font-medium">
                {call.call_id.slice(0, 8)}...
              </TableCell>
              <TableCell>
                {format(new Date(call.start_time_unix_secs * 1000), "PPp", { locale: es })}
              </TableCell>
              <TableCell>{formatDuration(call.call_duration_secs)}</TableCell>
              <TableCell>
                <Badge variant={call.call_successful === 'success' ? 'default' : 'destructive'}>
                  {call.status === 'completed' ? 'Completada' : 'Fallida'}
                </Badge>
              </TableCell>
              <TableCell>
                {call.ticket ? (
                  <Badge className={cn(
                    "border",
                    getTicketBadgeVariant(call.ticket.type)
                  )}>
                    {call.ticket.type}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">Sin ticket</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewDetails(call.call_id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>Ver detalles</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination
        currentPage={initialPage}
        totalPages={totalPages}
        onPageChange={(page) => {
          onPageChange?.(page);
        }}
      />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[100px]" />
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
} 