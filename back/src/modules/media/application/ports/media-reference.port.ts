/**
 * Vérifie à qui appartient un CID déjà rattaché à une ressource métier
 * (média de marque, avatar, candidature, couverture d'event…). Un CID pas
 * encore rattaché (fraîchement uploadé) n'appartient à personne → suppression
 * autorisée : voir {@link DeleteMediaUseCase}.
 */
export abstract class MediaReferenceChecker {
  abstract isReferencedByAnotherUser(
    cid: string,
    userId: string,
  ): Promise<boolean>;
}
