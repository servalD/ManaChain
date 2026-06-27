import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './shared/decorators/public.decorator';

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
