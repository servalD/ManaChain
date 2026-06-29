import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

/**
 * Persistance de la table `brand_like` existante. Pas de relations ORM vers
 * `brand`/`user` (modules non migrés) : les jointures se font en SQL dans
 * l'adapter. Colonnes snake_case dérivées par la SnakeNamingStrategy.
 */
@Entity({ name: 'brand_like' })
@Unique(['userId', 'brandId'])
export class BrandLikeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Index()
  @Column({ type: 'uuid' })
  brandId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
