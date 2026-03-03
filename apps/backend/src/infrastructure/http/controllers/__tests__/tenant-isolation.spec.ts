import { TenantContextMiddleware } from '../../middleware/tenant-context.middleware';
import { ITenantRepository } from '@domain/repositories';
import { Tenant } from '@domain/entities';
import { TenantStatus } from '@axion/types';
import { ForbiddenException } from '@nestjs/common';

describe('Tenant Isolation in Endpoints', () => {
  let middleware: TenantContextMiddleware;
  let tenantRepo: jest.Mocked<ITenantRepository>;

  const activeTenant = new Tenant({
    id: 'tenant-active',
    name: 'Active Corp',
    slug: 'active-corp',
    status: TenantStatus.ACTIVE,
  });

  const inactiveTenant = new Tenant({
    id: 'tenant-inactive',
    name: 'Inactive Corp',
    slug: 'inactive-corp',
    status: TenantStatus.INACTIVE,
  });

  beforeEach(() => {
    tenantRepo = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
    } as any;

    middleware = new TenantContextMiddleware(tenantRepo);
  });

  it('should inject tenantId for active tenant', async () => {
    tenantRepo.findById.mockResolvedValue(activeTenant);
    const req: any = { headers: { 'x-tenant-id': 'tenant-active' } };
    const res: any = {};
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(req.tenantId).toBe('tenant-active');
    expect(next).toHaveBeenCalled();
  });

  it('should reject request for inactive tenant', async () => {
    tenantRepo.findById.mockResolvedValue(inactiveTenant);
    const req: any = { headers: { 'x-tenant-id': 'tenant-inactive' } };
    const res: any = {};
    const next = jest.fn();

    await expect(middleware.use(req, res, next)).rejects.toThrow(ForbiddenException);
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject request for non-existent tenant', async () => {
    tenantRepo.findById.mockResolvedValue(null);
    const req: any = { headers: { 'x-tenant-id': 'tenant-unknown' } };
    const res: any = {};
    const next = jest.fn();

    await expect(middleware.use(req, res, next)).rejects.toThrow(ForbiddenException);
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow request without tenant header (public endpoints)', async () => {
    const req: any = { headers: {} };
    const res: any = {};
    const next = jest.fn();

    await middleware.use(req, res, next);

    expect(req.tenantId).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('should reject with specific message for inactive tenant', async () => {
    tenantRepo.findById.mockResolvedValue(inactiveTenant);
    const req: any = { headers: { 'x-tenant-id': 'tenant-inactive' } };
    const res: any = {};
    const next = jest.fn();

    try {
      await middleware.use(req, res, next);
      fail('Should have thrown');
    } catch (e: any) {
      expect(e.message).toBe('Tenant inactivo');
    }
  });

  it('should reject with specific message for non-existent tenant', async () => {
    tenantRepo.findById.mockResolvedValue(null);
    const req: any = { headers: { 'x-tenant-id': 'tenant-unknown' } };
    const res: any = {};
    const next = jest.fn();

    try {
      await middleware.use(req, res, next);
      fail('Should have thrown');
    } catch (e: any) {
      expect(e.message).toBe('Tenant no encontrado');
    }
  });
});
