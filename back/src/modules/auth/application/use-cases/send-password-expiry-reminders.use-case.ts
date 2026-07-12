import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from '../../../users/domain/user.repository';
import { Mailer } from '../ports/mailer.port';

/** Backlog sécu CNIL : rotation de mot de passe conseillée, email seul (pas de blocage). */
export const PASSWORD_ROTATION_DAYS = 60;

/**
 * Envoie un rappel de rotation de mot de passe aux comptes locaux dont le mot
 * de passe date de plus de {@link PASSWORD_ROTATION_DAYS} jours. Purement
 * informatif : n'invalide rien, ne bloque aucune connexion. Appelé par le
 * scheduler quotidien ({@link PasswordExpiryReminderScheduler}).
 */
@Injectable()
export class SendPasswordExpiryRemindersUseCase {
  private readonly logger = new Logger(SendPasswordExpiryRemindersUseCase.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly mailer: Mailer,
  ) {}

  async execute(): Promise<number> {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - PASSWORD_ROTATION_DAYS);

    const due = await this.userRepository.listUsersWithExpiredPassword(cutoff);

    let sent = 0;
    for (const user of due) {
      try {
        await this.mailer.sendPasswordExpiryReminder(user.email, user.username);
        await this.userRepository.markPasswordReminderSent(user.id);
        sent += 1;
      } catch (err) {
        // Best-effort : un envoi qui échoue ne doit pas bloquer les suivants
        // ni marquer `passwordReminderSentAt` (on retentera au prochain run).
        this.logger.warn(
          `Failed to send password expiry reminder to user ${user.id}: ${err}`,
        );
      }
    }
    return sent;
  }
}
