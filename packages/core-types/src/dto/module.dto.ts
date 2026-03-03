export interface ToggleModuleRequest {
  moduleId: string;
  tenantId: string;
  isActive: boolean;
}

export interface ModuleDto {
  id: string;
  name: string;
  description: string;
  isCore: boolean;
}

export interface TenantModuleDto {
  moduleId: string;
  tenantId: string;
  isActive: boolean;
  activatedAt: string | null;
  deactivatedAt: string | null;
}
