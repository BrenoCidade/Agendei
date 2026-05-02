import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { ListProviderCustomersUseCase } from '@/application/use-cases/customer/list-provider-customers.use-case';
import { NotFoundError } from '@/domain/errors';
import type { CustomerResponseDTO } from '@saas/shared';

interface RequestWithUser {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('/customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(
    private readonly listProviderCustomersUseCase: ListProviderCustomersUseCase,
  ) {}

  @Get('/')
  async listCustomers(
    @Request() req: RequestWithUser,
  ): Promise<CustomerResponseDTO[]> {
    try {
      const customers = await this.listProviderCustomersUseCase.execute({
        providerId: req.user.userId,
      });

      return customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        providerId: customer.providerId,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      }));
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw new BadRequestException('An unexpected error occurred');
    }
  }
}
