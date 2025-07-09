
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Download, FileText, Filter, Plus } from "lucide-react";

const InvoicingPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
          <p className="text-muted-foreground">
            Panel para revisar pagos y facturas
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Método de pago</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-md">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Visa terminada en 4242</p>
                  <p className="text-xs text-muted-foreground">Expira: 12/2025</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-4 w-full">
                Actualizar método de pago
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consumo actual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between">
                  <p className="text-muted-foreground">Llamadas:</p>
                  <p className="font-medium">1,234</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-muted-foreground">Minutos totales:</p>
                  <p className="font-medium">4,567</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-muted-foreground">Facturación estimada:</p>
                  <p className="font-medium">€2,345.67</p>
                </div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Periodo: 01/05/2023 - 31/05/2023
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Descargar facturas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <p className="text-sm text-muted-foreground">Descarga todas las facturas en un solo archivo</p>
                <Button variant="outline" size="sm" className="mt-2 w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar todas
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Historial de facturas</CardTitle>
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
                  <TableHead>Fecha</TableHead>
                  <TableHead>Periodo facturado</TableHead>
                  <TableHead>Importe</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Descargar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoicesData.map((invoice) => (
                  <TableRow key={invoice.id} className="group hover:bg-secondary/40">
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span>{invoice.number}</span>
                      </div>
                    </TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>{invoice.period}</TableCell>
                    <TableCell className="font-medium">{invoice.amount}</TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        invoice.status === "Pagado" ? "bg-green-100 text-green-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {invoice.status}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Download className="h-4 w-4" />
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

// Sample data for invoices
const invoicesData = [
  {
    id: 1,
    number: "INV-2023-05",
    date: "31/05/2023",
    period: "01/05/2023 - 31/05/2023",
    amount: "€2,345.67",
    status: "Pagado"
  },
  {
    id: 2,
    number: "INV-2023-04",
    date: "30/04/2023",
    period: "01/04/2023 - 30/04/2023",
    amount: "€2,156.42",
    status: "Pagado"
  },
  {
    id: 3,
    number: "INV-2023-03",
    date: "31/03/2023",
    period: "01/03/2023 - 31/03/2023",
    amount: "€1,984.29",
    status: "Pagado"
  },
  {
    id: 4,
    number: "INV-2023-02",
    date: "28/02/2023",
    period: "01/02/2023 - 28/02/2023",
    amount: "€1,765.38",
    status: "Pagado"
  },
  {
    id: 5,
    number: "INV-2023-01",
    date: "31/01/2023",
    period: "01/01/2023 - 31/01/2023",
    amount: "€1,523.91",
    status: "Pagado"
  }
];

export default InvoicingPage;
