import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { Public } from '../../../shared/decorators/public.decorator';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { Role } from '../../../shared/enums/role.enum';
import { User } from '../../users/domain/user';
import { CreateBrandUseCase } from '../application/use-cases/create-brand.use-case';
import { GetBrandUseCase } from '../application/use-cases/get-brand.use-case';
import { GetBrandByUserUseCase } from '../application/use-cases/get-brand-by-user.use-case';
import { ListBrandsUseCase } from '../application/use-cases/list-brands.use-case';
import { ListActiveBrandsUseCase } from '../application/use-cases/list-active-brands.use-case';
import { ListBrandsForWhitelistUseCase } from '../application/use-cases/list-brands-for-whitelist.use-case';
import { UpdateBrandUseCase } from '../application/use-cases/update-brand.use-case';
import { DeleteBrandUseCase } from '../application/use-cases/delete-brand.use-case';
import { GetBrandStatsUseCase } from '../application/use-cases/get-brand-stats.use-case';
import { GetBrandEngagementHistoryUseCase } from '../application/use-cases/get-brand-engagement-history.use-case';
import { ListBrandMediaUseCase } from '../application/use-cases/list-brand-media.use-case';
import { ConfirmBrandMediaUseCase } from '../application/use-cases/confirm-brand-media.use-case';
import { DeleteBrandMediaUseCase } from '../application/use-cases/delete-brand-media.use-case';
import { BanBrandUseCase } from '../application/use-cases/ban-brand.use-case';
import { UnbanBrandUseCase } from '../application/use-cases/unban-brand.use-case';
import { ListBrandBansUseCase } from '../application/use-cases/list-brand-bans.use-case';
import { CreateBrandRequest } from '../application/dto/create-brand.request';
import { UpdateBrandRequest } from '../application/dto/update-brand.request';
import { ListBrandsQuery } from '../application/dto/list-brands.query';
import { ConfirmMediaRequest } from '../application/dto/confirm-media.request';
import { BanBrandRequest } from '../application/dto/ban-brand.request';
import { ListBansQuery } from '../application/dto/list-bans.query';
import { HistoryRangeQuery } from '../../../shared/application/dto/history-range.query';
import {
  BrandBanResponse,
  BrandMediaResponse,
  BrandResponse,
  BrandStatsResponse,
  EngagementPointResponse,
  PaginatedBrandBansResponse,
  PaginatedBrandsResponse,
  PaginatedBrandWhitelistResponse,
  toBrandBanResponse,
  toBrandMediaResponse,
  toBrandResponse,
} from './brand.presenter';

@ApiTags('brands')
@Controller('brands')
export class BrandsController {
  constructor(
    private readonly createBrand: CreateBrandUseCase,
    private readonly getBrand: GetBrandUseCase,
    private readonly getBrandByUser: GetBrandByUserUseCase,
    private readonly listBrands: ListBrandsUseCase,
    private readonly listActiveBrands: ListActiveBrandsUseCase,
    private readonly listBrandsForWhitelist: ListBrandsForWhitelistUseCase,
    private readonly updateBrand: UpdateBrandUseCase,
    private readonly deleteBrand: DeleteBrandUseCase,
    private readonly getBrandStats: GetBrandStatsUseCase,
    private readonly getBrandEngagementHistory: GetBrandEngagementHistoryUseCase,
    private readonly listMedia: ListBrandMediaUseCase,
    private readonly confirmMedia: ConfirmBrandMediaUseCase,
    private readonly deleteMedia: DeleteBrandMediaUseCase,
    private readonly banBrand: BanBrandUseCase,
    private readonly unbanBrand: UnbanBrandUseCase,
    private readonly listBrandBans: ListBrandBansUseCase,
  ) {}

