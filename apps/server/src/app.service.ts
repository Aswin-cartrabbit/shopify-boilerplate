import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /**
   * Provides the default message for the root `/api` health route.
   * Replace or extend this when adding real health metrics; keep it cheap to call.
   * @returns {string} Human-readable confirmation that the API process is up.
   */
  getHello(): string {
    return 'Hello World!';
  }
}
