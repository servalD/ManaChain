import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import type { Response } from 'express';
import { Public } from '../../shared/decorators/public.decorator';
import { RawResponse } from '../../shared/decorators/raw-response.decorator';

/**
 * Sert /metrics au format Prometheus. Public (scrape sans token) et exclu du
 * Swagger ; jamais routé par traefik en prod (hors préfixe /api). `@RawResponse()` :
 * scrapé par Prometheus, ne doit pas passer par l'enveloppe JSON globale.
 */
@Public()
@RawResponse()
@ApiExcludeController()
@Controller()
export class MetricsController extends PrometheusController {
  @Get()
  async index(@Res({ passthrough: true }) response: Response) {
    return super.index(response);
  }
}
