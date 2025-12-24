import {
  ValidationError,
  BusinessRuleError,
} from '../../../../src/domain/errors';
import { Appointment } from '../../../../src/domain/entities/appointment';

describe('Appointment Entity', () => {
  describe('create', () => {
    it('should create a valid appointment with PENDING status', () => {
      const startsAt = new Date('2026-12-20T10:00:00Z');
      const endsAt = new Date('2026-12-20T11:00:00Z');

      const appointment = new Appointment({
        customerId: 'customer-123',
        serviceId: 'service-456',
        providerId: 'provider-789',
        startsAt,
        endsAt,
        cancelReason: null,
        canceledBy: null,
        canceledAt: null,
      });

      expect(appointment.customerId).toBe('customer-123');
      expect(appointment.startsAt).toEqual(startsAt);
      expect(appointment.endsAt).toEqual(endsAt);
      expect(appointment.status).toBe('PENDING');
    });

    it('should throw InvalidAppointmentDateError if end time is before start time', () => {
      const startsAt = new Date('2026-12-20T11:00:00Z');
      const endsAt = new Date('2026-12-20T10:00:00Z');

      expect(() => {
        new Appointment({
          customerId: 'customer-123',
          serviceId: 'service-456',
          providerId: 'provider-789',
          startsAt,
          endsAt,
          cancelReason: null,
          canceledBy: null,
          canceledAt: null,
        });
      }).toThrow(
        new ValidationError(
          'End time must be after start time',
          'APPOINTMENT_INVALID_TIME_RANGE',
        ),
      );
    });

    it('should throw InvalidAppointmentDateError if start time is in the past', () => {
      const startsAt = new Date('2020-01-01T10:00:00Z');
      const endsAt = new Date('2020-01-01T11:00:00Z');

      expect(() => {
        new Appointment({
          customerId: 'customer-123',
          serviceId: 'service-456',
          providerId: 'provider-789',
          startsAt,
          endsAt,
          cancelReason: null,
          canceledBy: null,
          canceledAt: null,
        });
      }).toThrow(
        new ValidationError(
          'Cannot schedule appointments in the past',
          'APPOINTMENT_PAST_DATE',
        ),
      );
    });

    it('should throw InvalidAppointmentDateError if duration is less than 15 minutes', () => {
      const startsAt = new Date('2026-12-20T10:00:00Z');
      const endsAt = new Date('2026-12-20T10:10:00Z');

      expect(() => {
        new Appointment({
          customerId: 'customer-123',
          serviceId: 'service-456',
          providerId: 'provider-789',
          startsAt,
          endsAt,
          cancelReason: null,
          canceledBy: null,
          canceledAt: null,
        });
      }).toThrow();
      new ValidationError(
        'Appointment duration must be at least 15 minutes',
        'APPOINTMENT_MIN_DURATION',
      );
    });
  });

  describe('cancel', () => {
    it('should cancel a pending appointment', () => {
      const appointment = new Appointment({
        customerId: 'customer-123',
        serviceId: 'service-456',
        providerId: 'provider-789',
        startsAt: new Date('2026-12-20T10:00:00Z'),
        endsAt: new Date('2026-12-20T11:00:00Z'),
        cancelReason: null,
        canceledBy: null,
        canceledAt: null,
      });

      appointment.cancel('Cliente desistiu', 'CUSTOMER');

      expect(appointment.status).toBe('CANCELLED');
      expect(appointment.cancelReason).toBe('Cliente desistiu');
      expect(appointment.canceledBy).toBe('CUSTOMER');
      expect(appointment.canceledAt).toBeInstanceOf(Date);
    });

    it('should throw InvalidAppointmentStateError when cancelling an already cancelled appointment', () => {
      const appointment = new Appointment({
        customerId: 'customer-123',
        serviceId: 'service-456',
        providerId: 'provider-789',
        startsAt: new Date('2026-12-20T10:00:00Z'),
        endsAt: new Date('2026-12-20T11:00:00Z'),
        status: 'CANCELLED',
        cancelReason: 'Motivo anterior',
        canceledBy: 'CUSTOMER',
        canceledAt: new Date(),
      });

      expect(() => {
        appointment.cancel('Novo motivo', 'PROVIDER');
      }).toThrow(
        new BusinessRuleError(
          'Appointment is already cancelled',
          'APPOINTMENT_ALREADY_CANCELLED',
        ),
      );
    });

    it('should throw InvalidAppointmentStateError when cancelling a completed appointment', () => {
      const appointment = new Appointment({
        customerId: 'customer-123',
        serviceId: 'service-456',
        providerId: 'provider-789',
        startsAt: new Date('2026-12-20T10:00:00Z'),
        endsAt: new Date('2026-12-20T11:00:00Z'),
        status: 'COMPLETED',
        cancelReason: null,
        canceledBy: null,
        canceledAt: null,
      });

      expect(() => {
        appointment.cancel('Teste', 'CUSTOMER');
      }).toThrow(
        new BusinessRuleError(
          'Cannot cancel a completed appointment',
          'APPOINTMENT_ALREADY_COMPLETED',
        ),
      );
    });
  });

  describe('state transitions', () => {
    it('should transition from PENDING to CONFIRMED', () => {
      const appointment = new Appointment({
        customerId: 'customer-123',
        serviceId: 'service-456',
        providerId: 'provider-789',
        startsAt: new Date('2026-12-20T10:00:00Z'),
        endsAt: new Date('2026-12-20T11:00:00Z'),
        cancelReason: null,
        canceledBy: null,
        canceledAt: null,
      });

      appointment.confirm();

      expect(appointment.status).toBe('CONFIRMED');
    });

    it('should throw InvalidAppointmentStateError when confirming non-pending appointment', () => {
      const appointment = new Appointment({
        customerId: 'customer-123',
        serviceId: 'service-456',
        providerId: 'provider-789',
        startsAt: new Date('2026-12-20T10:00:00Z'),
        endsAt: new Date('2026-12-20T11:00:00Z'),
        status: 'CANCELLED',
        cancelReason: 'Cancelado',
        canceledBy: 'CUSTOMER',
        canceledAt: new Date(),
      });

      expect(() => {
        appointment.confirm();
      }).toThrow(
        new BusinessRuleError(
          'Only pending appointments can be confirmed',
          'APPOINTMENT_NOT_PENDING',
        ),
      );
    });
  });
});
