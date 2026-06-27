import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../users/domain/user.repository';
import { SecureTokenGenerator } from '../ports/secure-token-generator.port';
import { Mailer } from '../ports/mailer.port';

const RESET_TTL_MS = 60 * 60 * 1000; // 1h

/**
 * Mot de passe oublié : génère un token de reset et envoie l'email. **Réponse
 * constante** côté présentation (ce use-case ne lève jamais) pour ne pas révéler
 * si l'email existe.
 */
@Injectable()
export class RequestPasswordResetUseCase {
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

    const token = this.tokenGenerator.generate();
    const expiresAt = new Date(Date.now() + RESET_TTL_MS);
    await this.userRepository.setPasswordResetToken(user.id, token, expiresAt);

    try {
      await this.mailer.sendPasswordReset(user.email, user.username, token);
    } catch {
      /* email non bloquant */
    }
  }
}
