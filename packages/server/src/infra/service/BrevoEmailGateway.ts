import type { AppointmentEmailParams, IEmailGateway } from '@/domain/gateways/IEmailGateway';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface BrevoRecipient {
  email: string;
  name?: string;
}

interface BrevoEmailPayload {
  sender: BrevoRecipient;
  to: BrevoRecipient[];
  subject: string;
  htmlContent: string;
}

@Injectable()
export class BrevoEmailGateway implements IEmailGateway {
  private readonly logger = new Logger(BrevoEmailGateway.name);
  private readonly apiKey: string;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = config.getOrThrow<string>('BREVO_API_KEY');
    this.senderEmail = config.getOrThrow<string>('BREVO_SENDER_EMAIL');
    this.senderName = config.get<string>('BREVO_SENDER_NAME', 'Agendei');
  }

  private async send(payload: BrevoEmailPayload): Promise<void> {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': this.apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: this.senderName, email: this.senderEmail },
        to: payload.to,
        subject: payload.subject,
        htmlContent: payload.htmlContent,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Brevo API error ${response.status}: ${body}`);
    }
  }

  private formatDate(date: Date): string {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
  }

  async sendRecoveryEmail(to: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await this.send({
      sender: { name: this.senderName, email: this.senderEmail },
      to: [{ email: to }],
      subject: 'Redefinição de senha — Agendei',
      htmlContent: `
        <p>Você solicitou a redefinição de senha.</p>
        <p>Clique no link abaixo para criar uma nova senha:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>O link expira em 1 hora. Se não foi você, ignore este email.</p>
      `,
    }).catch((err: unknown) => {
      this.logger.error('Failed to send recovery email', err);
    });
  }

  async sendAppointmentCreatedToCustomer(params: AppointmentEmailParams): Promise<void> {
    await this.send({
      sender: { name: this.senderName, email: this.senderEmail },
      to: [{ email: params.customerEmail, name: params.customerName }],
      subject: `Agendamento confirmado — ${params.serviceName}`,
      htmlContent: `
        <p>Olá, <strong>${params.customerName}</strong>!</p>
        <p>Seu agendamento foi confirmado com sucesso.</p>
        <ul>
          <li><strong>Serviço:</strong> ${params.serviceName}</li>
          <li><strong>Prestador:</strong> ${params.providerName}</li>
          <li><strong>Data e hora:</strong> ${this.formatDate(params.startsAt)}</li>
        </ul>
        <p>Caso precise cancelar, entre em contato com antecedência.</p>
      `,
    }).catch((err: unknown) => {
      this.logger.error('Failed to send appointment created email to customer', err);
    });
  }

  async sendAppointmentCreatedToProvider(params: AppointmentEmailParams): Promise<void> {
    await this.send({
      sender: { name: this.senderName, email: this.senderEmail },
      to: [{ email: params.providerEmail, name: params.providerName }],
      subject: `Novo agendamento — ${params.customerName}`,
      htmlContent: `
        <p>Olá, <strong>${params.providerName}</strong>!</p>
        <p>Você recebeu um novo agendamento.</p>
        <ul>
          <li><strong>Cliente:</strong> ${params.customerName}</li>
          <li><strong>Serviço:</strong> ${params.serviceName}</li>
          <li><strong>Data e hora:</strong> ${this.formatDate(params.startsAt)}</li>
        </ul>
      `,
    }).catch((err: unknown) => {
      this.logger.error('Failed to send appointment created email to provider', err);
    });
  }

  async sendAppointmentCancelledByCustomer(params: AppointmentEmailParams): Promise<void> {
    await this.send({
      sender: { name: this.senderName, email: this.senderEmail },
      to: [{ email: params.providerEmail, name: params.providerName }],
      subject: `Agendamento cancelado — ${params.customerName}`,
      htmlContent: `
        <p>Olá, <strong>${params.providerName}</strong>!</p>
        <p>O cliente <strong>${params.customerName}</strong> cancelou o agendamento.</p>
        <ul>
          <li><strong>Serviço:</strong> ${params.serviceName}</li>
          <li><strong>Data e hora:</strong> ${this.formatDate(params.startsAt)}</li>
          ${params.cancelReason ? `<li><strong>Motivo:</strong> ${params.cancelReason}</li>` : ''}
        </ul>
      `,
    }).catch((err: unknown) => {
      this.logger.error('Failed to send cancellation email to provider', err);
    });
  }

  async sendAppointmentCancelledByProvider(params: AppointmentEmailParams): Promise<void> {
    await this.send({
      sender: { name: this.senderName, email: this.senderEmail },
      to: [{ email: params.customerEmail, name: params.customerName }],
      subject: `Seu agendamento foi cancelado — ${params.serviceName}`,
      htmlContent: `
        <p>Olá, <strong>${params.customerName}</strong>!</p>
        <p>Infelizmente o prestador <strong>${params.providerName}</strong> cancelou seu agendamento.</p>
        <ul>
          <li><strong>Serviço:</strong> ${params.serviceName}</li>
          <li><strong>Data e hora:</strong> ${this.formatDate(params.startsAt)}</li>
          ${params.cancelReason ? `<li><strong>Motivo:</strong> ${params.cancelReason}</li>` : ''}
        </ul>
        <p>Entre em contato com o prestador para reagendar.</p>
      `,
    }).catch((err: unknown) => {
      this.logger.error('Failed to send cancellation email to customer', err);
    });
  }
}
