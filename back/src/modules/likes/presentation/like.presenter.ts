import { ApiProperty } from '@nestjs/swagger';
import { Like } from '../domain/like';
import { LikedBrand, Liker } from '../domain/like.views';

export class LikeResponse {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ format: 'uuid' })
  brandId: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;
}

class LikedBrandSummaryResponse {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) ownerId: string;
  @ApiProperty() name: string;
  @ApiProperty({ type: String, nullable: true }) description: string | null;
  @ApiProperty({ type: String, nullable: true }) logoUrl: string | null;
  @ApiProperty({ type: String, nullable: true }) websiteUrl: string | null;
  @ApiProperty() country: string;
  @ApiProperty({ format: 'date-time' }) createdAt: string;
}

export class LikedBrandResponse {
  @ApiProperty({ format: 'uuid' }) likeId: string;
  @ApiProperty({ format: 'date-time' }) likedAt: string;
  @ApiProperty({ type: LikedBrandSummaryResponse })
  brand: LikedBrandSummaryResponse;
}

class LikerUserResponse {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() username: string;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty({ type: String, nullable: true }) avatarUrl: string | null;
  @ApiProperty() ageRange: string;
  @ApiProperty() verified: boolean;
}

export class LikerResponse {
  @ApiProperty({ format: 'uuid' }) likeId: string;
  @ApiProperty({ format: 'date-time' }) likedAt: string;
  @ApiProperty({ type: LikerUserResponse }) user: LikerUserResponse;
}

export const toLikeResponse = (like: Like): LikeResponse => ({
  id: like.id,
  userId: like.userId,
  brandId: like.brandId,
  createdAt: like.createdAt.toISOString(),
});

export const toLikedBrandResponse = (v: LikedBrand): LikedBrandResponse => ({
  likeId: v.likeId,
  likedAt: v.likedAt.toISOString(),
  brand: {
    id: v.brand.id,
    ownerId: v.brand.ownerId,
    name: v.brand.name,
    description: v.brand.description,
    logoUrl: v.brand.logoUrl,
    websiteUrl: v.brand.websiteUrl,
    country: v.brand.country,
    createdAt: v.brand.createdAt.toISOString(),
  },
});

export const toLikerResponse = (v: Liker): LikerResponse => ({
  likeId: v.likeId,
  likedAt: v.likedAt.toISOString(),
  user: { ...v.user },
});
