import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  /**
   * Root API controller for lightweight health checks.
   * @param {AppService} appService - Supplies the greeting string for GET `/api`.
   */
  constructor(private readonly appService: AppService) {}

  /**
   * Simple liveness endpoint at `GET /api`.
   * Useful for load balancers or manual smoke tests; returns plain text, not JSON.
   * @returns {string} Static greeting proving the Nest app is running.
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
