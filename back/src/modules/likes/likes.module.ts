import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandsModule } from '../brands/brands.module';
import { BrandLikeOrmEntity } from './infrastructure/brand-like.orm-entity';
import { LikeRepository } from './domain/like.repository';
import { BrandDirectory } from './domain/brand-directory';
import { TypeOrmLikeRepository } from './infrastructure/typeorm-like.repository';
import { TypeOrmBrandDirectory } from './infrastructure/typeorm-brand-directory';
import { CreateLikeUseCase } from './application/use-cases/create-like.use-case';
import { GetMyLikesUseCase } from './application/use-cases/get-my-likes.use-case';
import { GetBrandLikesUseCase } from './application/use-cases/get-brand-likes.use-case';
import { DeleteLikeUseCase } from './application/use-cases/delete-like.use-case';
import { LikesController } from './presentation/likes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BrandLikeOrmEntity]), BrandsModule],
  controllers: [LikesController],
  providers: [
    { provide: LikeRepository, useClass: TypeOrmLikeRepository },
    { provide: BrandDirectory, useClass: TypeOrmBrandDirectory },
    CreateLikeUseCase,
    GetMyLikesUseCase,
    GetBrandLikesUseCase,
    DeleteLikeUseCase,
  ],
})
export class LikesModule {}
