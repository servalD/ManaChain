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
import { UpdateBrandUseCase } from '../application/use-cases/update-brand.use-case';
import { DeleteBrandUseCase } from '../application/use-cases/delete-brand.use-case';
import { GetBrandStatsUseCase } from '../application/use-cases/get-brand-stats.use-case';
import { ListBrandMediaUseCase } from '../application/use-cases/list-brand-media.use-case';
import { ConfirmBrandMediaUseCase } from '../application/use-cases/confirm-brand-media.use-case';
import { DeleteBrandMediaUseCase } from '../application/use-cases/delete-brand-media.use-case';
import { CreateBrandRequest } from '../application/dto/create-brand.request';
import { UpdateBrandRequest } from '../application/dto/update-brand.request';
import { ListBrandsQuery } from '../application/dto/list-brands.query';
import { ConfirmMediaRequest } from '../application/dto/confirm-media.request';
import {
  BrandMediaResponse,
  BrandResponse,
  BrandStatsResponse,
  PaginatedBrandsResponse,
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
    private readonly updateBrand: UpdateBrandUseCase,
    private readonly deleteBrand: DeleteBrandUseCase,
    private readonly getBrandStats: GetBrandStatsUseCase,
    private readonly listMedia: ListBrandMediaUseCase,
    private readonly confirmMedia: ConfirmBrandMediaUseCase,
    private readonly deleteMedia: DeleteBrandMediaUseCase,
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
    const brand = await this.createBrand.execute(user.id, body);
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
    const { brands, total } = await this.listBrands.execute(query);
    return { brands: brands.map(toBrandResponse), total };
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
