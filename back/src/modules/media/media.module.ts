import { Module } from '@nestjs/common';
import { IpfsStorage } from './application/ports/ipfs-storage.port';
import { MediaReferenceChecker } from './application/ports/media-reference.port';
import { PinataIpfsStorage } from './infrastructure/pinata-ipfs-storage';
import { TypeOrmMediaReferenceRepository } from './infrastructure/typeorm-media-reference.repository';
import { UploadMediaUseCase } from './application/use-cases/upload-media.use-case';
import { DeleteMediaUseCase } from './application/use-cases/delete-media.use-case';
import { MediaController } from './presentation/media.controller';

@Module({
  controllers: [MediaController],
  providers: [
    { provide: IpfsStorage, useClass: PinataIpfsStorage },
    { provide: MediaReferenceChecker, useClass: TypeOrmMediaReferenceRepository },
    UploadMediaUseCase,
    DeleteMediaUseCase,
  ],
})
export class MediaModule {}
