export class RolePermission {
  id: string;
  roleId: string;
  permissionId: string;

  constructor(props: { id: string; roleId: string; permissionId: string }) {
    this.id = props.id;
    this.roleId = props.roleId;
    this.permissionId = props.permissionId;
  }
}
