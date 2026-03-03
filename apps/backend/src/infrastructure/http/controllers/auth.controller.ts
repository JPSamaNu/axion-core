import { Controller, Post, Get, Body, Req, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { LoginUseCase } from '@application/use-cases';
import { RefreshTokenUseCase } from '@application/use-cases';
import { LogoutUseCase } from '@application/use-cases';
import { LoginDto, RefreshTokenDto, AuthTokensDto } from '@application/dto';
import { Public } from '../decorators/public.decorator';
import { TOKENS } from '../../di/tokens';
import { IRoleRepository, IModuleRepository } from '@domain/repositories';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(TOKENS.LOGIN_USE_CASE)
    private readonly loginUseCase: LoginUseCase,
    @Inject(TOKENS.REFRESH_TOKEN_USE_CASE)
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    @Inject(TOKENS.LOGOUT_USE_CASE)
    private readonly logoutUseCase: LogoutUseCase,
    @Inject(TOKENS.ROLE_REPOSITORY)
    private readonly roleRepo: IRoleRepository,
    @Inject(TOKENS.MODULE_REPOSITORY)
    private readonly moduleRepo: IModuleRepository,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión', description: 'Autentica al usuario y devuelve tokens JWT' })
  @ApiResponse({ status: 200, description: 'Login exitoso', type: AuthTokensDto })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: LoginDto, @Req() req: any): Promise<AuthTokensDto> {
    const tenantId = req.tenantId;
    return this.loginUseCase.execute(dto, tenantId);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar token', description: 'Genera nuevos tokens usando el refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens renovados', type: AuthTokensDto })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensDto> {
    return this.refreshTokenUseCase.execute(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cerrar sesión', description: 'Invalida los refresh tokens del usuario' })
  @ApiResponse({ status: 204, description: 'Sesión cerrada correctamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async logout(@Req() req: any): Promise<void> {
    await this.logoutUseCase.execute(req.user.userId);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiSecurity('x-tenant-id')
  @ApiOperation({ summary: 'Obtener perfil actual', description: 'Devuelve permisos y módulos activos del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario con permisos y módulos',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', format: 'uuid' },
        tenantId: { type: 'string', format: 'uuid' },
        permissions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string', example: 'users' },
              action: { type: 'string', enum: ['create', 'read', 'update', 'delete'] },
              scope: { type: 'string', enum: ['global', 'tenant', 'own'] },
            },
          },
        },
        activeModules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string', example: 'users' },
              description: { type: 'string' },
              isCore: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async me(@Req() req: any) {
    const roleIds: string[] = req.user.roles ?? [];
    const tenantId: string = req.user.tenantId;

    const [permissions, activeModules] = await Promise.all([
      this.roleRepo.getPermissionsForRoles(roleIds),
      this.moduleRepo.findActiveByTenant(tenantId),
    ]);

    return {
      userId: req.user.userId,
      tenantId,
      permissions: permissions.map((p) => ({
        resource: p.resource,
        action: p.action,
        scope: p.scope,
      })),
      activeModules: activeModules.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        isCore: m.isCore,
      })),
    };
  }
}
