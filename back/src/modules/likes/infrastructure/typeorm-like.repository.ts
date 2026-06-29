import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from '../domain/like';
import { LikeRepository } from '../domain/like.repository';
import { LikedBrand, Liker } from '../domain/like.views';
import { BrandLikeOrmEntity } from './brand-like.orm-entity';

interface LikedBrandRow {
  like_id: string;
  liked_at: Date;
  brand_id: string;
  brand_owner_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  country: string;
  brand_created_at: Date;
}

interface LikerRow {
  like_id: string;
  liked_at: Date;
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  age_range: string;
  verified: boolean;
}

/**
 * Adapter TypeORM du port {@link LikeRepository}. CRUD via le repository ;
 * jointures `brand`/`user` en SQL (modules non migrés) → read-models de domaine.
 */
@Injectable()
export class TypeOrmLikeRepository extends LikeRepository {
  constructor(
    @InjectRepository(BrandLikeOrmEntity)
    private readonly repository: Repository<BrandLikeOrmEntity>,
  ) {
    super();
  }

  async existsByUserAndBrand(
    userId: string,
    brandId: string,
  ): Promise<boolean> {
    return this.repository.existsBy({ userId, brandId });
  }

  async create(userId: string, brandId: string): Promise<Like> {
    const saved = await this.repository.save(
      this.repository.create({ userId, brandId }),
    );
    return new Like(saved.id, saved.userId, saved.brandId, saved.createdAt);
  }

  async findById(likeId: string): Promise<Like | null> {
    const entity = await this.repository.findOne({ where: { id: likeId } });
    return entity
      ? new Like(entity.id, entity.userId, entity.brandId, entity.createdAt)
      : null;
  }

  async delete(likeId: string): Promise<void> {
    await this.repository.delete({ id: likeId });
  }

  async findLikedBrandsByUser(userId: string): Promise<LikedBrand[]> {
    const rows = await this.repository.manager.query<LikedBrandRow[]>(
      `SELECT bl.id AS like_id, bl.created_at AS liked_at,
              b.id AS brand_id, b.user_id AS brand_owner_id, b.name,
              b.description, b.logo_url, b.website_url, b.country,
              b.created_at AS brand_created_at
       FROM brand_like bl
       JOIN brand b ON b.id = bl.brand_id
       WHERE bl.user_id = $1
       ORDER BY bl.created_at DESC`,
      [userId],
    );
    return rows.map((r) => ({
      likeId: r.like_id,
      likedAt: r.liked_at,
      brand: {
        id: r.brand_id,
        ownerId: r.brand_owner_id,
        name: r.name,
        description: r.description,
        logoUrl: r.logo_url,
        websiteUrl: r.website_url,
        country: r.country,
        createdAt: r.brand_created_at,
      },
    }));
  }

  async findLikersByBrand(brandId: string): Promise<Liker[]> {
    const rows = await this.repository.manager.query<LikerRow[]>(
      `SELECT bl.id AS like_id, bl.created_at AS liked_at,
              u.id AS user_id, u.username, u.first_name, u.last_name,
              u.avatar_url, u.age_range, u.verified
       FROM brand_like bl
       JOIN "user" u ON u.id = bl.user_id
       WHERE bl.brand_id = $1
       ORDER BY bl.created_at DESC`,
      [brandId],
    );
    return rows.map((r) => ({
      likeId: r.like_id,
      likedAt: r.liked_at,
      user: {
        id: r.user_id,
        username: r.username,
        firstName: r.first_name,
        lastName: r.last_name,
        avatarUrl: r.avatar_url,
        ageRange: r.age_range,
        verified: r.verified,
      },
    }));
  }
}
