export class TenantModule {
  id: string;
  tenantId: string;
  moduleId: string;
  isActive: boolean;
  activatedAt: Date | null;
  deactivatedAt: Date | null;

  constructor(props: {
    id: string;
    tenantId: string;
    moduleId: string;
    isActive: boolean;
    activatedAt?: Date | null;
    deactivatedAt?: Date | null;
  }) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.moduleId = props.moduleId;
    this.isActive = props.isActive;
    this.activatedAt = props.activatedAt ?? null;
    this.deactivatedAt = props.deactivatedAt ?? null;
  }
}
