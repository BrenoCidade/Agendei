import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  selectedDate: Date | undefined;
  selectedTime: string | null;
  timeSlots: string[];
  availableDays: number[];
  onDateSelect: (date: Date | undefined) => void;
  onTimeSelect: (time: string) => void;
}

export function DateTimePicker({
  selectedDate,
  selectedTime,
  timeSlots,
  availableDays,
  onDateSelect,
  onTimeSelect,
}: DateTimePickerProps) {
  const today = startOfDay(new Date());

  return (
    <section className="animate-fade-in">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Escolha a data e hora</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione o melhor dia e horário para você
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border p-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          locale={ptBR}
          showOutsideDays={false}
          disabled={(date) => {
            const normalizedDate = startOfDay(date);
            return normalizedDate < today || !availableDays.includes(normalizedDate.getDay());
          }}
          className="rounded-lg pointer-events-auto mx-auto"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium capitalize",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input hover:bg-[hsl(var(--booking-accent-soft))] hover:text-[hsl(var(--booking-accent))]"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] capitalize",
            row: "flex w-full mt-2",
            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-[hsl(var(--booking-accent-soft))] first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 h-9 w-9",
            day: cn(
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100 inline-flex items-center justify-center rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--booking-primary))] focus-visible:ring-offset-2 hover:bg-[hsl(var(--booking-accent-soft))] hover:text-[hsl(var(--booking-accent))]"
            ),
            day_selected: "bg-[hsl(var(--booking-primary))] text-[hsl(var(--booking-primary-foreground))] hover:bg-[hsl(var(--booking-primary))] hover:text-[hsl(var(--booking-primary-foreground))]",
            day_today: "bg-[hsl(var(--booking-accent-soft))] text-[hsl(var(--booking-accent))] font-semibold",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
            day_hidden: "invisible",
          }}
        />
      </div>

      {selectedDate && (
        <div className="mt-6 animate-slide-up">
          <h3 className="text-sm font-medium text-foreground mb-3">
            Horários disponíveis em {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
          </h3>
          
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.map((time) => (
              <button
                key={time}
                onClick={() => onTimeSelect(time)}
                className={cn(
                  "py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                  "border-2 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--booking-primary))]/20",
                  selectedTime === time
                    ? "border-[hsl(var(--booking-primary))] bg-[hsl(var(--booking-primary))] text-[hsl(var(--booking-primary-foreground))]"
                    : "border-border bg-card text-foreground hover:border-[hsl(var(--booking-primary))]/50"
                )}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
