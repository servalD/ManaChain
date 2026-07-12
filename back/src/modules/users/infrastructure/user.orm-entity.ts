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

  /** Remis à `NOW()` à chaque changement/reset réussi — base du rappel de rotation CNIL (60j). */
  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  passwordChangedAt: Date;

  /** Dernier envoi de l'email de rappel de rotation ; NULL = jamais envoyé pour ce mot de passe. */
  @Column({ type: 'timestamptz', nullable: true })
  passwordReminderSentAt: Date | null;

  @Column({ type: 'text', nullable: true })
  emailVerificationToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerificationExpires: Date | null;

  @Column({ type: 'text', nullable: true })
  passwordResetToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  passwordResetExpires: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLogin: Date | null;

  /** RGPD : compte anonymisé (suppression de compte). NULL = actif. */
  @Column({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'boolean', default: false })
  twoFactorEnabled: boolean;

  // Secret TOTP chiffré (AES-256-GCM, cf. AesTwoFactorSecretCipher). Confiné
  // à l'infra ; jamais exposé au domaine. Non sélectionné par défaut.
  @Column({ type: 'text', nullable: true, select: false })
  twoFactorSecret: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
