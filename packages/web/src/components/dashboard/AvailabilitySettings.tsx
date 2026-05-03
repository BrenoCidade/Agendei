import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AvailabilityResponseDTO,
  SetWeekAvailabilityDTO,
  TimeSlotDTO,
} from "@saas/shared";
import {
  AlertCircle,
  Clock,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api, getApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  dayOfWeek: number;
  name: string;
  shortName: string;
  active: boolean;
  slots: TimeSlot[];
}

const baseWeek: DaySchedule[] = [
  { dayOfWeek: 1, name: "Segunda-feira", shortName: "Seg", active: false, slots: [] },
  { dayOfWeek: 2, name: "Terca-feira", shortName: "Ter", active: false, slots: [] },
  { dayOfWeek: 3, name: "Quarta-feira", shortName: "Qua", active: false, slots: [] },
  { dayOfWeek: 4, name: "Quinta-feira", shortName: "Qui", active: false, slots: [] },
  { dayOfWeek: 5, name: "Sexta-feira", shortName: "Sex", active: false, slots: [] },
  { dayOfWeek: 6, name: "Sabado", shortName: "Sab", active: false, slots: [] },
  { dayOfWeek: 0, name: "Domingo", shortName: "Dom", active: false, slots: [] },
];

function mapAvailabilityToSchedule(data?: AvailabilityResponseDTO[]) {
  if (!data) {
    return baseWeek;
  }

  return baseWeek.map((baseDay) => {
    const availability = data.find((item) => item.dayOfWeek === baseDay.dayOfWeek);
    if (!availability) {
      return baseDay;
    }

    return {
      ...baseDay,
      active: availability.isActive,
      slots: availability.slots as TimeSlotDTO[],
    };
  });
}

export function AvailabilitySettings() {
  const queryClient = useQueryClient();
  const [schedule, setSchedule] = useState<DaySchedule[]>(baseWeek);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["availability"],
    queryFn: async () => {
      const response = await api.get<AvailabilityResponseDTO[]>("/availability");
      return response.data;
    },
  });

  const mappedAvailability = useMemo(() => mapAvailabilityToSchedule(data), [data]);
  const isDirty = useMemo(
    () => JSON.stringify(schedule) !== JSON.stringify(mappedAvailability),
    [mappedAvailability, schedule],
  );

  useEffect(() => {
    setSchedule(mappedAvailability);
  }, [mappedAvailability]);

  const saveMutation = useMutation({
    mutationFn: async (payload: SetWeekAvailabilityDTO) => {
      const response = await api.put<AvailabilityResponseDTO[]>("/availability/week", payload);
      return response.data;
    },
    onSuccess: (savedAvailability) => {
      queryClient.setQueryData(["availability"], savedAvailability);
      setSchedule(mapAvailabilityToSchedule(savedAvailability));
      setSaveError(null);
      toast.success("Horarios salvos com sucesso.");
    },
    onError: (mutationError) => {
      const message = getApiErrorMessage(
        mutationError,
        "Nao foi possivel salvar os horarios.",
      );
      setSaveError(message);
      toast.error(message);
    },
  });

  const toggleDay = (dayOfWeek: number) => {
    setSchedule((previous) =>
      previous.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? {
              ...day,
              active: !day.active,
              slots: !day.active ? [{ start: "09:00", end: "18:00" }] : day.slots,
            }
          : day,
      ),
    );
  };

  const updateSlot = (
    dayOfWeek: number,
    slotIndex: number,
    field: "start" | "end",
    value: string,
  ) => {
    setSchedule((previous) =>
      previous.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) {
          return day;
        }

        const nextSlots = [...day.slots];
        nextSlots[slotIndex] = { ...nextSlots[slotIndex], [field]: value };
        return { ...day, slots: nextSlots };
      }),
    );
  };

  const addSlot = (dayOfWeek: number) => {
    setSchedule((previous) =>
      previous.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? {
              ...day,
              slots: [...day.slots, { start: "13:00", end: "18:00" }],
            }
          : day,
      ),
    );
  };

  const removeSlot = (dayOfWeek: number, slotIndex: number) => {
    setSchedule((previous) =>
      previous.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? {
              ...day,
              slots: day.slots.filter((_, index) => index !== slotIndex),
            }
          : day,
      ),
    );
  };

  const handleSave = () => {
    setSaveError(null);

    const activeDays = schedule.filter((day) => day.active);

    for (const day of activeDays) {
      if (day.slots.length === 0) {
        setSaveError(`Defina ao menos um intervalo para ${day.name}.`);
        return;
      }
    }

    saveMutation.mutate({
      availabilities: activeDays.map((day) => ({
        isActive: true,
        dayOfWeek: day.dayOfWeek,
        slots: day.slots,
      })),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Configurar disponibilidade
          </CardTitle>
          <CardDescription>
            Defina seus horarios de trabalho para cada dia da semana
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Nao foi possivel carregar sua disponibilidade</AlertTitle>
              <AlertDescription className="space-y-4">
                <p>{getApiErrorMessage(error, "Tente novamente em instantes.")}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => void refetch()}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {saveError && !isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Falha ao salvar horarios</AlertTitle>
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}

          {schedule.map((day) => (
            <div
              key={day.dayOfWeek}
              className={`rounded-lg border p-4 transition-colors ${
                day.active
                  ? "border-border bg-card"
                  : "border-transparent bg-muted/30"
              }`}
            >
              {/* Day toggle row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={day.active}
                    onCheckedChange={() => toggleDay(day.dayOfWeek)}
                  />
                  <Label
                    className={`font-medium ${
                      !day.active ? "text-muted-foreground" : ""
                    }`}
                  >
                    {day.name}
                  </Label>
                </div>
                {!day.active && (
                  <span className="text-sm italic text-muted-foreground">
                    Fechado
                  </span>
                )}
              </div>

              {/* Slots — stacked below the toggle row */}
              {day.active && (
                <div className="mt-3 space-y-2 pl-[calc(2rem+12px)]">
                  {day.slots.map((slot, slotIndex) => (
                    <div key={slotIndex} className="flex flex-wrap items-center gap-2">
                      <Input
                        type="time"
                        value={slot.start}
                        onChange={(event) =>
                          updateSlot(
                            day.dayOfWeek,
                            slotIndex,
                            "start",
                            event.target.value,
                          )
                        }
                        className="w-[110px] min-w-0"
                      />
                      <span className="text-sm text-muted-foreground">até</span>
                      <Input
                        type="time"
                        value={slot.end}
                        onChange={(event) =>
                          updateSlot(
                            day.dayOfWeek,
                            slotIndex,
                            "end",
                            event.target.value,
                          )
                        }
                        className="w-[110px] min-w-0"
                      />
                      {day.slots.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSlot(day.dayOfWeek, slotIndex)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addSlot(day.dayOfWeek)}
                    className="text-primary hover:text-primary"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Adicionar intervalo
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="sticky bottom-4">
        <Button
          onClick={handleSave}
          className="w-full shadow-lg"
          disabled={isLoading || isError || saveMutation.isPending || !isDirty}
        >
          <Save className="mr-2 h-4 w-4" />
          {saveMutation.isPending ? "Salvando..." : "Salvar alteracoes"}
        </Button>
      </div>
    </div>
  );
}
