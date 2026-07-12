import { Injectable } from '@nestjs/common';
import { IpfsStorage, UploadedMedia } from '../ports/ipfs-storage.port';
import { InvalidMediaFileError } from '../../domain/media.errors';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_OTHER_SIZE = 10 * 1024 * 1024;

/** Upload un fichier média (image, PDF de justificatif…) sur IPFS. */
@Injectable()
export class UploadMediaUseCase {
  constructor(private readonly ipfsStorage: IpfsStorage) {}

  async execute(file: {
    buffer: Buffer;
    filename: string;
    mimetype: string;
    size: number;
  }): Promise<UploadedMedia> {
    const maxSize = file.mimetype.startsWith('image/')
      ? MAX_IMAGE_SIZE
      : MAX_OTHER_SIZE;
    if (file.size > maxSize) {
      throw new InvalidMediaFileError(
        `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
      );
    }

    return this.ipfsStorage.upload({
      buffer: file.buffer,
      filename: file.filename,
      mimetype: file.mimetype,
    });
  }
}
