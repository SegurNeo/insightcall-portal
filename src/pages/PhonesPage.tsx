
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Filter, Phone, Plus, MoreHorizontal } from "lucide-react";

const PhonesPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Números de teléfono</h1>
            <p className="text-muted-foreground">
              Gestión de los números virtuales utilizados
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Añadir número
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Números activos</CardTitle>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="h-3.5 w-3.5 mr-2" />
              Filtrar
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Nombre interno</TableHead>
                  <TableHead>País / prefijo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de alta</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phonesData.map((phone) => (
                  <TableRow key={phone.id} className="group hover:bg-secondary/40">
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span>{phone.number}</span>
                      </div>
                    </TableCell>
                    <TableCell>{phone.name}</TableCell>
                    <TableCell>{phone.country}</TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        phone.status === "Activo" ? "bg-green-100 text-green-800" :
                        phone.status === "Inactivo" ? "bg-gray-100 text-gray-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {phone.status}
                      </div>
                    </TableCell>
                    <TableCell>{phone.registrationDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{phone.usage} llamadas</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" className="h-8">
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
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

// Sample data for phones
const phonesData = [
  {
    id: 1,
    number: "+34 911 234 567",
    name: "Línea Madrid",
    country: "España (+34)",
    status: "Activo",
    registrationDate: "15/01/2023",
    usage: 2453
  },
  {
    id: 2,
    number: "+34 922 345 678",
    name: "Línea Soporte Salud",
    country: "España (+34)",
    status: "Activo",
    registrationDate: "20/02/2023",
    usage: 1876
  },
  {
    id: 3,
    number: "+34 933 456 789",
    name: "Línea Barcelona",
    country: "España (+34)",
    status: "Activo",
    registrationDate: "10/03/2023",
    usage: 945
  },
  {
    id: 4,
    number: "+44 20 1234 5678",
    name: "Línea Londres",
    country: "Reino Unido (+44)",
    status: "Inactivo",
    registrationDate: "05/04/2023",
    usage: 123
  },
  {
    id: 5,
    number: "+33 1 23 45 67 89",
    name: "Línea París",
    country: "Francia (+33)",
    status: "En revisión",
    registrationDate: "01/05/2023",
    usage: 67
  }
];

export default PhonesPage;
