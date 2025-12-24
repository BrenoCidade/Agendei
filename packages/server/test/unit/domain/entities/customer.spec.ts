import { ValidationError } from '@/domain/errors';
import { Customer } from '../../../../src/domain/entities/customer';

describe('Customer Entity', () => {
  describe('Constructor', () => {
    it('should create a valid customer with all properties', () => {
      const props = {
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '11999998888',
        providerId: crypto.randomUUID(),
      };

      const customer = new Customer(props);

      expect(customer.id).toBeDefined();
      expect(customer.name).toBe('João Silva');
      expect(customer.email).toBe('joao@email.com');
      expect(customer.phone).toBe('11999998888');
      expect(customer.providerId).toBe(props.providerId);
      expect(customer.createdAt).toBeInstanceOf(Date);
      expect(customer.updatedAt).toBeInstanceOf(Date);
    });

    it('should generate UUID if id is not provided', () => {
      const customer = new Customer({
        name: 'João',
        email: 'joao@email.com',
        phone: '11999998888',
        providerId: crypto.randomUUID(),
      });

      expect(customer.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should normalize email to lowercase', () => {
      const customer = new Customer({
        name: 'João',
        email: 'JOAO@EMAIL.COM',
        phone: '11999998888',
        providerId: crypto.randomUUID(),
      });

      expect(customer.email).toBe('joao@email.com');
    });

    it('should trim name', () => {
      const customer = new Customer({
        name: '  João Silva  ',
        email: 'joao@email.com',
        phone: '11999998888',
        providerId: crypto.randomUUID(),
      });

      expect(customer.name).toBe('João Silva');
    });

    it('should sanitize phone number removing non-digits', () => {
      const customer = new Customer({
        name: 'João',
        email: 'joao@email.com',
        phone: '(11) 99999-8888',
        providerId: crypto.randomUUID(),
      });

      expect(customer.phone).toBe('11999998888');
    });

    it('should throw error for invalid email format', () => {
      expect(() => {
        new Customer({
          name: 'João',
          email: 'emailinvalido',
          phone: '11999998888',
          providerId: crypto.randomUUID(),
        });
      }).toThrow(new ValidationError('Invalid email format', 'INVALID_EMAIL'));
    });

    it('should throw error for name with less than 2 characters', () => {
      expect(() => {
        new Customer({
          name: 'J',
          email: 'joao@email.com',
          phone: '11999998888',
          providerId: crypto.randomUUID(),
        });
      }).toThrow('Name must have at least 2 characters');
    });

    it('should throw error for phone with less than 10 digits', () => {
      expect(() => {
        new Customer({
          name: 'João',
          email: 'joao@email.com',
          phone: '999998888',
          providerId: crypto.randomUUID(),
        });
      }).toThrow(
        new ValidationError('Invalid phone number format', 'INVALID_PHONE'),
      );
    });

    it('should throw error for phone with more than 15 digits', () => {
      expect(() => {
        new Customer({
          name: 'João',
          email: 'joao@email.com',
          phone: '1234567890123456',
          providerId: crypto.randomUUID(),
        });
      }).toThrow(
        new ValidationError('Invalid phone number format', 'INVALID_PHONE'),
      );
    });
  });

  describe('updateContactInfo', () => {
    it('should update all contact information', () => {
      const customer = new Customer({
        name: 'João',
        email: 'joao@email.com',
        phone: '11999998888',
        providerId: crypto.randomUUID(),
      });

      const oldUpdatedAt = customer.updatedAt;

      customer.updateContactInfo(
        'Maria Silva',
        'maria@email.com',
        '11888887777',
      );

      expect(customer.name).toBe('Maria Silva');
      expect(customer.email).toBe('maria@email.com');
      expect(customer.phone).toBe('11888887777');
      expect(customer.updatedAt.getTime()).toBeGreaterThanOrEqual(
        oldUpdatedAt.getTime(),
      );
    });

    it('should sanitize phone when updating', () => {
      const customer = new Customer({
        name: 'João',
        email: 'joao@email.com',
        phone: '11999998888',
        providerId: crypto.randomUUID(),
      });

      customer.updateContactInfo('João', 'joao@email.com', '(11) 88888-7777');

      expect(customer.phone).toBe('11888887777');
    });

    it('should throw error when updating with invalid email', () => {
      const customer = new Customer({
        name: 'João',
        email: 'joao@email.com',
        phone: '11999998888',
        providerId: crypto.randomUUID(),
      });

      expect(() => {
        customer.updateContactInfo('João', 'emailinvalido', '11999998888');
      }).toThrow(new ValidationError('Invalid email format', 'INVALID_EMAIL'));
    });
  });
});
