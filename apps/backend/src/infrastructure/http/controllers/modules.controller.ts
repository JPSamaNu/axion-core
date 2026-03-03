import { Controller, Post, Get, Param, Body, Req, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity, ApiParam, ApiBody } from '@nestjs/swagger';
import { ToggleModuleUseCase } from '@application/use-cases';
import { ToggleModuleDto } from '@application/dto';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { Action } from '@axion/types';
import { TOKENS } from '../../di/tokens';
import { IModuleRepository } from '@domain/repositories';

@ApiTags('Modules')
@ApiBearerAuth('access-token')
@ApiSecurity('x-tenant-id')
@Controller('modules')
export class ModulesController {
  constructor(
    @Inject(TOKENS.TOGGLE_MODULE_USE_CASE)
    private readonly toggleModuleUseCase: ToggleModuleUseCase,
    @Inject(TOKENS.MODULE_REPOSITORY)
    private readonly moduleRepo: IModuleRepository,
  ) {}

  @Get()
  @RequirePermission('modules', Action.READ)
  @ApiOperation({ summary: 'Listar módulos', description: 'Obtiene todos los módulos del sistema' })
  @ApiResponse({ status: 200, description: 'Lista de módulos' })
  async findAll(@Req() req: any) {
    return this.moduleRepo.findAll(req.user.tenantId);
  }

  @Get('tenant/:tenantId')
  @RequirePermission('modules', Action.READ)
  @ApiOperation({ summary: 'Módulos activos por tenant', description: 'Obtiene los módulos activos para un tenant específico' })
  @ApiParam({ name: 'tenantId', description: 'UUID del tenant', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lista de módulos activos' })
  async findActiveByTenant(@Param('tenantId') tenantId: string) {
    return this.moduleRepo.findActiveByTenant(tenantId);
  }

  @Post(':id/toggle')
  @RequirePermission('modules', Action.UPDATE)
  @ApiOperation({ summary: 'Activar/desactivar módulo', description: 'Cambia el estado de un módulo para el tenant actual' })
  @ApiParam({ name: 'id', description: 'UUID del módulo', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['isActive'],
      properties: {
        isActive: { type: 'boolean', description: 'true para activar, false para desactivar' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Estado del módulo actualizado' })
  @ApiResponse({ status: 403, description: 'No se puede desactivar un módulo core' })
  async toggle(@Param('id') id: string, @Body() body: { isActive: boolean }, @Req() req: any): Promise<void> {
    const dto: ToggleModuleDto = Object.assign(new ToggleModuleDto(), {
      moduleId: id,
      isActive: body.isActive,
    });
    await this.toggleModuleUseCase.execute(dto, {
      tenantId: req.user.tenantId,
      userId: req.user.userId,
    });
  }
}
