import { Controller, Post, Get, Put, Delete, Body, Param, Req, Inject, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignRoleUseCase } from '@application/use-cases';
import { AssignRoleDto } from '@application/dto';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { Action, RoleScope } from '@axion/types';
import { TOKENS } from '../../di/tokens';
import { IRoleRepository } from '@domain/repositories';
import { Role } from '@domain/entities';
import { EntityNotFoundError } from '@domain/errors';
import { PermissionOrmEntity, RolePermissionOrmEntity } from '../../database/entities';
import { randomUUID } from 'crypto';

@Controller('roles')
export class RolesController {
  constructor(
    @Inject(TOKENS.ASSIGN_ROLE_USE_CASE)
    private readonly assignRoleUseCase: AssignRoleUseCase,
    @Inject(TOKENS.ROLE_REPOSITORY)
    private readonly roleRepo: IRoleRepository,
    @InjectRepository(PermissionOrmEntity)
    private readonly permissionRepo: Repository<PermissionOrmEntity>,
    @InjectRepository(RolePermissionOrmEntity)
    private readonly rolePermissionRepo: Repository<RolePermissionOrmEntity>,
  ) {}

  @Get()
  @RequirePermission('roles', Action.READ)
  async findAll(@Req() req: any) {
    return this.roleRepo.findAll(req.user.tenantId);
  }

  @Get('system/permissions')
  @RequirePermission('roles', Action.READ)
  async listAllPermissions() {
    return this.permissionRepo.find({ order: { resource: 'ASC', action: 'ASC' } });
  }

  @Get(':id')
  @RequirePermission('roles', Action.READ)
  async findOne(@Param('id') id: string) {
    return this.roleRepo.findWithPermissions(id);
  }

  @Post()
  @RequirePermission('roles', Action.CREATE)
  async create(@Body() body: { name: string; description: string; scope: RoleScope }, @Req() req: any) {
    const role = new Role({
      id: randomUUID(),
      tenantId: body.scope === RoleScope.GLOBAL ? null : req.user.tenantId,
      name: body.name,
      description: body.description,
      scope: body.scope,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.roleRepo.save(role);
  }

  @Put(':id')
  @RequirePermission('roles', Action.UPDATE)
  async update(@Param('id') id: string, @Body() body: { name?: string; description?: string }, @Req() req: any) {
    const role = await this.roleRepo.findById(id, req.user.tenantId);
    if (!role) throw new EntityNotFoundError('Role', id);
    if (body.name !== undefined) role.name = body.name;
    if (body.description !== undefined) role.description = body.description;
    role.updatedAt = new Date();
    return this.roleRepo.save(role);
  }

  @Delete(':id')
  @RequirePermission('roles', Action.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    await this.roleRepo.softDelete(id, req.user.tenantId, req.user.userId);
  }

  @Post(':id/assign')
  @RequirePermission('roles', Action.UPDATE)
  async assignRole(@Body() dto: AssignRoleDto, @Req() req: any): Promise<void> {
    await this.assignRoleUseCase.execute(dto, {
      tenantId: req.user.tenantId,
      userId: req.user.userId,
    });
  }

  @Get(':id/permissions')
  @RequirePermission('roles', Action.READ)
  async getRolePermissions(@Param('id') id: string) {
    const role = await this.roleRepo.findWithPermissions(id);
    if (!role) throw new EntityNotFoundError('Role', id);
    // Return the permission IDs assigned to this role
    return role.permissions.map((rp) => rp.permissionId);
  }

  @Post(':id/permissions')
  @RequirePermission('roles', Action.UPDATE)
  async setRolePermissions(@Param('id') id: string, @Body() body: { permissionIds: string[] }) {
    // Remove existing permissions
    await this.rolePermissionRepo.delete({ roleId: id });
    // Add new permissions
    if (body.permissionIds.length > 0) {
      const entries = body.permissionIds.map((pid) => ({
        id: randomUUID(),
        roleId: id,
        permissionId: pid,
      }));
      await this.rolePermissionRepo.save(entries);
    }
    return { success: true };
  }
}
