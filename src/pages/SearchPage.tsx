
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Search, Filter } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SearchFilters {
  dateFrom: string;
  dateTo: string;
  callStatus: string;
  durationMin: string;
  durationMax: string;
  postAction: string;
}

const SearchPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    dateFrom: "",
    dateTo: "",
    callStatus: "",
    durationMin: "",
    durationMax: "",
    postAction: ""
  });
  const [hasSearched, setHasSearched] = useState(false);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchSubmit = () => {
    if (!searchQuery && !Object.values(filters).some(value => value)) {
      toast({
        title: "Campos vacíos",
        description: "Por favor, introduce algún término de búsqueda o filtro.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Búsqueda realizada",
      description: "Se han aplicado los filtros especificados."
    });
    setHasSearched(true);

    // Aquí iría la lógica de búsqueda real
    console.log("Search query:", searchQuery);
    console.log("Filters:", filters);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Buscar</h1>
          <p className="text-muted-foreground">
            Encuentra llamadas por número de teléfono, ID de llamada o nombre del cliente
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Búsqueda avanzada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por teléfono, ID o nombre del cliente..."
                  className="pl-10 pr-4"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Rango de fecha</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      type="date" 
                      placeholder="Desde" 
                      name="dateFrom"
                      value={filters.dateFrom}
                      onChange={handleFilterChange}
                    />
                    <Input 
                      type="date" 
                      placeholder="Hasta" 
                      name="dateTo"
                      value={filters.dateTo}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Estado de llamada</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    name="callStatus"
                    value={filters.callStatus}
                    onChange={handleFilterChange}
                  >
                    <option value="">Todos</option>
                    <option value="completed">Completada</option>
                    <option value="incident">Incidencia</option>
                    <option value="redirected">Redirigida</option>
                    <option value="missed">Perdida</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Duración</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      type="number" 
                      placeholder="Mín. (s)" 
                      name="durationMin"
                      value={filters.durationMin}
                      onChange={handleFilterChange}
                    />
                    <Input 
                      type="number" 
                      placeholder="Máx. (s)" 
                      name="durationMax"
                      value={filters.durationMax}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Acciones posteriores</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    name="postAction"
                    value={filters.postAction}
                    onChange={handleFilterChange}
                  >
                    <option value="">Todas</option>
                    <option value="ticket">Ticket creado</option>
                    <option value="email">Email enviado</option>
                    <option value="followup">Seguimiento pendiente</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="flex gap-2" onClick={handleSearchSubmit}>
                  <Filter className="h-4 w-4" />
                  Aplicar filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              {hasSearched ? (
                <div className="text-center text-muted-foreground py-10">
                  No se encontraron resultados para esta búsqueda.
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-10">
                  Use el buscador para encontrar llamadas
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SearchPage;
