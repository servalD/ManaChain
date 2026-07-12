import {
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { User } from '../../users/domain/user';
import { UploadMediaUseCase } from '../application/use-cases/upload-media.use-case';
import { DeleteMediaUseCase } from '../application/use-cases/delete-media.use-case';
import { InvalidMediaFileError } from '../domain/media.errors';
import { MediaUploadResponse, toMediaUploadResponse } from './media.presenter';

/**
 * Remplace les anciennes routes Next `client/src/app/api/pinata/*`, qui
 * n'exigeaient aucune authentification (H-1 de l'audit sécu) : le secret
 * Pinata vit désormais ici, derrière l'`AuthGuard` global — pas de
 * restriction de rôle, un simple CLIENT authentifié peut uploader avant de
 * devenir marque (candidature).
 */
@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(
    private readonly uploadMedia: UploadMediaUseCase,
    private readonly deleteMedia: DeleteMediaUseCase,
  ) {}

  @Post('upload')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Uploader un fichier sur IPFS' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiCreatedResponse({ type: MediaUploadResponse })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async upload(
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<MediaUploadResponse> {
    if (!file) {
      throw new InvalidMediaFileError('No file provided');
    }
    const media = await this.uploadMedia.execute({
      buffer: file.buffer,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });
    return toMediaUploadResponse(media);
  }

  @Delete(':cid')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dépublier un fichier IPFS' })
  @ApiParam({ name: 'cid' })
  async remove(
    @CurrentUser() user: User,
    @Param('cid') cid: string,
  ): Promise<{ message: string }> {
    await this.deleteMedia.execute(user.id, cid);
    return { message: 'Media deleted' };
  }
}
