import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Request, Response } from 'express';
import {
  SHOP_EVENTS,
  ShopUninstalledEvent,
} from '../events/shop.events';
import { ShopifyService } from '../shopify.service';
import { ShopService } from '../shop.service';
import type { WebhookHandlerResult } from '../types';

@Injectable()
export class WebhooksService {
  /**
   * Handles verified Shopify webhook HTTP requests.
   * @param {ShopifyService} shopifyService - Provides `webhooks.validate` HMAC verification.
   * @param {ShopService} shopService - Updates shop rows when merchants uninstall the app.
   * @param {EventEmitter2} eventEmitter - Emits `shop.uninstalled` for downstream listeners.
   */
  constructor(
    private readonly shopifyService: ShopifyService,
    private readonly shopService: ShopService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Validates and routes a single Shopify webhook delivery.
   * Uses the raw request body string (not re-serialized JSON) when calling Shopify's validator.
   * On invalid HMAC, responds immediately with `401` and text `Invalid webhook signature`.
   * For `APP_UNINSTALLED` / `app/uninstalled`, marks the shop uninstalled and emits
   * {@link ShopUninstalledEvent}. Other topics are acknowledged with `200 OK` without side effects.
   * @param {Request} req - Express request; must include optional `rawBody` from Nest raw body middleware.
   * @param {Response} res - Express response for returning status codes to Shopify.
   * @returns {Promise<Response>} The response object after `send` completes.
   */
  async process(req: Request, res: Response): WebhookHandlerResult {
    const validation = await this.shopifyService.shopify.webhooks.validate({
      rawBody: (req as Request & { rawBody?: Buffer }).rawBody?.toString('utf8') ?? '',
      rawRequest: req,
      rawResponse: res,
    });

    if (!validation.valid) {
      return res.status(401).send('Invalid webhook signature');
    }

    const topic = validation.topic;
    const shopDomain = validation.domain;

    if (topic === 'APP_UNINSTALLED' || topic === 'app/uninstalled') {
      const shop = await this.shopService.markUninstalled(shopDomain);
      if (shop) {
        this.eventEmitter.emit(
          SHOP_EVENTS.UNINSTALLED,
          new ShopUninstalledEvent(shop),
        );
      }
    }

    return res.status(200).send('OK');
  }
}
