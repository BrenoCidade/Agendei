import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CancelAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  onConfirm?: (reason: string, notifyCustomer: boolean) => void;
}

export function CancelAppointmentDialog({
  isOpen,
  onClose,
  customerName,
  onConfirm
}: CancelAppointmentDialogProps) {
  const [reason, setReason] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = () => {
    if (!reason.trim()) {
      toast.error("Por favor, informe o motivo do cancelamento");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onConfirm?.(reason, notifyCustomer);
      toast.success("Agendamento cancelado com sucesso");
      setIsSubmitting(false);
      setReason("");
      setNotifyCustomer(true);
      onClose();
    }, 600);
  };

  const handleClose = () => {
    setReason("");
    setNotifyCustomer(true);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Cancelar Agendamento</DialogTitle>
              <DialogDescription className="mt-1">
                Cliente: <span className="font-medium text-foreground">{customerName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Motivo do Cancelamento <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Ex: Tive um imprevisto médico, Feriado local..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify"
              checked={notifyCustomer}
              onCheckedChange={(checked) => setNotifyCustomer(checked as boolean)}
            />
            <Label htmlFor="notify" className="text-sm font-normal cursor-pointer">
              Notificar cliente por e-mail/WhatsApp
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Manter Agendamento
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Cancelando..." : "Confirmar Cancelamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
