import { RoleScope } from '@axion/types';
import { BaseEntity } from './base.entity';
import { RolePermission } from './role-permission.entity';

export class Role extends BaseEntity {
  tenantId: string | null;
  name: string;
  description: string;
  scope: RoleScope;
  permissions: RolePermission[];

  constructor(props: {
    id: string;
    tenantId?: string | null;
    name: string;
    description: string;
    scope: RoleScope;
    permissions?: RolePermission[];
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
  }) {
    super(props);
    this.tenantId = props.tenantId ?? null;
    this.name = props.name;
    this.description = props.description;
    this.scope = props.scope;
    this.permissions = props.permissions ?? [];
  }
}
