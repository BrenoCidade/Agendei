import { Service } from '../../../../src/domain/entities/service';
import { ValidationError } from '../../../../src/domain/errors';

describe('Service Entity', () => {
  describe('Constructor', () => {
    it('should create a valid service with all properties', () => {
      const providerId = crypto.randomUUID();

      const service = new Service({
        name: 'Corte de Cabelo',
        description: 'Corte masculino simples',
        durationInMinutes: 30,
        priceInCents: 5000, // R$ 50,00
        providerId,
      });

      expect(service.id).toBeDefined();
      expect(service.name).toBe('Corte de Cabelo');
      expect(service.description).toBe('Corte masculino simples');
      expect(service.durationInMinutes).toBe(30);
      expect(service.priceInCents).toBe(5000);
      expect(service.isActive).toBe(true);
      expect(service.providerId).toBe(providerId);
      expect(service.createdAt).toBeInstanceOf(Date);
      expect(service.updatedAt).toBeInstanceOf(Date);
    });

    it('should create service without description', () => {
      const service = new Service({
        name: 'Barba',
        durationInMinutes: 20,
        priceInCents: 3000,
        providerId: crypto.randomUUID(),
      });

      expect(service.description).toBeNull();
    });

    it('should create service as active by default', () => {
      const service = new Service({
        name: 'Manicure',
        durationInMinutes: 45,
        priceInCents: 4000,
        providerId: crypto.randomUUID(),
      });

      expect(service.isActive).toBe(true);
    });

    it('should throw error for name with less than 3 characters', () => {
      expect(() => {
        new Service({
          name: 'AB',
          durationInMinutes: 30,
          priceInCents: 5000,
          providerId: crypto.randomUUID(),
        });
      }).toThrow(ValidationError);
    });

    it('should throw error for name with more than 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(() => {
        new Service({
          name: longName,
          durationInMinutes: 30,
          priceInCents: 5000,
          providerId: crypto.randomUUID(),
        });
      }).toThrow(ValidationError);
    });

    it('should throw error for description with more than 500 characters', () => {
      const longDesc = 'a'.repeat(501);
      expect(() => {
        new Service({
          name: 'Serviço',
          description: longDesc,
          durationInMinutes: 30,
          priceInCents: 5000,
          providerId: crypto.randomUUID(),
        });
      }).toThrow(ValidationError);
    });

    it('should throw error for duration less than 15 minutes', () => {
      expect(() => {
        new Service({
          name: 'Serviço Rápido',
          durationInMinutes: 10,
          priceInCents: 1000,
          providerId: crypto.randomUUID(),
        });
      }).toThrow(ValidationError);
    });

    it('should throw error for duration more than 480 minutes', () => {
      expect(() => {
        new Service({
          name: 'Serviço Longo',
          durationInMinutes: 500,
          priceInCents: 50000,
          providerId: crypto.randomUUID(),
        });
      }).toThrow(ValidationError);
    });

    it('should throw error for negative price', () => {
      expect(() => {
        new Service({
          name: 'Serviço',
          durationInMinutes: 30,
          priceInCents: -1000,
          providerId: crypto.randomUUID(),
        });
      }).toThrow(ValidationError);
    });

    it('should trim name', () => {
      const service = new Service({
        name: '  Corte de Cabelo  ',
        durationInMinutes: 30,
        priceInCents: 5000,
        providerId: crypto.randomUUID(),
      });

      expect(service.name).toBe('Corte de Cabelo');
    });
  });

  describe('updateDetails', () => {
    it('should update service details', () => {
      const service = new Service({
        name: 'Corte',
        durationInMinutes: 30,
        priceInCents: 5000,
        providerId: crypto.randomUUID(),
      });

      const oldUpdatedAt = service.updatedAt;

      service.updateDetails('Corte Premium', 'Corte estilizado', 45, 8000);

      expect(service.name).toBe('Corte Premium');
      expect(service.description).toBe('Corte estilizado');
      expect(service.durationInMinutes).toBe(45);
      expect(service.priceInCents).toBe(8000);
      expect(service.updatedAt.getTime()).toBeGreaterThanOrEqual(
        oldUpdatedAt.getTime(),
      );
    });

    it('should throw error when updating with invalid name', () => {
      const service = new Service({
        name: 'Corte',
        durationInMinutes: 30,
        priceInCents: 5000,
        providerId: crypto.randomUUID(),
      });

      expect(() => {
        service.updateDetails('AB', null, 30, 5000);
      }).toThrow(ValidationError);
    });
  });

  describe('activate/deactivate', () => {
    it('should deactivate service', () => {
      const service = new Service({
        name: 'Corte',
        durationInMinutes: 30,
        priceInCents: 5000,
        providerId: crypto.randomUUID(),
      });

      service.deactivate();

      expect(service.isActive).toBe(false);
    });

    it('should activate service', () => {
      const service = new Service({
        name: 'Corte',
        durationInMinutes: 30,
        priceInCents: 5000,
        isActive: false,
        providerId: crypto.randomUUID(),
      });

      service.activate();

      expect(service.isActive).toBe(true);
    });
  });
});
