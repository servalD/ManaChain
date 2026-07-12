import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import { TotpService } from '../application/ports/totp.port';

const ISSUER = 'ManaChain';

// otplib v12 (classique, CJS) plutôt que v13 : v13 tire des dépendances
// ESM-only (@scure/base) qui cassent la transformation Jest des e2e (tout le
// module Nest est chargé, contrairement aux tests unitaires qui n'importent
// que les fakes). v12 reste largement utilisé et suffisant ici.
authenticator.options = { window: 1 };

@Injectable()
export class OtplibTotpService extends TotpService {
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  keyUri(secret: string, accountEmail: string): string {
    return authenticator.keyuri(accountEmail, ISSUER, secret);
  }

  verify(token: string, secret: string): boolean {
    return authenticator.check(token, secret);
  }
}
