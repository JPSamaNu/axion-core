import { Role, Permission } from '../entities';
import { IBaseRepository } from './base.repository';

export interface IRoleRepository extends IBaseRepository<Role> {
  findByName(name: string, tenantId?: string): Promise<Role | null>;
  findWithPermissions(roleId: string): Promise<Role | null>;
  getPermissionsForRoles(roleIds: string[]): Promise<Permission[]>;
}
