import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ShopifyModule } from './shopify/shopify.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    PrismaModule,
    ShopifyModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      exclude: ['/api/{*any}'],
      serveStaticOptions: {
        maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
