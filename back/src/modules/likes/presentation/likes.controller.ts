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
import { User } from '../../users/domain/user';
import { CreateLikeUseCase } from '../application/use-cases/create-like.use-case';
import { GetMyLikesUseCase } from '../application/use-cases/get-my-likes.use-case';
import { GetBrandLikesUseCase } from '../application/use-cases/get-brand-likes.use-case';
import { DeleteLikeUseCase } from '../application/use-cases/delete-like.use-case';
import { CreateLikeRequest } from '../application/dto/create-like.request';
import {
  LikedBrandResponse,
  LikeResponse,
  LikerResponse,
  toLikedBrandResponse,
  toLikeResponse,
  toLikerResponse,
} from './like.presenter';

@ApiTags('likes')
@ApiBearerAuth()
@Controller('likes')
export class LikesController {
  constructor(
    private readonly createLike: CreateLikeUseCase,
    private readonly getMyLikes: GetMyLikesUseCase,
    private readonly getBrandLikes: GetBrandLikesUseCase,
    private readonly deleteLike: DeleteLikeUseCase,
  ) {}

  /** Aimer une marque. */
  @Post()
  @ApiOperation({ summary: 'Aimer une marque' })
  @ApiCreatedResponse({ type: LikeResponse })
  async create(
    @CurrentUser() user: User,
    @Body() body: CreateLikeRequest,
  ): Promise<LikeResponse> {
    const like = await this.createLike.execute(user.id, body.brandId);
    return toLikeResponse(like);
  }

  /** Marques aimées par l'utilisateur courant. */
  @Get('me')
  @ApiOperation({ summary: 'Mes marques aimées' })
  @ApiOkResponse({ type: LikedBrandResponse, isArray: true })
  async myLikes(@CurrentUser() user: User): Promise<LikedBrandResponse[]> {
    const likes = await this.getMyLikes.execute(user.id);
    return likes.map(toLikedBrandResponse);
  }

  /** Likes d'une marque — propriétaire de la marque ou admin uniquement. */
  @Get('brand/:brandId')
  @ApiOperation({ summary: "Likes d'une marque (propriétaire/admin)" })
  @ApiParam({ name: 'brandId', format: 'uuid' })
  @ApiOkResponse({ type: LikerResponse, isArray: true })
  async brandLikes(
    @CurrentUser() user: User,
    @Param('brandId', ParseUUIDPipe) brandId: string,
  ): Promise<LikerResponse[]> {
    const likers = await this.getBrandLikes.execute(user, brandId);
    return likers.map(toLikerResponse);
  }

  /** Retirer un de ses likes. */
  @Delete(':likeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retirer un like' })
  @ApiParam({ name: 'likeId', format: 'uuid' })
  async remove(
    @CurrentUser() user: User,
    @Param('likeId', ParseUUIDPipe) likeId: string,
  ): Promise<{ message: string }> {
    await this.deleteLike.execute(user.id, likeId);
    return { message: 'Like removed successfully' };
  }
}
