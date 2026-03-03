import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ITokenGenerator } from '@domain/services';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TOKENS } from '../../di/tokens';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(TOKENS.TOKEN_GENERATOR)
    private readonly tokenGenerator: ITokenGenerator,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const token = authHeader.substring(7);

    try {
      const payload = this.tokenGenerator.verifyAccessToken(token);
      request.user = {
        userId: payload.userId,
        tenantId: payload.tenantId,
        roles: payload.roles,
      };
      // Also set tenantId from JWT if not already set by middleware
      if (!request.tenantId) {
        request.tenantId = payload.tenantId;
      }
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
