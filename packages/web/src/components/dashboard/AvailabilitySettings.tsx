import { useEffect, useMemo, useState } from "react";
import { Clock, Plus, Trash2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AvailabilityResponseDTO, TimeSlotDTO } from "@saas/shared";
import axios from "axios";

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
  { dayOfWeek: 2, name: "Terça-feira", shortName: "Ter", active: false, slots: [] },
  { dayOfWeek: 3, name: "Quarta-feira", shortName: "Qua", active: false, slots: [] },
  { dayOfWeek: 4, name: "Quinta-feira", shortName: "Qui", active: false, slots: [] },
  { dayOfWeek: 5, name: "Sexta-feira", shortName: "Sex", active: false, slots: [] },
  { dayOfWeek: 6, name: "Sábado", shortName: "Sáb", active: false, slots: [] },
  { dayOfWeek: 0, name: "Domingo", shortName: "Dom", active: false, slots: [] },
];

export function AvailabilitySettings() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(baseWeek);

  const { data, isLoading } = useQuery({
    queryKey: ["availability"],
    queryFn: async () => {
      const res = await api.get<AvailabilityResponseDTO[]>("/availability");
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (nextSchedule: DaySchedule[]) => {
      await Promise.all(
        nextSchedule.map(async (day) => {
          if (day.active && day.slots.length > 0) {
            await api.post("/availability", {
              dayOfWeek: day.dayOfWeek,
              slots: day.slots,
            });
            return;
          }

          try {
            await api.delete(`/availability/${day.dayOfWeek}`);
          } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
              return;
            }
            throw error;
          }
        }),
      );
    },
    onSuccess: () => {
      toast.success("Horários salvos com sucesso!");
    },
    onError: () => {
      toast.error("Não foi possível salvar os horários.");
    },
  });

  const mappedAvailability = useMemo(() => {
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
  }, [data]);

  useEffect(() => {
    setSchedule(mappedAvailability);
  }, [mappedAvailability]);

  const toggleDay = (dayOfWeek: number) => {
    setSchedule(prev => prev.map(day => 
      day.dayOfWeek === dayOfWeek 
        ? { 
            ...day, 
            active: !day.active,
            slots: !day.active ? [{ start: "09:00", end: "18:00" }] : day.slots
          }
        : day
    ));
  };

  const updateSlot = (dayOfWeek: number, slotIndex: number, field: "start" | "end", value: string) => {
    setSchedule(prev => prev.map(day => {
      if (day.dayOfWeek !== dayOfWeek) return day;
      const newSlots = [...day.slots];
      newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
      return { ...day, slots: newSlots };
    }));
  };

  const addSlot = (dayOfWeek: number) => {
    setSchedule(prev => prev.map(day => {
      if (day.dayOfWeek !== dayOfWeek) return day;
      return { ...day, slots: [...day.slots, { start: "13:00", end: "18:00" }] };
    }));
  };

  const removeSlot = (dayOfWeek: number, slotIndex: number) => {
    setSchedule(prev => prev.map(day => {
      if (day.dayOfWeek !== dayOfWeek) return day;
      return { ...day, slots: day.slots.filter((_, i) => i !== slotIndex) };
    }));
  };

  const handleSave = () => {
    saveMutation.mutate(schedule);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Configurar Disponibilidade
          </CardTitle>
          <CardDescription>
            Defina seus horários de trabalho para cada dia da semana
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {schedule.map((day) => (
            <div
              key={day.dayOfWeek}
              className={`p-4 rounded-lg border transition-colors ${
                day.active ? "bg-card border-border" : "bg-muted/30 border-transparent"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-[160px]">
                  <Switch
                    checked={day.active}
                    onCheckedChange={() => toggleDay(day.dayOfWeek)}
                  />
                  <Label 
                    className={`font-medium ${!day.active && "text-muted-foreground"}`}
                  >
                    {day.name}
                  </Label>
                </div>

                {day.active && (
                  <div className="flex-1 space-y-2">
                    {day.slots.map((slot, slotIndex) => (
                      <div key={slotIndex} className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateSlot(day.dayOfWeek, slotIndex, "start", e.target.value)}
                            className="w-[120px]"
                          />
                          <span className="text-muted-foreground">até</span>
                          <Input
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateSlot(day.dayOfWeek, slotIndex, "end", e.target.value)}
                            className="w-[120px]"
                          />
                        </div>
                        
                        {day.slots.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSlot(day.dayOfWeek, slotIndex)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
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
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar intervalo
                    </Button>
                  </div>
                )}

                {!day.active && (
                  <span className="text-sm text-muted-foreground italic">
                    Fechado
                  </span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="sticky bottom-4">
        <Button 
          onClick={handleSave} 
          className="w-full shadow-lg"
          disabled={isLoading || saveMutation.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}
