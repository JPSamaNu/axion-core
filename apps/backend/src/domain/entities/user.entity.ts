import { UserStatus } from '@axion/types';
import { TenantAwareEntity } from './base.entity';
import { UserRole } from './user-role.entity';

export class User extends TenantAwareEntity {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  roles: UserRole[];

  constructor(props: {
    id: string;
    tenantId: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    status?: UserStatus;
    roles?: UserRole[];
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    createdBy: string;
    updatedBy: string;
  }) {
    super(props);
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.status = props.status ?? UserStatus.ACTIVE;
    this.roles = props.roles ?? [];
  }
}
