import { RegisterUserUseCase } from '../../../../src/application/use-cases/user/register-user.use-case';
import { User } from '../../../../src/domain/entities/user';
import { BusinessRuleError } from '../../../../src/domain/errors';
import { PasswordService } from '../../../../src/domain/services/password.service';
import { InMemoryUserRepository } from '../../../repositories/in-memory-user.repository';

describe('RegisterUserUseCase', () => {
  let userRepository: InMemoryUserRepository;
  let registerUserUseCase: RegisterUserUseCase;

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    registerUserUseCase = new RegisterUserUseCase(userRepository);
  });

  it('should register a new user successfully', async () => {
    const input = {
      name: 'João Silva',
      email: 'joao@email.com',
      password: 'senha123',
      businessName: 'João Silva Barbearia',
      phone: '11999998888',
    };

    const user = await registerUserUseCase.execute(input);

    expect(user.id).toBeDefined();
    expect(user.name).toBe('João Silva');
    expect(user.email).toBe('joao@email.com');
    expect(user.phone).toBe('11999998888');
    expect(user.businessName).toBe('João Silva Barbearia');
    expect(user.slug).toBe('joao-silva-barbearia');
    expect(userRepository.users).toHaveLength(1);
  });

  it('should register user without phone', async () => {
    const input = {
      name: 'João Silva',
      email: 'joao@email.com',
      password: 'senha123',
      businessName: 'João Silva Barbearia',
    };

    const user = await registerUserUseCase.execute(input);

    expect(user.phone).toBeNull();
  });

  it('should hash password before creating user', async () => {
    const input = {
      name: 'João Silva',
      email: 'joao@email.com',
      password: 'senha123',
      businessName: 'João Silva Barbearia',
    };

    const user = await registerUserUseCase.execute(input);

    const isPasswordValid = user.validatePassword('senha123');
    expect(isPasswordValid).toBe(true);
  });

  it('should throw error if email already exists', async () => {
    const passwordHash = await PasswordService.hash('senha123');

    const existingUser = new User({
      id: crypto.randomUUID(),
      name: 'Existing User',
      email: 'joao@email.com',
      businessName: 'Existing Business',
      passwordHash,
    });

    await userRepository.save(existingUser);

    const input = {
      name: 'João Silva',
      email: 'joao@email.com',
      password: 'senha123',
      businessName: 'João Silva Barbearia',
    };

    await expect(registerUserUseCase.execute(input)).rejects.toThrow(
      BusinessRuleError,
    );
  });

  it('should generate slug automatically', async () => {
    const input = {
      name: 'João Silva',
      email: 'joao@email.com',
      password: 'senha123',
      businessName: 'João Silva Barbearia & Estética',
    };

    const user = await registerUserUseCase.execute(input);

    expect(user.slug).toBe('joao-silva-barbearia-estetica');
  });

  it('should normalize email to lowercase', async () => {
    const input = {
      name: 'João Silva',
      email: 'JOAO@EMAIL.COM',
      password: 'senha123',
      businessName: 'João Silva Barbearia',
    };

    const user = await registerUserUseCase.execute(input);

    expect(user.email).toBe('joao@email.com');
  });

  it('should sanitize phone number', async () => {
    const input = {
      name: 'João Silva',
      email: 'joao@email.com',
      password: 'senha123',
      businessName: 'João Silva Barbearia',
      phone: '(11) 99999-8888',
    };

    const user = await registerUserUseCase.execute(input);

    expect(user.phone).toBe('11999998888');
  });
});
