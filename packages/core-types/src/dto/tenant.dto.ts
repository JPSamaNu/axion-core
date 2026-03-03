import { TenantStatus } from '../enums';

export interface TenantDto {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
}

export interface UpdateTenantRequest {
  name?: string;
  status?: TenantStatus;
  settings?: Record<string, unknown>;
}
