import { Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { WebhookHandlerResult } from '../types';
import { WebhooksService } from './webhooks.service';

@Controller('api/webhooks')
export class WebhooksController {
  /**
   * Exposes the HTTP entry point Shopify uses for app webhooks.
   * @param {WebhooksService} webhooksService - Validates HMAC signatures and runs topic handlers.
   */
  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * Receives all Shopify webhooks posted to `POST /api/webhooks`.
   * Shopify sends the raw JSON body and HMAC headers; Nest is configured with `rawBody: true` so
   * {@link WebhooksService.process} can verify the signature before any handler runs.
   * Responds `401` when validation fails and `200` with body `OK` when accepted (even if the topic is unhandled).
   * @param {Request} req - Express request including `rawBody` buffer for signature validation.
   * @param {Response} res - Express response used to send status and plain-text body.
   * @returns {WebhookHandlerResult} Promise resolving to the HTTP response sent to Shopify.
   */
  @Post()
  receiveWebhook(
    @Req() req: Request,
    @Res() res: Response,
  ): WebhookHandlerResult {
    return this.webhooksService.process(req, res);
  }
}