  // --- Création / liste ---

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer sa marque' })
  @ApiCreatedResponse({ type: BrandResponse })
  async create(
    @CurrentUser() user: User,
    @Body() body: CreateBrandRequest,
  ): Promise<BrandResponse> {
    const brand = await this.createBrand.execute(user.id, user.verified, body);
    return toBrandResponse(brand);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lister les marques' })
  @ApiOkResponse({ type: PaginatedBrandsResponse })
  async list(
    @Query() query: ListBrandsQuery,
  ): Promise<PaginatedBrandsResponse> {
    const { brands, total } = await this.listBrands.execute(query);
    return { brands: brands.map(toBrandResponse), total };
  }

  // --- Routes spécifiques AVANT /:id ---

  @Get('admin/active')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister les marques actives (admin)' })
  @ApiOkResponse({ type: PaginatedBrandsResponse })
  async listActive(
    @Query() query: ListBrandsQuery,
  ): Promise<PaginatedBrandsResponse> {
    const { brands, total } = await this.listActiveBrands.execute(query);
    return { brands: brands.map(toBrandResponse), total };
  }

  @Get('admin/whitelist')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Marques + adresse blockchain du propriétaire (whitelist on-chain, admin)',
  })
  @ApiOkResponse({ type: PaginatedBrandWhitelistResponse })
  async listForWhitelist(
    @Query() query: ListBrandsQuery,
  ): Promise<PaginatedBrandWhitelistResponse> {
    const { brands, total } = await this.listBrandsForWhitelist.execute(query);
    return {
      brands: brands.map((entry) => ({
        brand: toBrandResponse(entry.brand),
        ownerBlockchainAddress: entry.ownerBlockchainAddress,
      })),
      total,
    };
  }

  @Get('admin/bans')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister les bans de marques (admin)' })
  @ApiOkResponse({ type: PaginatedBrandBansResponse })
  async bans(
    @Query() query: ListBansQuery,
  ): Promise<PaginatedBrandBansResponse> {
    const { bans, total } = await this.listBrandBans.execute(query);
    return { bans: bans.map(toBrandBanResponse), total };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer sa propre marque' })
  @ApiOkResponse({ type: BrandResponse })
  async myBrand(@CurrentUser() user: User): Promise<BrandResponse> {
    return toBrandResponse(await this.getBrandByUser.execute(user.id));
  }

  @Public()
  @Get('user/:userId')
  @ApiOperation({ summary: "Marque d'un utilisateur" })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiOkResponse({ type: BrandResponse })
  async byUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<BrandResponse> {
    return toBrandResponse(await this.getBrandByUser.execute(userId));
  }

  @Public()
  @Get(':id/stats')
  @ApiOperation({ summary: "Statistiques d'une marque" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BrandStatsResponse })
  stats(@Param('id', ParseUUIDPipe) id: string): Promise<BrandStatsResponse> {
    return this.getBrandStats.execute(id);
  }

  @Public()
  @Get(':id/engagement-history')
  @ApiOperation({ summary: "Historique d'engagement d'une marque (holders + likes cumulés, jour par jour)" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: EngagementPointResponse, isArray: true })
  engagementHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: HistoryRangeQuery,
  ): Promise<EngagementPointResponse[]> {
    return this.getBrandEngagementHistory.execute(id, query.days);
  }

  // --- Médias ---

  @Public()
  @Get(':id/media')
  @ApiOperation({ summary: "Médias d'une marque" })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BrandMediaResponse, isArray: true })
  async media(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BrandMediaResponse[]> {
    const media = await this.listMedia.execute(id);
    return media.map(toBrandMediaResponse);
  }

  @Post(':id/media/confirm')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmer un média uploadé (IPFS)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: BrandMediaResponse })
  async confirmBrandMedia(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ConfirmMediaRequest,
  ): Promise<BrandMediaResponse> {
    const media = await this.confirmMedia.execute(
      user.id,
      id,
      body.ipfsHash,
      body.imageUrl,
    );
    return toBrandMediaResponse(media);
  }

  @Delete(':id/media/:mediaId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un média' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'mediaId', format: 'uuid' })
  async removeMedia(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
  ): Promise<{ message: string }> {
    await this.deleteMedia.execute(user.id, id, mediaId);
    return { message: 'Media deleted' };
  }

  // --- Bans (D8) ---

  @Post(':id/ban')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Bannir une marque (admin) — le front a déjà passé les tx on-chain (blacklist + éventuel cancel-sale)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponse({ type: BrandBanResponse })
  async ban(
    @CurrentUser() admin: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: BanBrandRequest,
  ): Promise<BrandBanResponse> {
    const ban = await this.banBrand.execute(admin.id, id, body);
    const brand = await this.getBrand.execute(id);
    return toBrandBanResponse({
      ban,
      brandName: brand.name,
      bannedByUsername: admin.username,
    });
  }

  @Delete(':id/ban')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lever le ban d’une marque (admin)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async unban(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.unbanBrand.execute(id);
    return { message: 'Ban lifted' };
  }

  // --- /:id générique (en dernier) ---

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une marque par id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BrandResponse })
  async getOne(@Param('id', ParseUUIDPipe) id: string): Promise<BrandResponse> {
    return toBrandResponse(await this.getBrand.execute(id));
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour sa marque' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BrandResponse })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateBrandRequest,
  ): Promise<BrandResponse> {
    const { interestIds, ...fields } = body;
    const brand = await this.updateBrand.execute(
      user.id,
      id,
      fields,
      interestIds,
    );
    return toBrandResponse(brand);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer sa marque' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.deleteBrand.execute(user.id, id);
    return { message: 'Brand deleted' };
  }
}
