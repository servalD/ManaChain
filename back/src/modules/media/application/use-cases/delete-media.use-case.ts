import { Injectable } from '@nestjs/common';
import { IpfsStorage } from '../ports/ipfs-storage.port';
import { MediaReferenceChecker } from '../ports/media-reference.port';
import {
  InvalidMediaFileError,
  MediaNotOwnedError,
} from '../../domain/media.errors';

// CIDv0 (base58btc) ou CIDv1 (base32/base36) : alphanumérique uniquement.
const CID_FORMAT = /^[a-zA-Z0-9]+$/;

/**
 * Dépublie un CID d'IPFS. Contrôle pragmatique de propriété : refuse si le
 * CID est déjà rattaché à une ressource d'un AUTRE utilisateur ; autorise
 * sinon, ce qui couvre le cas courant d'un fichier tout juste uploadé et pas
 * encore attaché à une ressource (wizards, candidature de marque).
 */
@Injectable()
export class DeleteMediaUseCase {
  constructor(
    private readonly ipfsStorage: IpfsStorage,
    private readonly referenceChecker: MediaReferenceChecker,
  ) {}

  async execute(userId: string, cid: string): Promise<void> {
    if (!CID_FORMAT.test(cid)) {
      throw new InvalidMediaFileError('Invalid IPFS CID format');
    }

    const ownedByOther = await this.referenceChecker.isReferencedByAnotherUser(
      cid,
      userId,
    );
    if (ownedByOther) {
      throw new MediaNotOwnedError();
    }

    await this.ipfsStorage.unpin(cid);
  }
}
