import { User } from '@/domain/entities/user';
import { NotFoundError } from '@/domain/errors';
import { IUserRepository } from '@/domain/repositories/IUserRepository';

interface GetProviderBySlugInput {
  slug: string;
}

export class GetProviderBySlugUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: GetProviderBySlugInput): Promise<User> {
    const normalizedSlug = input.slug.toLowerCase().trim();

    const provider = await this.userRepository.findBySlug(normalizedSlug);

    if (!provider) {
      throw new NotFoundError('Provider not found', 'PROVIDER_NOT_FOUND');
    }

    return provider;
  }
}
