/** Centre d'intérêt disponible (table `interest`), pour affichage (sélecteurs). */
export interface InterestSummary {
  id: string;
  label: string;
  icon: string | null;
}

/** PORT : liste tous les centres d'intérêt disponibles. */
export abstract class InterestReader {
  abstract listAll(): Promise<InterestSummary[]>;
}
