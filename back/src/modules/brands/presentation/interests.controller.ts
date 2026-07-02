import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../shared/decorators/public.decorator';
import { ListInterestsUseCase } from '../application/use-cases/list-interests.use-case';
import { InterestResponse, toInterestResponse } from './brand.presenter';

@ApiTags('interests')
@Controller('interests')
export class InterestsController {
  constructor(private readonly listInterests: ListInterestsUseCase) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lister les centres d’intérêt disponibles' })
  @ApiOkResponse({ type: InterestResponse, isArray: true })
  async list(): Promise<InterestResponse[]> {
    const interests = await this.listInterests.execute();
    return interests.map(toInterestResponse);
  }
}
