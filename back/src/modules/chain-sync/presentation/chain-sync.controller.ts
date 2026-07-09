import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../shared/decorators/public.decorator';
import { ChainSyncService } from '../application/chain-sync.service';

export class ChainSyncStatusResponse {
  lastProcessedBlock: string;
  lagBlocks: number;
}

@ApiTags('chain-sync')
@Controller('chain-sync')
export class ChainSyncController {
  constructor(private readonly chainSync: ChainSyncService) {}

  @Public()
  @Get('status')
  @ApiOperation({
    summary: 'Curseur de synchronisation chaîne et retard (en blocs)',
  })
  @ApiOkResponse({ type: ChainSyncStatusResponse })
  async status(): Promise<ChainSyncStatusResponse> {
    return this.chainSync.getStatus();
  }
}
