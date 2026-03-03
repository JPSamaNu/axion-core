export class UserRole {
  id: string;
  userId: string;
  roleId: string;
  tenantId: string;
  assignedAt: Date;
  assignedBy: string;

  constructor(props: {
    id: string;
    userId: string;
    roleId: string;
    tenantId: string;
    assignedAt?: Date;
    assignedBy: string;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.roleId = props.roleId;
    this.tenantId = props.tenantId;
    this.assignedAt = props.assignedAt ?? new Date();
    this.assignedBy = props.assignedBy;
  }
}
