import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { ShopInstalledListener } from './events/shop-installed.listener';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { ShopifyService } from './shopify.service';
import { WebhooksController } from './webhooks/webhooks.controller';
import { WebhooksService } from './webhooks/webhooks.service';
import { CustomerTestController } from './customer-test/customer-test.controller';
import { CustomerTestService } from './customer-test/customer-test.service';

@Module({
  controllers: [AuthController, ShopController, WebhooksController,
    CustomerTestController,
  ],
  providers: [
    ShopifyService,
    ShopService,
    AuthService,
    WebhooksService,
    ShopInstalledListener,
    CustomerTestService,
  ],
  exports: [ShopifyService, ShopService, AuthService],
})
export class ShopifyModule {}
