import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Env } from '../../../infrastructure/config/env.validation';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { Public } from '../../../shared/decorators/public.decorator';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '../../../shared/enums/role.enum';
import { User } from '../../users/domain/user';
import { CreateBrandApplicationUseCase } from '../application/use-cases/create-brand-application.use-case';
import { VerifyBrandApplicationEmailUseCase } from '../application/use-cases/verify-brand-application-email.use-case';
import { ListBrandApplicationsUseCase } from '../application/use-cases/list-brand-applications.use-case';
import { GetBrandApplicationUseCase } from '../application/use-cases/get-brand-application.use-case';
import { ApproveBrandApplicationUseCase } from '../application/use-cases/approve-brand-application.use-case';
import { RejectBrandApplicationUseCase } from '../application/use-cases/reject-brand-application.use-case';
import { CreateBrandApplicationRequest } from '../application/dto/create-brand-application.request';
import { VerifyApplicationEmailRequest } from '../application/dto/verify-application-email.request';
import { ListApplicationsQuery } from '../application/dto/list-applications.query';
import { RejectApplicationRequest } from '../application/dto/reject-application.request';
import {
  ApproveApplicationResponse,
  BrandApplicationResponse,
  PaginatedApplicationsResponse,
  toApplicationResponse,
} from './brand-application.presenter';

@ApiTags('brand-applications')
@Controller('brands/applications')
export class BrandApplicationsController {
  constructor(
    private readonly createApplication: CreateBrandApplicationUseCase,
    private readonly verifyEmail: VerifyBrandApplicationEmailUseCase,
    private readonly listApplications: ListBrandApplicationsUseCase,
    private readonly getApplication: GetBrandApplicationUseCase,
    private readonly approveApplication: ApproveBrandApplicationUseCase,
    private readonly rejectApplication: RejectBrandApplicationUseCase,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Déposer une candidature de marque' })
  @ApiOkResponse({ type: BrandApplicationResponse })
  async create(
    @Body() body: CreateBrandApplicationRequest,
  ): Promise<BrandApplicationResponse> {
    const application = await this.createApplication.execute(body, {
      skipEmailVerification: this.config.get('SKIP_EMAIL_VERIFICATION', {
        infer: true,
      }),
    });
    return toApplicationResponse(application);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Vérifier l'email d'une candidature" })
  @ApiOkResponse({ type: BrandApplicationResponse })
  async verify(
    @Body() body: VerifyApplicationEmailRequest,
  ): Promise<BrandApplicationResponse> {
    const application = await this.verifyEmail.execute(body.token);
    return toApplicationResponse(application);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister les candidatures (admin)' })
  @ApiOkResponse({ type: PaginatedApplicationsResponse })
  async list(
    @Query() query: ListApplicationsQuery,
  ): Promise<PaginatedApplicationsResponse> {
    const { applications, total } = await this.listApplications.execute(query);
    return { applications: applications.map(toApplicationResponse), total };
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Détail d’une candidature (admin)' })
  @ApiOkResponse({ type: BrandApplicationResponse })
  async getOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BrandApplicationResponse> {
    const application = await this.getApplication.execute(id);
    return toApplicationResponse(application);
  }

  @Put(':id/approve')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approuver une candidature (admin)' })
  @ApiOkResponse({ type: ApproveApplicationResponse })
  async approve(
    @CurrentUser() admin: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApproveApplicationResponse> {
    const result = await this.approveApplication.execute(admin.id, id);
    const skipEmailVerification = this.config.get('SKIP_EMAIL_VERIFICATION', {
      infer: true,
    });
    return {
      userId: result.userId,
      brandId: result.brandId,
      username: result.username,
      // Le mot de passe temporaire n'est JAMAIS renvoyé en prod (il part par email) —
      // seulement en dev/démo, pour permettre un login scripté sans boîte mail.
      temporaryPassword: skipEmailVerification
        ? result.temporaryPassword
        : undefined,
    };
  }

  @Put(':id/reject')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rejeter une candidature (admin)' })
  async reject(
    @CurrentUser() admin: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RejectApplicationRequest,
  ): Promise<{ message: string }> {
    await this.rejectApplication.execute(admin.id, id, body.rejectionReason);
    return { message: 'Application rejected' };
  }
}
