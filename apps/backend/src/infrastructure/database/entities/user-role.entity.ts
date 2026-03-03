import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UserOrmEntity } from './user.entity';
import { RoleOrmEntity } from './role.entity';

@Entity('user_roles')
export class UserRoleOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ name: 'role_id' })
  roleId!: string;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ name: 'assigned_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt!: Date;

  @Column({ name: 'assigned_by' })
  assignedBy!: string;

  @ManyToOne(() => UserOrmEntity, (user) => user.userRoles)
  @JoinColumn({ name: 'user_id' })
  user!: UserOrmEntity;

  @ManyToOne(() => RoleOrmEntity, (role) => role.userRoles)
  @JoinColumn({ name: 'role_id' })
  role!: RoleOrmEntity;
}
