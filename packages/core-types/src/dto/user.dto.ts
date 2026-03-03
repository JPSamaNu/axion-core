import { Action, PermissionScope } from '../enums';

export interface PermissionDto {
  resource: string;
  action: Action;
  scope: PermissionScope;
}

export interface RoleDto {
  id: string;
  name: string;
  scope: string;
  permissions: PermissionDto[];
}

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  status: string;
  roles: RoleDto[];
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  status?: string;
}
