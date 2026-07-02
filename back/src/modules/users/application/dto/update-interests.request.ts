import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UpdateInterestsRequest {
  @ApiProperty({ type: [String], description: 'Remplace la liste complète' })
  @IsArray()
  @IsString({ each: true })
  interestIds: string[];
}
