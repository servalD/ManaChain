import { BrandApplication } from '../domain/brand-application';
import { BrandApplicationMailer } from '../domain/brand-application-mailer.port';
import { InterestChecker } from '../domain/interest-checker';
import { TemporaryPasswordGenerator } from '../domain/temporary-password-generator';

/** Valide les interests selon un ensemble préchargé (tout valide par défaut). */
export class FakeInterestChecker extends InterestChecker {
  private readonly valid: Set<string> | null;
  constructor(validIds?: string[]) {
    super();
    this.valid = validIds ? new Set(validIds) : null;
  }
  allExist(interestIds: string[]): Promise<boolean> {
    if (this.valid === null) return Promise.resolve(true);
    return Promise.resolve(interestIds.every((id) => this.valid!.has(id)));
  }
}

/** Génère un mot de passe temporaire fixe. */
export class FakeTemporaryPasswordGenerator extends TemporaryPasswordGenerator {
  generate(): string {
    return 'Temp1234!@';
  }
}

/** Mailer candidatures espion. */
export class FakeBrandApplicationMailer extends BrandApplicationMailer {
  readonly verifications: string[] = [];
  readonly adminNotifications: string[] = [];
  readonly approvals: { to: string; username: string; password: string }[] = [];
  readonly rejections: { to: string; reason: string }[] = [];

  sendVerification(to: string): Promise<void> {
    this.verifications.push(to);
    return Promise.resolve();
  }
  sendAdminNotification(to: string, _app: BrandApplication): Promise<void> {
    this.adminNotifications.push(to);
    return Promise.resolve();
  }
  sendApproved(
    to: string,
    _brandName: string,
    username: string,
    password: string,
  ): Promise<void> {
    this.approvals.push({ to, username, password });
    return Promise.resolve();
  }
  sendRejected(to: string, _brandName: string, reason: string): Promise<void> {
    this.rejections.push({ to, reason });
    return Promise.resolve();
  }
}
