import { Slug } from '../../../../src/domain/value-objects/slug';
import { ValidationError } from '../../../../src/domain/errors';

describe('Slug Value Object', () => {
  describe('create', () => {
    it('should create valid slug', () => {
      const slug = Slug.create('joao-silva-barbearia');

      expect(slug.Value).toBe('joao-silva-barbearia');
    });

    it('should normalize slug on creation', () => {
      const slug = Slug.create('João Silva Barbearia');

      expect(slug.Value).toBe('joao-silva-barbearia');
    });

    it('should throw error for slug with less than 3 characters', () => {
      expect(() => {
        Slug.create('ab');
      }).toThrow(ValidationError);
    });

    it('should normalize slug with invalid characters on creation', () => {
      const slug = Slug.create('joao@silva');

      expect(slug.Value).toBe('joaosilva');
    });

    it('should throw error for slug starting with hyphen', () => {
      expect(() => {
        Slug.create('-joao-silva');
      }).toThrow(ValidationError);
    });

    it('should throw error for slug ending with hyphen', () => {
      expect(() => {
        Slug.create('joao-silva-');
      }).toThrow(ValidationError);
    });
  });

  describe('generate', () => {
    it('should generate slug from business name', () => {
      const slug = Slug.generate('João Silva Barbearia');

      expect(slug.Value).toBe('joao-silva-barbearia');
    });

    it('should remove accents', () => {
      const slug = Slug.generate('José Márcio Estética');

      expect(slug.Value).toBe('jose-marcio-estetica');
    });

    it('should remove special characters', () => {
      const slug = Slug.generate('João & Silva Barbearia!');

      expect(slug.Value).toBe('joao-silva-barbearia');
    });

    it('should replace multiple spaces with single hyphen', () => {
      const slug = Slug.generate('João    Silva    Barbearia');

      expect(slug.Value).toBe('joao-silva-barbearia');
    });

    it('should replace multiple hyphens with single hyphen', () => {
      const slug = Slug.generate('João---Silva---Barbearia');

      expect(slug.Value).toBe('joao-silva-barbearia');
    });

    it('should handle mixed case', () => {
      const slug = Slug.generate('JOÃO SILVA Barbearia');

      expect(slug.Value).toBe('joao-silva-barbearia');
    });

    it('should trim spaces', () => {
      const slug = Slug.generate('  João Silva Barbearia  ');

      expect(slug.Value).toBe('joao-silva-barbearia');
    });
  });

  describe('normalize', () => {
    it('should normalize text to valid slug format', () => {
      const normalized = Slug.normalize('João Silva Barbearia & Estética');

      expect(normalized).toBe('joao-silva-barbearia-estetica');
    });

    it('should handle numbers', () => {
      const normalized = Slug.normalize('Barbearia 123');

      expect(normalized).toBe('barbearia-123');
    });

    it('should remove underscores', () => {
      const normalized = Slug.normalize('joao_silva_barbearia');

      expect(normalized).toBe('joaosilvabarbearia');
    });
  });

  describe('validate', () => {
    it('should return true for valid slug', () => {
      const isValid = Slug.validate('joao-silva-barbearia');

      expect(isValid).toBe(true);
    });

    it('should return true for slug with numbers', () => {
      const isValid = Slug.validate('barbearia-123');

      expect(isValid).toBe(true);
    });

    it('should return false for slug with less than 3 characters', () => {
      const isValid = Slug.validate('ab');

      expect(isValid).toBe(false);
    });

    it('should return false for slug with uppercase', () => {
      const isValid = Slug.validate('Joao-Silva');

      expect(isValid).toBe(false);
    });

    it('should return false for slug with special characters', () => {
      const isValid = Slug.validate('joao@silva');

      expect(isValid).toBe(false);
    });

    it('should return false for slug with spaces', () => {
      const isValid = Slug.validate('joao silva');

      expect(isValid).toBe(false);
    });

    it('should return false for slug starting with hyphen', () => {
      const isValid = Slug.validate('-joao-silva');

      expect(isValid).toBe(false);
    });

    it('should return false for slug ending with hyphen', () => {
      const isValid = Slug.validate('joao-silva-');

      expect(isValid).toBe(false);
    });

    it('should return false for slug with consecutive hyphens', () => {
      const isValid = Slug.validate('joao--silva');

      expect(isValid).toBe(false);
    });
  });
});
