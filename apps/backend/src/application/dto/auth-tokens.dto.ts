import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '@axion/types';

export class AuthTokensDto {
  @ApiProperty({ description: 'JWT de acceso' })
  accessToken: string;

  @ApiProperty({ description: 'Token de refresco' })
  refreshToken: string;

  @ApiProperty({ description: 'Datos del usuario autenticado' })
  user: UserDto;

  constructor(props: { accessToken: string; refreshToken: string; user: UserDto }) {
    this.accessToken = props.accessToken;
    this.refreshToken = props.refreshToken;
    this.user = props.user;
  }
}
