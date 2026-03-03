import { IsBoolean, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleModuleDto {
  @ApiProperty({ description: 'UUID del módulo', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  moduleId!: string;

  @ApiProperty({ description: 'Activar (true) o desactivar (false) el módulo' })
  @IsBoolean()
  isActive!: boolean;
}
