import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ConfirmMediaRequest {
  @ApiProperty({ description: 'Hash IPFS retourné par Pinata' })
  @IsString()
  ipfsHash: string;

  @ApiProperty({ description: 'URL publique de l’image (gateway IPFS)' })
  @IsString()
  imageUrl: string;
}
