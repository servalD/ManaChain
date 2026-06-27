/**
 * Claims du JWT applicatif. Forme **compatible avec l'Express actuel**
 * (`{ userId, email, isBrand, verified }`) pour que les deux back émettent/valident
 * des jetons interchangeables pendant la bascule strangler.
 */
export interface AppJwtClaims {
  userId: string;
  email: string;
  isBrand: boolean;
  verified: boolean;
}

/**
 * PORT : signature et vérification du JWT applicatif (HS256, secret partagé).
 * `verify` lève si le jeton est absent, malformé, expiré ou de signature invalide.
 */
export abstract class AppTokenService {
  abstract sign(claims: AppJwtClaims): string;
  abstract verify(token: string): AppJwtClaims;
}
