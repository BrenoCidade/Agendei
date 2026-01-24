import { User } from '@/domain/entities/user';
import { NotFoundError } from '@/domain/errors';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { Inject, Injectable } from '@nestjs/common';

interface GetProviderBySlugInput {
  slug: string;
}

@Injectable()
export class GetProviderBySlugUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: GetProviderBySlugInput): Promise<User> {
    const normalizedSlug = input.slug.toLowerCase().trim();

    const provider = await this.userRepository.findBySlug(normalizedSlug);

    if (!provider) {
      throw new NotFoundError('Provider not found', 'PROVIDER_NOT_FOUND');
    }

    return provider;
  }
}
