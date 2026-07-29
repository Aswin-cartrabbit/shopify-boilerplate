import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Constructs Prisma with the `@prisma/adapter-pg` driver using `DATABASE_URL`.
   * Injected globally via `PrismaModule` so services share one connection pool per process.
   */
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }

  /**
   * Opens the Postgres connection pool when Nest bootstraps modules.
   * Called automatically by Nest; failures here prevent the app from starting.
   * @returns {Promise<void>} Resolves when Prisma `$connect` succeeds.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Closes database connections gracefully on shutdown (SIGTERM, hot reload, tests).
   * @returns {Promise<void>} Resolves when Prisma `$disconnect` completes.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
