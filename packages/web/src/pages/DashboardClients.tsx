import { Search, Phone, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const clients = [
  { id: 1, name: "Carlos Silva", phone: "(11) 99999-1234", lastVisit: "20/12/2024", visits: 12 },
  { id: 2, name: "Marcos Rocha", phone: "(11) 98888-5678", lastVisit: "18/12/2024", visits: 8 },
  { id: 3, name: "João Pedro", phone: "(11) 97777-9012", lastVisit: "15/12/2024", visits: 5 },
  { id: 4, name: "Roberto Firmino", phone: "(11) 96666-3456", lastVisit: "10/12/2024", visits: 3 },
];

export default function DashboardClients() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Clientes</h2>
        <p className="text-sm text-muted-foreground">Visualize seus clientes cadastrados</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          className="pl-10 h-11"
        />
      </div>

      <div className="grid gap-4">
        {clients.map((client, index) => (
          <Card
            key={client.id}
            className="p-4 animate-slide-up hover:shadow-md transition-shadow"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary-light text-primary font-semibold">
                  {client.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground">{client.name}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {client.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Última visita: {client.lastVisit}
                  </span>
                </div>
              </div>

              <div className="text-right hidden sm:block">
                <span className="text-2xl font-bold text-primary">{client.visits}</span>
                <p className="text-xs text-muted-foreground">visitas</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
