import { ValidationError } from '../errors';

export class Slug {
  private readonly value: string;

  private constructor(slug: string) {
    this.value = slug;
  }

  static create(slug: string): Slug {
    const normalized = this.normalize(slug);

    if (!this.validate(normalized)) {
      throw new ValidationError('Invalid slug format', 'INVALID_SLUG');
    }

    return new Slug(normalized);
  }

  static generate(businessName: string): Slug {
    const normalized = this.normalize(businessName);
    return new Slug(normalized);
  }

  static normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  static validate(slug: string): boolean {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3;
  }

  get Value(): string {
    return this.value;
  }
}
