import { TwoFactorChallengeRepository } from '../domain/two-factor-challenge.repository';
import { SecureTokenGenerator } from './ports/secure-token-generator.port';

/** Durée de vie d'un challenge 2FA de login (local ou Google). */
export const TWO_FACTOR_CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Crée un challenge 2FA opaque pour `userId`, partagé par login local et Google. */
export const createTwoFactorChallenge = async (
  tokenGenerator: SecureTokenGenerator,
  challengeRepository: TwoFactorChallengeRepository,
  userId: string,
): Promise<string> => {
  const token = tokenGenerator.generate();
  const expiresAt = new Date(Date.now() + TWO_FACTOR_CHALLENGE_TTL_MS);
  await challengeRepository.create(userId, token, expiresAt);
  return token;
};
