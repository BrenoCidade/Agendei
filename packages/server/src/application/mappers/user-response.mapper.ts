import { User } from '@/domain/entities/user';
import { UserResponseDTO } from '@saas/shared';

export class UserResponseMapper {
  static toDTO(user: User): UserResponseDTO {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      businessName: user.businessName,
      slug: user.slug,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  static toDTOList(users: User[]): UserResponseDTO[] {
    return users.map((user) => this.toDTO(user));
  }
}
