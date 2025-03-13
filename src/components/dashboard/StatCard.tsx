
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  className?: string;
}

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeType = "neutral",
  className 
}: StatCardProps) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {change && (
          <div className="mt-4">
            <Badge 
              variant={
                changeType === "positive" 
                  ? "outline" 
                  : changeType === "negative" 
                    ? "destructive" 
                    : "secondary"
              } 
              className="font-normal"
            >
              {change}
            </Badge>
            <span className="text-xs text-muted-foreground ml-2">vs. semana pasada</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
