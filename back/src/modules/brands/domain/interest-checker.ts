/** PORT : valide que des identifiants de centres d'intérêt existent (table `interest`). */
export abstract class InterestChecker {
  abstract allExist(interestIds: string[]): Promise<boolean>;
}
