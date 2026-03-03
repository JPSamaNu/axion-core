import { RoleScope } from '../enums';

export interface CreateRoleRequest {
  name: string;
  description: string;
  scope: RoleScope;
}

export interface AssignRoleRequest {
  userId: string;
  roleId: string;
}

export interface AssignPermissionRequest {
  roleId: string;
  permissionId: string;
}
