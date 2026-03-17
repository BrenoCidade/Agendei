import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "primary" | "success";
}

export function StatCard({ title, value, subtitle, icon: Icon, variant = "default" }: StatCardProps) {
  return (
    <Card className={cn(
      "p-5 transition-all duration-200 hover:shadow-md",
      variant === "primary" && "border-primary/20 bg-primary-light",
      variant === "success" && "border-success/20 bg-success/5"
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className={cn(
            "text-2xl font-bold",
            variant === "primary" && "text-primary",
            variant === "success" && "text-success",
            variant === "default" && "text-foreground"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center",
          variant === "primary" && "bg-primary text-primary-foreground",
          variant === "success" && "bg-success text-success-foreground",
          variant === "default" && "bg-muted text-muted-foreground"
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
