import { ServiceCard } from "./ServiceCard";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
}

interface ServiceListProps {
  services: Service[];
  selectedService: Service | null;
  onSelectService: (service: Service) => void;
}

export function ServiceList({ services, selectedService, onSelectService }: ServiceListProps) {
  return (
    <section className="animate-fade-in">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Escolha o serviço</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione o serviço desejado para continuar
        </p>
      </div>
      
      <div className="space-y-3">
        {services.map((service, index) => (
          <div 
            key={service.id}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <ServiceCard
              service={service}
              isSelected={selectedService?.id === service.id}
              onSelect={onSelectService}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
