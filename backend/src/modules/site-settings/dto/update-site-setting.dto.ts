import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSiteSettingDto {
  @ApiProperty({ description: 'Setting value (JSON object)' })
  @IsNotEmpty()
  value: any;
}
