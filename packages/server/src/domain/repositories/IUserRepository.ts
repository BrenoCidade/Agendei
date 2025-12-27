import { User } from '../entities/user';

export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByIdOrFail(id: string): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  findBySlug(slug: string): Promise<User | null>;
  existsBySlug(slug: string): Promise<boolean>;
}
