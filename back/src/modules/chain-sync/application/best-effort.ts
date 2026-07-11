/**
 * Exécute un travail annexe (notification…) sans jamais faire échouer le
 * handler appelant : toute erreur est avalée. À réserver aux effets de bord
 * non critiques — l'écriture DB principale doit rester hors du wrapper.
 */
export async function bestEffort(work: () => Promise<void>): Promise<void> {
  try {
    await work();
  } catch {
    /* non bloquant */
  }
}
