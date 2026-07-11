import { ApiProperty } from '@nestjs/swagger';
import { UploadedMedia } from '../application/ports/ipfs-storage.port';

export class MediaUploadResponse {
  @ApiProperty()
  ipfsHash: string;

  @ApiProperty()
  ipfsUrl: string;
}

export function toMediaUploadResponse(
  media: UploadedMedia,
): MediaUploadResponse {
  return { ipfsHash: media.cid, ipfsUrl: media.url };
}
