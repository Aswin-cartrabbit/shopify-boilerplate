import { Controller, Get } from '@nestjs/common';
import type { CustomerTestHealthResponse } from '../types';
import { CustomerTestService } from './customer-test.service';

@Controller('api/customer-test')
export class CustomerTestController {
  /**
   * HTTP entry for `api/customer-test` routes.
   * @param {CustomerTestService} customer-testService - CustomerTest business logic.
   */
  constructor(private readonly customerTestService: CustomerTestService) {}

  /**
   * Smoke-test route at `GET /api/customer-test/health`.
   * @returns {Promise<CustomerTestHealthResponse>} Scaffold health response.
   */
  @Get('health')
  health(): Promise<CustomerTestHealthResponse> {
    return this.customerTestService.health();
  }
}
