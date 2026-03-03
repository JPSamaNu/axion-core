import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesController } from '@infrastructure/http/controllers/roles.controller';
import { RoleOrmEntity, RolePermissionOrmEntity, UserOrmEntity, UserRoleOrmEntity, PermissionOrmEntity } from '@infrastructure/database/entities';
import { TypeOrmRoleRepository, TypeOrmUserRepository } from '@infrastructure/database/repositories';
import { SyncEventDispatcher } from '@infrastructure/events';
import { AssignRoleUseCase } from '@application/use-cases';
import { TOKENS } from '@infrastructure/di/tokens';

@Module({
  imports: [TypeOrmModule.forFeature([RoleOrmEntity, RolePermissionOrmEntity, UserOrmEntity, UserRoleOrmEntity, PermissionOrmEntity])],
  controllers: [RolesController],
  providers: [
    { provide: TOKENS.ROLE_REPOSITORY, useClass: TypeOrmRoleRepository },
    { provide: TOKENS.USER_REPOSITORY, useClass: TypeOrmUserRepository },
    { provide: TOKENS.EVENT_DISPATCHER, useClass: SyncEventDispatcher },
    {
      provide: TOKENS.ASSIGN_ROLE_USE_CASE,
      useFactory: (userRepo: any, roleRepo: any, dispatcher: any) =>
        new AssignRoleUseCase(userRepo, roleRepo, dispatcher),
      inject: [TOKENS.USER_REPOSITORY, TOKENS.ROLE_REPOSITORY, TOKENS.EVENT_DISPATCHER],
    },
  ],
  exports: [TOKENS.ROLE_REPOSITORY],
})
export class RolesModule {}
