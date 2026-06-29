/**
 * PORT : génère un mot de passe temporaire fort (compte BRANDUSER créé à
 * l'approbation d'une candidature). Adapter par défaut : 12 caractères mêlant
 * majuscules, minuscules, chiffres et symboles.
 */
export abstract class TemporaryPasswordGenerator {
  abstract generate(): string;
}
