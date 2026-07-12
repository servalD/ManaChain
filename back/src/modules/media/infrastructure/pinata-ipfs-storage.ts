import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../../infrastructure/config/env.validation';
import {
  IpfsStorage,
  MediaFile,
  UploadedMedia,
} from '../application/ports/ipfs-storage.port';
import { IpfsStorageUnavailableError } from '../domain/media.errors';

interface PinataUploadResponse {
  IpfsHash?: string;
}

/**
 * Adapter Pinata via `fetch` natif (Node ≥20, pas de dépendance HTTP
 * supplémentaire dans le back). Reprend le comportement de l'ancienne route
 * Next `client/src/app/api/pinata/upload/route.ts` (métadonnées, cidVersion 1,
 * 404 sur unpin traité comme un succès).
 */
@Injectable()
export class PinataIpfsStorage extends IpfsStorage {
  constructor(private readonly config: ConfigService<Env, true>) {
    super();
  }

  async upload(file: MediaFile): Promise<UploadedMedia> {
    const jwt = this.config.get('PINATA_JWT', { infer: true });
    if (!jwt) {
      throw new IpfsStorageUnavailableError();
    }

    const formData = new FormData();
    formData.append(
      'file',
      new Blob([Uint8Array.from(file.buffer)], { type: file.mimetype }),
      file.filename,
    );
    formData.append(
      'pinataMetadata',
      JSON.stringify({
        name: file.filename,
        keyvalues: {
          uploadedAt: new Date().toISOString(),
          originalName: file.filename,
          type: file.mimetype,
        },
      }),
    );
    formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

    const response = await fetch(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${jwt}` },
        body: formData,
      },
    );

    if (!response.ok) {
      throw new IpfsStorageUnavailableError();
    }

    const data = (await response.json()) as PinataUploadResponse;
    if (!data.IpfsHash) {
      throw new IpfsStorageUnavailableError();
    }

    const gateway = this.config
      .get('PINATA_GATEWAY_URL', { infer: true })
      .replace(/\/$/, '');
    return { cid: data.IpfsHash, url: `${gateway}/ipfs/${data.IpfsHash}` };
  }

  async unpin(cid: string): Promise<void> {
    const jwt = this.config.get('PINATA_JWT', { infer: true });
    if (!jwt) {
      throw new IpfsStorageUnavailableError();
    }

    const response = await fetch(
      `https://api.pinata.cloud/pinning/unpin/${encodeURIComponent(cid)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${jwt}` },
      },
    );

    // 404 = déjà dépublié (ou jamais épinglé) : idempotent, pas une erreur.
    if (!response.ok && response.status !== 404) {
      throw new IpfsStorageUnavailableError();
    }
  }
}
