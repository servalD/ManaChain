/**
 * PORT (couche application) : exécute un bloc de travail dans une transaction
 * atomique — tout réussit ou tout est annulé (rollback). L'implémentation est un
 * détail d'infrastructure ; les use-cases restent purs et se contentent
 * d'envelopper leurs écritures multi-repos dans `run(...)`.
 *
 * Les effets de bord non-DB (hook blockchain, envoi d'email) doivent être appelés
 * APRÈS `run` (une fois le commit acquis), jamais à l'intérieur.
 */
export abstract class TransactionRunner {
  abstract run<T>(work: () => Promise<T>): Promise<T>;
}
