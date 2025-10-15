import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass123!' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ example: 'NewPass123!' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}