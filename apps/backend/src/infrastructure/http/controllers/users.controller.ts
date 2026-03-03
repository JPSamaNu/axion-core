import { Controller, Post, Get, Put, Delete, Body, Param, Req, Inject, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateUserUseCase } from '@application/use-cases';
import { CreateUserDto, UserResponseDto } from '@application/dto';
import { RequirePermission } from '../decorators/require-permission.decorator';
import { Action } from '@axion/types';
import { TOKENS } from '../../di/tokens';
import { IUserRepository } from '@domain/repositories';
import { IRoleRepository } from '@domain/repositories';
import { EntityNotFoundError } from '@domain/errors';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@ApiSecurity('x-tenant-id')
@Controller('users')
export class UsersController {
  constructor(
    @Inject(TOKENS.CREATE_USER_USE_CASE)
    private readonly createUserUseCase: CreateUserUseCase,
    @Inject(TOKENS.USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    @Inject(TOKENS.ROLE_REPOSITORY)
    private readonly roleRepo: IRoleRepository,
  ) {}

  @Post()
  @RequirePermission('users', Action.CREATE)
  @ApiOperation({ summary: 'Crear usuario', description: 'Crea un nuevo usuario en el tenant actual' })
  @ApiResponse({ status: 201, description: 'Usuario creado', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async create(@Body() dto: CreateUserDto, @Req() req: any): Promise<UserResponseDto> {
    return this.createUserUseCase.execute(dto, {
      tenantId: req.user.tenantId,
      userId: req.user.userId,
    });
  }

  @Get()
  @RequirePermission('users', Action.READ)
  @ApiOperation({ summary: 'Listar usuarios', description: 'Obtiene todos los usuarios del tenant actual con sus roles' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Permisos insuficientes' })
  async findAll(@Req() req: any) {
    const users = await this.userRepo.findAll(req.user.tenantId);
    const allRoleIds = [...new Set(users.flatMap((u) => u.roles.map((r) => r.roleId)))];
    const roleMap = new Map<string, any>();
    for (const roleId of allRoleIds) {
      const role = await this.roleRepo.findWithPermissions(roleId);
      if (role) roleMap.set(roleId, role);
    }
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      tenantId: u.tenantId,
      status: u.status,
      roles: u.roles
        .map((ur) => {
          const role = roleMap.get(ur.roleId);
          return role ? { id: role.id, name: role.name, scope: role.scope, permissions: [] } : null;
        })
        .filter(Boolean),
    }));
  }

  @Get(':id')
  @RequirePermission('users', Action.READ)
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', description: 'UUID del usuario', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Datos del usuario' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.userRepo.findById(id, req.user.tenantId);
  }

  @Put(':id')
  @RequirePermission('users', Action.UPDATE)
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiParam({ name: 'id', description: 'UUID del usuario', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', example: 'Juan' },
        lastName: { type: 'string', example: 'Pérez' },
        email: { type: 'string', example: 'juan@empresa.com' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async update(@Param('id') id: string, @Body() body: { firstName?: string; lastName?: string; email?: string }, @Req() req: any) {
    const user = await this.userRepo.findById(id, req.user.tenantId);
    if (!user) {
      throw new EntityNotFoundError('User', id);
    }
    if (body.firstName !== undefined) user.firstName = body.firstName;
    if (body.lastName !== undefined) user.lastName = body.lastName;
    if (body.email !== undefined) user.email = body.email;
    user.updatedBy = req.user.userId;
    return this.userRepo.save(user);
  }

  @Delete(':id')
  @RequirePermission('users', Action.DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar usuario (soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID del usuario', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Usuario eliminado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    await this.userRepo.softDelete(id, req.user.tenantId, req.user.userId);
  }
}
