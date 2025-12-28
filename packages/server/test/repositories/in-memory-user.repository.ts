import { PaginatedResult } from '@/domain/types/pagination';
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

  findAll(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<User>> {
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));

    const skip = (validPage - 1) * validLimit;

    const paginatedUsers = this.users.slice(skip, skip + validLimit);

    const total = this.users.length;
    const totalPages = Math.ceil(total / validLimit);

    return Promise.resolve({
      data: paginatedUsers,
      total,
      page: validPage,
      limit: validLimit,
      totalPages,
    });
  }

  findById(id: string): Promise<User | null> {
    const user = this.users.find((u) => u.id === id);
    return Promise.resolve(user ?? null);
  }

  findByIdOrFail(id: string): Promise<User> {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new Error('User not found');
    }
    return Promise.resolve(user);
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
