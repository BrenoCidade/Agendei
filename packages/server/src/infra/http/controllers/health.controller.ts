import { Controller, Get } from '@nestjs/common';
import type { HealthCheckResponse } from '@saas/shared';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthCheckResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
