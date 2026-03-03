import { User } from '../entities';
import { IBaseRepository } from './base.repository';

export interface IUserRepository extends IBaseRepository<User> {
  findByEmail(email: string, tenantId: string): Promise<User | null>;
  findByEmailOnly(email: string): Promise<User | null>;
  findWithRoles(userId: string, tenantId: string): Promise<User | null>;
}
