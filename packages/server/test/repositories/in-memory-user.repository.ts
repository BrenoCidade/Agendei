import { User } from '../../src/domain/entities/user';
import { IUserRepository } from '../../src/domain/repositories/IUserRepository';

export class InMemoryUserRepository implements IUserRepository {
  public users: User[] = [];

  save(user: User): Promise<void> {
    const existingIndex = this.users.findIndex((u) => u.id === user.id);

    if (existingIndex >= 0) {
      this.users[existingIndex] = user;
    } else {
      this.users.push(user);
    }

    return Promise.resolve();
  }

  findAll(): Promise<User[]> {
    return Promise.resolve(this.users);
  }

  findById(id: string): Promise<User | null> {
    const user = this.users.find((u) => u.id === id);
    return Promise.resolve(user ?? null);
  }

  findByEmail(email: string): Promise<User | null> {
    const user = this.users.find((u) => u.email === email);
    return Promise.resolve(user ?? null);
  }

  findBySlug(slug: string): Promise<User | null> {
    const user = this.users.find((u) => u.slug === slug);
    return Promise.resolve(user ?? null);
  }

  existsBySlug(slug: string): Promise<boolean> {
    return Promise.resolve(this.users.some((u) => u.slug === slug));
  }
}
