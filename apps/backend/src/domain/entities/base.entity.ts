export abstract class BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  constructor(props: { id: string; createdAt?: Date; updatedAt?: Date; deletedAt?: Date | null }) {
    this.id = props.id;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.deletedAt = props.deletedAt ?? null;
  }
}

export abstract class AuditableEntity extends BaseEntity {
  createdBy: string;
  updatedBy: string;

  constructor(
    props: {
      id: string;
      createdAt?: Date;
      updatedAt?: Date;
      deletedAt?: Date | null;
      createdBy: string;
      updatedBy: string;
    },
  ) {
    super(props);
    this.createdBy = props.createdBy;
    this.updatedBy = props.updatedBy;
  }
}

export abstract class TenantAwareEntity extends AuditableEntity {
  tenantId: string;

  constructor(
    props: {
      id: string;
      tenantId: string;
      createdAt?: Date;
      updatedAt?: Date;
      deletedAt?: Date | null;
      createdBy: string;
      updatedBy: string;
    },
  ) {
    super(props);
    this.tenantId = props.tenantId;
  }
}
