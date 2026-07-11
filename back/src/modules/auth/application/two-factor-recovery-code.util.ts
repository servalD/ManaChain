/**
 * Normalise un code de récupération saisi par l'utilisateur (espaces, tiret,
 * casse) vers la forme hashée par `EnableTwoFactorUseCase` (10 car. hex bas de
 * casse, sans tiret) — tolère qu'il soit tapé avec ou sans le séparateur affiché.
 */
export const normalizeRecoveryCode = (input: string): string =>
  input.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
