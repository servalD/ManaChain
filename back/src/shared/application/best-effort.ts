import { Logger } from '@nestjs/common';

const logger = new Logger('BestEffort');

/**
 * Exécute un effet de bord non critique (email, notification…) sans jamais
 * faire échouer l'appelant : l'erreur est loguée (warn) puis avalée. Réservé
 * aux effets de bord annexes — l'écriture DB principale doit rester hors du
 * wrapper. `label` identifie l'effet de bord dans le log (ex. "verification
 * email").
 */
export async function bestEffort(
  label: string,
  work: () => Promise<unknown>,
): Promise<void> {
  try {
    await work();
  } catch (error) {
    logger.warn(`${label} failed: ${(error as Error).message}`);
  }
}
