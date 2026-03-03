import { ApiProperty } from '@nestjs/swagger';
import { UserDto, RoleDto } from '@axion/types';
import { User } from '@domain/entities';

export class UserResponseDto implements UserDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'admin@axion.com' })
  email: string;

  @ApiProperty({ example: 'Admin' })
  firstName: string;

  @ApiProperty({ example: 'Axion' })
  lastName: string;

  @ApiProperty({ format: 'uuid' })
  tenantId: string;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive', 'suspended'] })
  status: string;

  @ApiProperty({ type: [Object], description: 'Roles asignados al usuario' })
  roles: RoleDto[];

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.tenantId = user.tenantId;
    this.status = user.status;
    this.roles = [];
  }
}
