import { IpfsStorage, MediaFile, UploadedMedia } from './ports/ipfs-storage.port';
import { MediaReferenceChecker } from './ports/media-reference.port';

export class FakeIpfsStorage extends IpfsStorage {
  readonly uploaded: MediaFile[] = [];
  readonly unpinned: string[] = [];
  private nextCid = 0;

  upload(file: MediaFile): Promise<UploadedMedia> {
    this.uploaded.push(file);
    const cid = `cid-${++this.nextCid}`;
    return Promise.resolve({ cid, url: `https://gateway.test/ipfs/${cid}` });
  }

  unpin(cid: string): Promise<void> {
    this.unpinned.push(cid);
    return Promise.resolve();
  }
}

export class FakeMediaReferenceChecker extends MediaReferenceChecker {
  private readonly ownedByOtherCids = new Set<string>();

  /** Marque `cid` comme référencé par une ressource d'un autre utilisateur. */
  seedOwnedByOther(cid: string): void {
    this.ownedByOtherCids.add(cid);
  }

  isReferencedByAnotherUser(cid: string): Promise<boolean> {
    return Promise.resolve(this.ownedByOtherCids.has(cid));
  }
}
