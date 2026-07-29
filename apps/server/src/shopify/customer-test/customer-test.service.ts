import { Injectable } from '@nestjs/common';
import type { CustomerTestHealthResponse } from '../types';

@Injectable()
export class CustomerTestService {
  /**
   * Placeholder handler for customer-test routes; replace with real business logic.
   * @returns {Promise<CustomerTestHealthResponse>} Basic health payload for the scaffolded route.
   */
  async health(): Promise<CustomerTestHealthResponse> {
    return { ok: true };
  }
}
