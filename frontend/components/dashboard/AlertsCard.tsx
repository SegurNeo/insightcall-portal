
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowUpRight, PhoneCall, TicketX, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Alert {
  id: string;
  type: "ticket" | "repeat_call" | "line_issue";
  title: string;
  description: string;
  time: string;
  severity: "low" | "medium" | "high";
  route: string;
}

interface AlertsCardProps {
  alerts: Alert[];
}

const AlertsCard = ({ alerts }: AlertsCardProps) => {
  const navigate = useNavigate();
  
  const getSeverityColor = (severity: Alert["severity"]) => {
    switch(severity) {
      case "high": return "text-destructive bg-destructive/10";
      case "medium": return "text-amber-600 bg-amber-500/10";
      case "low": return "text-primary bg-primary/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const getAlertIcon = (type: Alert["type"]) => {
    switch(type) {
      case "ticket": return <TicketX className="h-4 w-4" />;
      case "repeat_call": return <PhoneCall className="h-4 w-4" />;
      case "line_issue": return <UserX className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };
  
  const handleViewDetails = (alert: Alert) => {
    navigate(alert.route);
  };

  // Traduce la severidad a español
  const getSeverityLabel = (severity: Alert["severity"]) => {
    switch(severity) {
      case "high": return "Alta";
      case "medium": return "Media";
      case "low": return "Baja";
      default: return severity;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">Alertas pendientes</CardTitle>
          <p className="text-sm text-muted-foreground">
            {alerts.length > 0 
              ? `${alerts.length} alertas requieren atención` 
              : "No hay alertas pendientes"
            }
          </p>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{alert.title}</h4>
                    <Badge variant={
                      alert.severity === "high" 
                        ? "destructive" 
                        : alert.severity === "medium" 
                          ? "secondary" 
                          : "outline"
                    }>
                      {getSeverityLabel(alert.severity)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="h-auto p-0"
                      onClick={() => handleViewDetails(alert)}
                    >
                      Ver detalles
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <AlertTriangle className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-muted-foreground">No hay alertas pendientes de atención</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertsCard;
