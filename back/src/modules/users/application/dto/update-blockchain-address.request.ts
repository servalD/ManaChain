import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class UpdateBlockchainAddressRequest {
  @ApiProperty({ example: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' })
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'blockchainAddress must be a valid EVM address (0x + 40 hex)',
  })
  blockchainAddress: string;
}
