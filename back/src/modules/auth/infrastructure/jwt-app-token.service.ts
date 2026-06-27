import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Env } from '../../../infrastructure/config/env.validation';
import {
  AppJwtClaims,
  AppTokenService,
} from '../application/ports/app-token.service';

/**
 * Adapter {@link AppTokenService} basé sur jsonwebtoken (HS256). Le secret et la
 * durée de vie viennent de la config ; `verify` relaie l'erreur jwt (le use-case
 * appelant la traduit en exception de domaine).
 */
@Injectable()
export class JwtAppTokenService extends AppTokenService {
  constructor(private readonly config: ConfigService<Env, true>) {
    super();
  }

  private get secret(): jwt.Secret {
    return this.config.get('APP_JWT_SECRET', { infer: true });
  }

  sign(claims: AppJwtClaims): string {
    const options: jwt.SignOptions = {
      expiresIn: this.config.get('APP_JWT_EXPIRES_IN', {
        infer: true,
      }),
    };
    return jwt.sign({ ...claims }, this.secret, options);
  }

  verify(token: string): AppJwtClaims {
    return jwt.verify(token, this.secret) as AppJwtClaims;
  }
}
