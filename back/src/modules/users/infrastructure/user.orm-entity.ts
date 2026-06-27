import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../../shared/enums/role.enum';

/**
 * Modèle de persistance (TypeORM) de la table `"user"` existante. Séparé du
 * modèle de domaine {@link User} : l'adapter mappe entre les deux. Les noms de
 * colonnes snake_case sont dérivés automatiquement par la SnakeNamingStrategy
 * (`firstName` → `first_name`). Table nommée explicitement car `user` est un mot
 * réservé Postgres.
 */
@Entity({ name: 'user' })
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'text', unique: true })
  username: string;

  @Column({ type: 'text' })
  firstName: string;

  @Column({ type: 'text' })
  lastName: string;

  // Confiné à l'infra ; jamais exposé au domaine. Non sélectionné par défaut.
  @Column({ type: 'text', select: false })
  passwordHash: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'text' })
  ageRange: string;

  @Column({ type: 'text', nullable: true, unique: true })
  blockchainAddress: string | null;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ type: 'boolean', default: false })
  isBrand: boolean;

  @Column({ type: 'text', default: Role.CLIENT })
  role: Role;

  @Column({ type: 'boolean', default: true })
  passwordChanged: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastLogin: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
