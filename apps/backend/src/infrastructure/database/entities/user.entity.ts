import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { UserStatus } from '@axion/types';
import { TenantOrmEntity } from './tenant.entity';
import { UserRoleOrmEntity } from './user-role.entity';
import { RefreshTokenOrmEntity } from './refresh-token.entity';

@Entity('users')
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column()
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ name: 'first_name' })
  firstName!: string;

  @Column({ name: 'last_name' })
  lastName!: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date | null;

  @Column({ name: 'created_by', nullable: true })
  createdBy!: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy!: string;

  @ManyToOne(() => TenantOrmEntity, (tenant) => tenant.users)
  @JoinColumn({ name: 'tenant_id' })
  tenant!: TenantOrmEntity;

  @OneToMany(() => UserRoleOrmEntity, (ur) => ur.user)
  userRoles!: UserRoleOrmEntity[];

  @OneToMany(() => RefreshTokenOrmEntity, (rt) => rt.user)
  refreshTokens!: RefreshTokenOrmEntity[];
}
