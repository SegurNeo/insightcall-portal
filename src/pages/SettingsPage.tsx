
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

const SettingsPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ajustes</h1>
          <p className="text-muted-foreground">
            Configuraciones básicas de la cuenta y entorno
          </p>
        </div>

        <Tabs defaultValue="preferences">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="preferences">Preferencias</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
          </TabsList>

          <TabsContent value="preferences" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Ajustes generales</CardTitle>
                <CardDescription>
                  Configure sus preferencias de idioma, zona horaria y formato de fecha
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma por defecto</Label>
                  <select 
                    id="language" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona horaria</Label>
                  <select 
                    id="timezone" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="Europe/Madrid">(GMT+01:00) Madrid</option>
                    <option value="Europe/London">(GMT+00:00) London</option>
                    <option value="America/New_York">(GMT-05:00) New York</option>
                    <option value="Asia/Tokyo">(GMT+09:00) Tokyo</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Formato de fecha</Label>
                  <select 
                    id="dateFormat" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Notificaciones por email</Label>
                    <p className="text-sm text-muted-foreground">Recibir alertas sobre nuevas llamadas e incidencias</p>
                  </div>
                  <Switch id="notifications" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Guardar cambios</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Seguridad</CardTitle>
                <CardDescription>
                  Actualice su contraseña y configure la autenticación de dos factores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Contraseña actual</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva contraseña</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                  <Input id="confirm-password" type="password" />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="2fa">Autenticación de dos factores</Label>
                    <p className="text-sm text-muted-foreground">Añade una capa extra de seguridad a tu cuenta</p>
                  </div>
                  <Switch id="2fa" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Actualizar contraseña</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Usuarios</CardTitle>
                <CardDescription>
                  Gestión de usuarios con acceso al dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-medium text-primary">MG</span>
                      </div>
                      <div>
                        <p className="font-medium">María García</p>
                        <p className="text-sm text-muted-foreground">maria@nogalseguros.es</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-green-100 text-green-800 rounded-full px-2.5 py-0.5 text-xs font-medium mr-2">
                        Admin
                      </div>
                      <Button variant="ghost" size="sm">Editar</Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-medium text-primary">LM</span>
                      </div>
                      <div>
                        <p className="font-medium">Luis Martínez</p>
                        <p className="text-sm text-muted-foreground">luis@nogalseguros.es</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-blue-100 text-blue-800 rounded-full px-2.5 py-0.5 text-xs font-medium mr-2">
                        Usuario
                      </div>
                      <Button variant="ghost" size="sm">Editar</Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-medium text-primary">AR</span>
                      </div>
                      <div>
                        <p className="font-medium">Ana Rodríguez</p>
                        <p className="text-sm text-muted-foreground">ana@nogalseguros.es</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-yellow-100 text-yellow-800 rounded-full px-2.5 py-0.5 text-xs font-medium mr-2">
                        Visor
                      </div>
                      <Button variant="ghost" size="sm">Editar</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Añadir usuario
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
