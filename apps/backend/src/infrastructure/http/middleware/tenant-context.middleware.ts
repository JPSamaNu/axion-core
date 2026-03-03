import { Injectable, NestMiddleware, ForbiddenException, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ITenantRepository } from '@domain/repositories';
import { TenantStatus } from '@axion/types';
import { TOKENS } from '../../di/tokens';

export const TENANT_HEADER = 'x-tenant-id';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    @Inject(TOKENS.TENANT_REPOSITORY)
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const tenantId = req.headers[TENANT_HEADER] as string | undefined;

    if (!tenantId) {
      // No tenant header — allow through (public endpoints, auth endpoints)
      next();
      return;
    }

    const tenant = await this.tenantRepository.findById(tenantId);

    if (!tenant) {
      throw new ForbiddenException('Tenant no encontrado');
    }

    if (tenant.status !== TenantStatus.ACTIVE) {
      throw new ForbiddenException('Tenant inactivo');
    }

    (req as any).tenantId = tenantId;
    next();
  }
}
