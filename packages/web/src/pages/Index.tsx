import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ProviderHeader } from "@/components/booking/ProviderHeader";
import { ServiceList } from "@/components/booking/ServiceList";
import { DateTimePicker } from "@/components/booking/DateTimePicker";
import { CustomerForm } from "@/components/booking/CustomerForm";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { StepIndicator } from "@/components/booking/StepIndicator";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type {
  AppointmentResponse,
  AvailableSlotsResponseDTO,
  ServiceResponseDTO,
} from "@saas/shared";

const steps = [
  { id: 1, label: "Serviço" },
  { id: 2, label: "Horário" },
  { id: 3, label: "Dados" },
];

interface Service {
  id: string;
  name: string;
  price: number;
  durationInMinutes: number;
  duration: string;
  description: string;
}

interface PublicProviderProfileDTO {
  slug: string;
  businessName: string;
  name: string;
  phone: string | null;
  services: ServiceResponseDTO[];
}

const DEFAULT_PUBLIC_SLUG =
  import.meta.env.VITE_PUBLIC_PROVIDER_SLUG ?? "barbearia-estilo";

const Index = () => {
  const { toast } = useToast();
  const providerSlug = DEFAULT_PUBLIC_SLUG;

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const { data: provider } = useQuery({
    queryKey: ["public-provider", providerSlug],
    queryFn: async () => {
      const res = await api.get<PublicProviderProfileDTO>(
        `/public/${providerSlug}`,
      );
      return res.data;
    },
  });

  const services: Service[] = (provider?.services ?? []).map((service) => ({
    id: service.id,
    name: service.name,
    price: service.priceInCents / 100,
    durationInMinutes: service.durationInMinutes,
    duration: `${service.durationInMinutes} min`,
    description: service.description ?? "Sem descrição",
  }));

  const selectedDateString = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;

  const { data: slotsData, isFetching: isLoadingSlots } = useQuery({
    queryKey: ["public-slots", providerSlug, selectedService?.id, selectedDateString],
    queryFn: async () => {
      const res = await api.get<AvailableSlotsResponseDTO>(
        `/public/${providerSlug}/slots`,
        {
          params: {
            date: selectedDateString,
            serviceId: selectedService?.id,
          },
        },
      );

      return res.data;
    },
    enabled: Boolean(selectedService?.id && selectedDateString),
  });

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedService || !selectedDate || !selectedTime) {
        throw new Error("Missing booking data");
      }

      const [hours, minutes] = selectedTime.split(":").map(Number);
      const startsAt = new Date(selectedDate);
      startsAt.setHours(hours, minutes, 0, 0);

      const endsAt = new Date(
        startsAt.getTime() + selectedService.durationInMinutes * 60 * 1000,
      );

      const res = await api.post<AppointmentResponse>(
        `/public/${providerSlug}/schedule`,
        {
          customerName,
          customerEmail,
          customerPhone,
          serviceId: selectedService.id,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        },
      );

      return res.data;
    },
    onSuccess: () => {
      toast({
        title: "Agendamento confirmado!",
        description: `${selectedService?.name} em ${selectedDate?.toLocaleDateString("pt-BR")} as ${selectedTime}`,
      });

      setSelectedService(null);
      setSelectedDate(undefined);
      setSelectedTime(null);
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
    },
    onError: () => {
      toast({
        title: "Nao foi possivel concluir o agendamento",
        description: "Confira os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Calculate current step based on selections
  useEffect(() => {
    if (selectedService && selectedDate && selectedTime) {
      setCurrentStep(3);
    } else if (selectedService) {
      setCurrentStep(2);
    } else {
      setCurrentStep(1);
    }
  }, [selectedService, selectedDate, selectedTime]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirm = () => {
    scheduleMutation.mutate();
  };

  const timeSlots = slotsData?.slots ?? [];

  return (
    <div className="min-h-screen bg-background pb-32">
      <ProviderHeader
        name={provider?.businessName ?? "Carregando..."}
        avatar="https://github.com/shadcn.png"
        address={provider?.phone ? `Contato: ${provider.phone}` : `@${providerSlug}`}
        isOpen={true}
      />

      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40">
        <div className="container max-w-lg mx-auto">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>
      </div>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-8">
        <ServiceList
          services={services}
          selectedService={selectedService}
          onSelectService={handleServiceSelect}
        />

        {selectedService && (
          <DateTimePicker
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            timeSlots={isLoadingSlots ? [] : timeSlots}
            onDateSelect={handleDateSelect}
            onTimeSelect={handleTimeSelect}
          />
        )}

        {selectedService && selectedDate && selectedTime && (
          <CustomerForm
            name={customerName}
            email={customerEmail}
            phone={customerPhone}
            onNameChange={setCustomerName}
            onEmailChange={setCustomerEmail}
            onPhoneChange={setCustomerPhone}
          />
        )}
      </main>

      <BookingSummary
        service={selectedService}
        date={selectedDate}
        time={selectedTime}
        customerName={customerName}
        customerEmail={customerEmail}
        customerPhone={customerPhone}
        isConfirming={scheduleMutation.isPending}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default Index;
