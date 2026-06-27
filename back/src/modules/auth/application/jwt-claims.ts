import { User } from '../../users/domain/user';
import { AppJwtClaims } from './ports/app-token.service';

/** Construit les claims du JWT applicatif à partir d'un {@link User} de domaine. */
export const toAppJwtClaims = (user: User): AppJwtClaims => ({
  userId: user.id,
  email: user.email,
  isBrand: user.isBrand,
  verified: user.verified,
});
