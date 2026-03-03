import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Token de refresco obtenido en el login' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
