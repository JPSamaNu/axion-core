import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleDto {
  @ApiProperty({ description: 'UUID del usuario al que se asigna el rol', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'UUID del rol a asignar', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  roleId!: string;
}
