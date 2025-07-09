
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Filter, FolderClosed, ExternalLink, Mail, Clock, MoreHorizontal } from "lucide-react";

const ActionsPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Acciones posteriores</h1>
          <p className="text-muted-foreground">
            Resumen de tareas o acciones que surgieron tras las llamadas
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Acciones pendientes</CardTitle>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="h-3.5 w-3.5 mr-2" />
              Filtrar
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID de llamada</TableHead>
                  <TableHead>Tipo de acción</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Enlaces</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actionsData.map((action) => (
                  <TableRow key={action.id} className="group hover:bg-secondary/40">
                    <TableCell className="font-medium">{action.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {action.type === "Ticket" && <FolderClosed className="h-4 w-4 text-yellow-500" />}
                        {action.type === "Derivación" && <ExternalLink className="h-4 w-4 text-blue-500" />}
                        {action.type === "Email" && <Mail className="h-4 w-4 text-green-500" />}
                        {action.type === "Seguimiento" && <Clock className="h-4 w-4 text-purple-500" />}
                        <span>{action.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{action.date}</TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        action.status === "Pendiente" ? "bg-yellow-100 text-yellow-800" :
                        action.status === "En curso" ? "bg-blue-100 text-blue-800" :
                        "bg-green-100 text-green-800"
                      }`}>
                        {action.status}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-xs font-medium">{action.assignee.split(' ').map(name => name[0]).join('')}</span>
                        </div>
                        <span>{action.assignee}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" className="h-7 px-2.5">
                          <span className="mr-1 text-xs">Llamada</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2.5">
                          <span className="mr-1 text-xs">Transcripción</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

// Sample data for actions
const actionsData = [
  {
    id: "CALL-1234",
    type: "Ticket",
    date: "03/05/2023",
    status: "Pendiente",
    assignee: "María García",
    links: {
      call: "/calls/CALL-1234",
      transcript: "/transcriptions/CALL-1234"
    }
  },
  {
    id: "CALL-1235",
    type: "Derivación",
    date: "03/05/2023",
    status: "En curso",
    assignee: "Luis Martínez",
    links: {
      call: "/calls/CALL-1235",
      transcript: "/transcriptions/CALL-1235"
    }
  },
  {
    id: "CALL-1236",
    type: "Email",
    date: "03/05/2023",
    status: "Resuelto",
    assignee: "Ana Rodríguez",
    links: {
      call: "/calls/CALL-1236",
      transcript: "/transcriptions/CALL-1236"
    }
  },
  {
    id: "CALL-1237",
    type: "Seguimiento",
    date: "03/05/2023",
    status: "Pendiente",
    assignee: "Carlos López",
    links: {
      call: "/calls/CALL-1237",
      transcript: "/transcriptions/CALL-1237"
    }
  }
];

export default ActionsPage;
