import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SendPasswordExpiryRemindersUseCase } from '../application/use-cases/send-password-expiry-reminders.use-case';

/** Déclenche quotidiennement {@link SendPasswordExpiryRemindersUseCase}. */
@Injectable()
export class PasswordExpiryReminderScheduler {
  private readonly logger = new Logger(PasswordExpiryReminderScheduler.name);

  constructor(private readonly useCase: SendPasswordExpiryRemindersUseCase) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async run(): Promise<void> {
    const sent = await this.useCase.execute();
    if (sent > 0) {
      this.logger.log(`Sent ${sent} password expiry reminder(s)`);
    }
  }
}
