import { Injectable } from '@nestjs/common';
import { Role } from '../../../../shared/enums/role.enum';
import { User } from '../../../users/domain/user';
import { UserRepository } from '../../../users/domain/user.repository';
import { UsernameAlreadyTakenError } from '../../../users/domain/user.errors';
import { EmailAlreadyRegisteredError } from '../../domain/auth.errors';
import { PasswordHasher } from '../ports/password-hasher.port';
import { SecureTokenGenerator } from '../ports/secure-token-generator.port';
import { Mailer } from '../ports/mailer.port';

export interface RegisterInput {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  ageRange: string;
  interests?: string[];
  /**
   * Rôle forcé à la création. N'est JAMAIS lu depuis le body HTTP — le
   * contrôleur le calcule à partir de `BOOTSTRAP_ADMIN_EMAIL` (bootstrap du
   * tout premier compte admin d'un environnement). Absent → CLIENT.
   */
  role?: Role;
  /**
   * Vérifie le compte dès la création, sans email. N'est JAMAIS lu depuis le
   * body HTTP — le contrôleur le calcule à partir de `SKIP_EMAIL_VERIFICATION`
   * (dev/démo uniquement). Absent → false (flux normal).
   */
  verified?: boolean;
}

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Inscription d'un compte local : crée un utilisateur NON vérifié et envoie
 * l'email de vérification. Ne renvoie pas de JWT (login requis après vérification).
 */
@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGenerator: SecureTokenGenerator,
    private readonly mailer: Mailer,
  ) {}

  async execute(input: RegisterInput): Promise<User> {
    if (await this.userRepository.findByEmail(input.email)) {
      throw new EmailAlreadyRegisteredError();
    }
    if (await this.userRepository.findByUsername(input.username)) {
      throw new UsernameAlreadyTakenError(input.username);
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const verificationToken = this.tokenGenerator.generate();
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

    const user = await this.userRepository.createLocal({
      email: input.email,
      username: input.username,
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash,
      ageRange: input.ageRange,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: expiresAt,
      interests: input.interests,
      role: input.role,
      verified: input.verified,
    });

    if (!input.verified) {
      // Best-effort : l'inscription réussit même si l'email ne part pas (l'adapter logue).
      await this.safeSend(() =>
        this.mailer.sendEmailVerification(
          user.email,
          user.username,
          verificationToken,
        ),
      );
    }

    return user;
  }

  private async safeSend(send: () => Promise<void>): Promise<void> {
    try {
      await send();
    } catch {
      /* email non bloquant */
    }
  }
}
