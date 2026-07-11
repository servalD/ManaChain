import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from './shared/decorators/public.decorator';

// Docker healthcheck toutes les 10s (par réplica) : hors du garde-fou global.
@SkipThrottle()
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Healthcheck' })
  check() {
    return {
      status: 'ok',
      service: 'ManaChain API',
      timestamp: new Date().toISOString(),
    };
  }
}
