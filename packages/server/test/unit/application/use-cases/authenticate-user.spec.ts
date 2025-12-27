import { AuthenticateUserUseCase } from '../../../../src/application/use-cases/user/authenticate-user.use-case';
import { NotFoundError, ValidationError } from '../../../../src/domain/errors';
import { InMemoryUserRepository } from '../../../repositories/in-memory-user.repository';
import { User } from '../../../../src/domain/entities/user';
import { IPasswordService } from '../../../../src/domain/services/IPasswordService';

// Mock simples do PasswordService para testes
class MockPasswordService implements IPasswordService {
  async hash(password: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    return `hashed_${password}`;
  }

  async compare(password: string, hash: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 0));
    return hash === `hashed_${password}`;
  }
}

describe('AuthenticateUserUseCase', () => {
  let userRepository: InMemoryUserRepository;
  let passwordService: IPasswordService;
  let authenticateUserUseCase: AuthenticateUserUseCase;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    passwordService = new MockPasswordService();
    authenticateUserUseCase = new AuthenticateUserUseCase(
      userRepository,
      passwordService,
    );
  });

  it('should authenticate user with valid credentials', async () => {
    const passwordHash = await passwordService.hash('senha123');
    const user = new User({
      name: 'João Silva',
      email: 'joao@email.com',
      businessName: 'João Silva Barbearia',
      passwordHash,
    });

    await userRepository.save(user);

    const input = {
      email: 'joao@email.com',
      password: 'senha123',
    };

    const authenticatedUser = await authenticateUserUseCase.execute(input);

    expect(authenticatedUser.id).toBe(user.id);
    expect(authenticatedUser.email).toBe('joao@email.com');
  });

  it('should throw error if user not found', async () => {
    const input = {
      email: 'nonexistent@email.com',
      password: 'senha123',
    };

    await expect(authenticateUserUseCase.execute(input)).rejects.toThrow(
      NotFoundError,
    );
  });

  it('should throw error if password is invalid', async () => {
    const passwordHash = await passwordService.hash('senha123');

    const user = new User({
      name: 'João Silva',
      email: 'joao@email.com',
      businessName: 'João Silva Barbearia',
      passwordHash,
    });

    await userRepository.save(user);

    const input = {
      email: 'joao@email.com',
      password: 'senhaerrada',
    };

    await expect(authenticateUserUseCase.execute(input)).rejects.toThrow(
      ValidationError,
    );
  });

  it('should normalize email to lowercase before searching', async () => {
    const passwordHash = await passwordService.hash('senha123');

    const user = new User({
      name: 'João Silva',
      email: 'joao@email.com',
      businessName: 'João Silva Barbearia',
      passwordHash,
    });

    await userRepository.save(user);

    const input = {
      email: 'JOAO@EMAIL.COM',
      password: 'senha123',
    };

    const authenticatedUser = await authenticateUserUseCase.execute(input);

    expect(authenticatedUser.email).toBe('joao@email.com');
  });

  it('should throw error with same message for both invalid email and password', async () => {
    const passwordHash = await passwordService.hash('senha123');

    const user = new User({
      name: 'João Silva',
      email: 'joao@email.com',
      businessName: 'João Silva Barbearia',
      passwordHash,
    });

    await userRepository.save(user);

    const invalidEmailInput = {
      email: 'nonexistent@email.com',
      password: 'senha123',
    };

    const invalidPasswordInput = {
      email: 'joao@email.com',
      password: 'senhaerrada',
    };

    await expect(
      authenticateUserUseCase.execute(invalidEmailInput),
    ).rejects.toThrow('Invalid credentials');

    await expect(
      authenticateUserUseCase.execute(invalidPasswordInput),
    ).rejects.toThrow('Invalid credentials');
  });
});
