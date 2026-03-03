import { Controller, Post, Get, Put, Body, Param, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity, ApiParam, ApiBody } from '@nestjs/swagger';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { Action } from '@axion/types';
import { TOKENS } from '../../di/tokens';
import { ITenantRepository } from '@domain/repositories';
import { Tenant } from '@domain/entities';
import { EntityNotFoundError } from '@domain/errors';
import { randomUUID } from 'crypto';

@ApiTags('Tenants')
@ApiBearerAuth('access-token')
@ApiSecurity('x-tenant-id')
@Controller('tenants')
export class TenantsController {
  constructor(
    @Inject(TOKENS.TENANT_REPOSITORY)
    private readonly tenantRepo: ITenantRepository,
  ) {}

  @Get()
  @RequirePermission('tenants', Action.READ)
  @ApiOperation({ summary: 'Listar tenants' })
  @ApiResponse({ status: 200, description: 'Lista de tenants' })
  async findAll() {
    return this.tenantRepo.findAll();
  }

  @Get(':id')
  @RequirePermission('tenants', Action.READ)
  @ApiOperation({ summary: 'Obtener tenant por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Datos del tenant' })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  async findOne(@Param('id') id: string) {
    return this.tenantRepo.findById(id);
  }

  @Post()
  @RequirePermission('tenants', Action.CREATE)
  @ApiOperation({ summary: 'Crear tenant' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'slug'],
      properties: {
        name: { type: 'string', example: 'Mi Empresa' },
        slug: { type: 'string', example: 'mi-empresa' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Tenant creado' })
  async create(@Body() body: { name: string; slug: string }) {
    const tenant = new Tenant({
      id: randomUUID(),
      name: body.name,
      slug: body.slug,
    });
    return this.tenantRepo.save(tenant);
  }

  @Put(':id')
  @RequirePermission('tenants', Action.UPDATE)
  @ApiOperation({ summary: 'Actualizar tenant' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Nombre actualizado' },
        status: { type: 'string', enum: ['active', 'inactive'] },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Tenant actualizado' })
  @ApiResponse({ status: 404, description: 'Tenant no encontrado' })
  async update(@Param('id') id: string, @Body() body: { name?: string; status?: string }) {
    const tenant = await this.tenantRepo.findById(id);
    if (!tenant) {
      throw new EntityNotFoundError('Tenant', id);
    }
    if (body.name !== undefined) tenant.name = body.name;
    if (body.status !== undefined) tenant.status = body.status as any;
    return this.tenantRepo.save(tenant);
  }
}
