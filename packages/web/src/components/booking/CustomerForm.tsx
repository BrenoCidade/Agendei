import { useState } from "react";
import { User, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomerFormProps {
  name: string;
  email: string;
  phone: string;
  onNameChange: (name: string) => void;
  onEmailChange: (email: string) => void;
  onPhoneChange: (phone: string) => void;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function CustomerForm({ name, email, phone, onNameChange, onEmailChange, onPhoneChange }: CustomerFormProps) {
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    onPhoneChange(formatted);
  };

  return (
    <section className="animate-fade-in">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Seus dados</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Informe seus dados para confirmar o agendamento
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-foreground">
            Nome completo
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="Digite seu nome"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="pl-10 h-12 rounded-xl border-border bg-card focus:border-primary focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            E-mail
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="pl-10 h-12 rounded-xl border-border bg-card focus:border-primary focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium text-foreground">
            WhatsApp / Telefone
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={handlePhoneChange}
              className="pl-10 h-12 rounded-xl border-border bg-card focus:border-primary focus:ring-primary"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
