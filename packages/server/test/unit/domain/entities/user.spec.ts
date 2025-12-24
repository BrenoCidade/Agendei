import { User } from '../../../../src/domain/entities/user';
import { ValidationError } from '../../../../src/domain/errors';
import { PasswordService } from '../../../../src/domain/services/password.service';

describe('User Entity', () => {
  describe('Constructor', () => {
    it('should create a valid user with all properties', () => {
      const props = {
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '11999998888',
        businessName: 'João Silva Barbearia',
        passwordHash: '$2a$10$hashedpassword',
      };

      const user = new User(props);

      expect(user.id).toBeDefined();
      expect(user.name).toBe('João Silva');
      expect(user.email).toBe('joao@email.com');
      expect(user.phone).toBe('11999998888');
      expect(user.businessName).toBe('João Silva Barbearia');
      expect(user.slug).toBe('joao-silva-barbearia');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should generate UUID if id is not provided', () => {
      const user = new User({
        name: 'João',
        email: 'joao@email.com',
        phone: '11999998888',
        businessName: 'João Barbearia',
        passwordHash: '$2a$10$hashedpassword',
      });

      expect(user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should normalize email to lowercase', () => {
      const user = new User({
        name: 'João',
        email: 'JOAO@EMAIL.COM',
        phone: '11999998888',
        businessName: 'João Barbearia',
        passwordHash: '$2a$10$hashedpassword',
      });

      expect(user.email).toBe('joao@email.com');
    });

    it('should trim name', () => {
      const user = new User({
        name: '  João Silva  ',
        email: 'joao@email.com',
        phone: '11999998888',
        businessName: 'João Barbearia',
        passwordHash: '$2a$10$hashedpassword',
      });

      expect(user.name).toBe('João Silva');
    });

    it('should sanitize phone number removing non-digits', () => {
      const user = new User({
        name: 'João',
        email: 'joao@email.com',
        phone: '(11) 99999-8888',
        businessName: 'João Barbearia',
        passwordHash: '$2a$10$hashedpassword',
      });

      expect(user.phone).toBe('11999998888');
    });

    it('should create user without phone', () => {
      const user = new User({
        name: 'João',
        email: 'joao@email.com',
        businessName: 'João Barbearia',
        passwordHash: '$2a$10$hashedpassword',
      });

      expect(user.phone).toBeNull();
    });

    it('should generate slug automatically from businessName', () => {
      const user = new User({
        name: 'João',
        email: 'joao@email.com',
        businessName: 'João Silva Barbearia & Estética',
        passwordHash: '$2a$10$hashedpassword',
      });

      expect(user.slug).toBe('joao-silva-barbearia-estetica');
    });

    it('should use custom slug if provided', () => {
      const user = new User({
        name: 'João',
        email: 'joao@email.com',
        businessName: 'João Barbearia',
        slug: 'joao-barbeiro',
        passwordHash: '$2a$10$hashedpassword',
      });

      expect(user.slug).toBe('joao-barbeiro');
    });

    it('should throw error for invalid email format', () => {
      expect(() => {
        new User({
          name: 'João',
          email: 'emailinvalido',
          businessName: 'João Barbearia',
          passwordHash: '$2a$10$hashedpassword',
        });
      }).toThrow(ValidationError);
    });

    it('should throw error for name with less than 2 characters', () => {
      expect(() => {
        new User({
          name: 'J',
          email: 'joao@email.com',
          businessName: 'João Barbearia',
          passwordHash: '$2a$10$hashedpassword',
        });
      }).toThrow(ValidationError);
    });

    it('should throw error for businessName with less than 3 characters', () => {
      expect(() => {
        new User({
          name: 'João',
          email: 'joao@email.com',
          businessName: 'JB',
          passwordHash: '$2a$10$hashedpassword',
        });
      }).toThrow(ValidationError);
    });

    it('should throw error for businessName with more than 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(() => {
        new User({
          name: 'João',
          email: 'joao@email.com',
          businessName: longName,
          passwordHash: '$2a$10$hashedpassword',
        });
      }).toThrow(ValidationError);
    });

    it('should throw error for phone with less than 10 digits', () => {
      expect(() => {
        new User({
          name: 'João',
          email: 'joao@email.com',
          phone: '999998888',
          businessName: 'João Barbearia',
          passwordHash: '$2a$10$hashedpassword',
        });
      }).toThrow(ValidationError);
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', async () => {
      const passwordHash = await PasswordService.hash('senha123');

      const user = new User({
        name: 'João',
        email: 'joao@email.com',
        businessName: 'João Barbearia',
        passwordHash,
      });

      const isValid = user.validatePassword('senha123');

      expect(isValid).toBe(true);
    });

    it('should return false for invalid password', async () => {
      const passwordHash = await PasswordService.hash('senha123');

      const user = new User({
        name: 'João',
        email: 'joao@email.com',
        businessName: 'João Barbearia',
        passwordHash,
      });

      const isValid = user.validatePassword('senhaerrada');

      expect(isValid).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('should update all profile information', () => {
      const user = new User({
        name: 'João',
        email: 'joao@email.com',
        businessName: 'João Barbearia',
        passwordHash: '$2a$10$hashedpassword',
      });

      const oldUpdatedAt = user.updatedAt;

      user.updateProfile('Maria Silva', 'maria@email.com', '11888887777');

      expect(user.name).toBe('Maria Silva');
      expect(user.email).toBe('maria@email.com');
      expect(user.phone).toBe('11888887777');
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        oldUpdatedAt.getTime(),
      );
    });

    it('should sanitize phone when updating', () => {
      const user = new User({
        name: 'João',
        email: 'joao@email.com',
        businessName: 'João Barbearia',
        passwordHash: '$2a$10$hashedpassword',
      });

      user.updateProfile('João', 'joao@email.com', '(11) 88888-7777');

      expect(user.phone).toBe('11888887777');
    });

    it('should set phone to null if not provided', () => {
      const user = new User({
        name: 'João',
        email: 'joao@email.com',
        phone: '11999998888',
        businessName: 'João Barbearia',
        passwordHash: '$2a$10$hashedpassword',
      });

      user.updateProfile('João', 'joao@email.com');

      expect(user.phone).toBeNull();
    });

    it('should throw error when updating with invalid email', () => {
      const user = new User({
        name: 'João',
        email: 'joao@email.com',
        businessName: 'João Barbearia',
        passwordHash: '$2a$10$hashedpassword',
      });

      expect(() => {
        user.updateProfile('João', 'emailinvalido');
      }).toThrow(ValidationError);
    });
  });

  describe('updatePassword', () => {
    it('should update password hash', () => {
      const user = new User({
        name: 'João',
        email: 'joao@email.com',
        businessName: 'João Barbearia',
        passwordHash: '$2a$10$oldpasswordhash',
      });

      const oldUpdatedAt = user.updatedAt;

      user.updatePassword('$2a$10$newpasswordhash');

      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        oldUpdatedAt.getTime(),
      );
    });
  });
});
