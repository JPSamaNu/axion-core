import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from '@infrastructure/http/controllers/users.controller';
import { UserOrmEntity, UserRoleOrmEntity, RoleOrmEntity, RolePermissionOrmEntity } from '@infrastructure/database/entities';
import { TypeOrmUserRepository, TypeOrmRoleRepository } from '@infrastructure/database/repositories';
import { SyncEventDispatcher } from '@infrastructure/events';
import { BcryptPasswordHasher } from '@infrastructure/auth';
import { CreateUserUseCase } from '@application/use-cases';
import { TOKENS } from '@infrastructure/di/tokens';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity, UserRoleOrmEntity, RoleOrmEntity, RolePermissionOrmEntity])],
  controllers: [UsersController],
  providers: [
    { provide: TOKENS.USER_REPOSITORY, useClass: TypeOrmUserRepository },
    { provide: TOKENS.ROLE_REPOSITORY, useClass: TypeOrmRoleRepository },
    { provide: TOKENS.PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKENS.EVENT_DISPATCHER, useClass: SyncEventDispatcher },
    {
      provide: TOKENS.CREATE_USER_USE_CASE,
      useFactory: (userRepo: any, hasher: any, dispatcher: any) =>
        new CreateUserUseCase(userRepo, hasher, dispatcher),
      inject: [TOKENS.USER_REPOSITORY, TOKENS.PASSWORD_HASHER, TOKENS.EVENT_DISPATCHER],
    },
  ],
})
export class UsersModule {}
