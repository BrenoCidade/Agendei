import { Injectable } from '@nestjs/common';
import type { IUserRepository } from '@/domain/repositories/IUserRepository';
import { PaginatedUsersResponseDTO } from '@saas/shared';
import { UserResponseMapper } from '@/application/mappers/user-response.mapper';

interface ListUsersInput {
  page?: number;
  limit?: number;
  requestedBy?: {
    userId: string;
    role: 'ADMIN' | 'USER';
  };
}

@Injectable()
export class ListUsersUseCase {
  private readonly LIMITS = {
    USER: 100,
    ADMIN: 500,
    DEFAULT: 20,
  };

  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ListUsersInput): Promise<PaginatedUsersResponseDTO> {
    const { page = 1, limit = this.LIMITS.DEFAULT, requestedBy } = input;

    const maxLimit = this.getMaxLimitForUser(requestedBy?.role);

    const validatedLimit = Math.min(limit, maxLimit);

    const validatedPage = Math.max(1, page);

    const result = await this.userRepository.findAll(
      validatedPage,
      validatedLimit,
    );

    const dtoUsers = UserResponseMapper.toDTOList(result.data);

    return {
      data: dtoUsers,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  private getMaxLimitForUser(role?: 'ADMIN' | 'USER'): number {
    switch (role) {
      case 'ADMIN':
        return this.LIMITS.ADMIN;
      case 'USER':
        return this.LIMITS.USER;
      default:
        return this.LIMITS.DEFAULT;
    }
  }
}
