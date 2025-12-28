import { All, Controller, Req, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { InngestService } from './inngest.service';

/**
 * Inngest Controller for NestJS.
 *
 * Exposes the /api/inngest endpoint for Inngest to:
 * - Discover registered functions (GET)
 * - Execute function steps (POST)
 * - Sync/register functions (PUT)
 *
 * In development, connect this to the Inngest Dev Server.
 * In production, this connects to Inngest Cloud.
 *
 * Rate limiting is skipped for this endpoint because:
 * - Inngest handles its own request validation via signing keys
 * - Step execution requires rapid sequential HTTP calls
 *
 * @see https://www.inngest.com/docs/reference/serve
 */
@SkipThrottle({ short: true, medium: true, long: true })
@Controller('api/inngest')
export class InngestController {
  /**
   * Constructor for InngestController.
   *
   * @param inngestService - InngestService instance
   */
  constructor(private readonly inngestService: InngestService) {}

  /**
   * Handle incoming Inngest requests.
   *
   * @param req - Request object
   * @param res - Response object
   * @returns The result of the Inngest service's handleRequest method
   */
  @All()
  handleInngest(@Req() req: Request, @Res() res: Response) {
    return this.inngestService.handleRequest(req, res);
  }
}
