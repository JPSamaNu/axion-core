import { TenantStatus } from '@axion/types';
import { BaseEntity } from './base.entity';

export class Tenant extends BaseEntity {
  name: string;
  slug: string;
  status: TenantStatus;
  settings: Record<string, unknown>;

  constructor(props: {
    id: string;
    name: string;
    slug: string;
    status?: TenantStatus;
    settings?: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
  }) {
    super(props);
    this.name = props.name;
    this.slug = props.slug;
    this.status = props.status ?? TenantStatus.ACTIVE;
    this.settings = props.settings ?? {};
  }
}
