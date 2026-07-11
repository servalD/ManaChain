export interface MediaFile {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

export interface UploadedMedia {
  cid: string;
  url: string;
}

/** Port de stockage IPFS (Pinata en infra). */
export abstract class IpfsStorage {
  abstract upload(file: MediaFile): Promise<UploadedMedia>;
  /** Idempotent : un CID déjà dépublié (404 côté fournisseur) n'est pas une erreur. */
  abstract unpin(cid: string): Promise<void>;
}
