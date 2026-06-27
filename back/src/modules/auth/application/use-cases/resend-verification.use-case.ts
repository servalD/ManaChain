import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../users/domain/user.repository';
import { EmailAlreadyVerifiedError } from '../../domain/auth.errors';
import { SecureTokenGenerator } from '../ports/secure-token-generator.port';
import { Mailer } from '../ports/mailer.port';

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Renvoie l'email de vérification : régénère un token et l'envoie. Pour limiter
 * l'énumération de comptes, un email inconnu ne déclenche aucune erreur (no-op).
 */
@Injectable()
export class ResendVerificationUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenGenerator: SecureTokenGenerator,
    private readonly mailer: Mailer,
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return;
    }
    if (user.verified) {
      throw new EmailAlreadyVerifiedError();
    }

    const token = this.tokenGenerator.generate();
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
    await this.userRepository.setEmailVerificationToken(
      user.id,
      token,
      expiresAt,
    );

    try {
      await this.mailer.sendEmailVerification(user.email, user.username, token);
    } catch {
      /* email non bloquant */
    }
  }
}
