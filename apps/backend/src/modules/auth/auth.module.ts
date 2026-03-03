import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from '@infrastructure/http/controllers/auth.controller';
import { RefreshTokenOrmEntity, RoleOrmEntity, RolePermissionOrmEntity, ModuleOrmEntity, TenantModuleOrmEntity } from '@infrastructure/database/entities';
import { UserOrmEntity } from '@infrastructure/database/entities';
import { UserRoleOrmEntity } from '@infrastructure/database/entities';
import { TypeOrmUserRepository, TypeOrmRoleRepository, TypeOrmModuleRepository } from '@infrastructure/database/repositories';
import { TypeOrmRefreshTokenRepository } from '@infrastructure/database/repositories';
import { BcryptPasswordHasher } from '@infrastructure/auth';
import { JwtTokenGenerator } from '@infrastructure/auth';
import { SyncEventDispatcher } from '@infrastructure/events';
import { LoginUseCase, RefreshTokenUseCase, LogoutUseCase } from '@application/use-cases';
import { TOKENS } from '@infrastructure/di/tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity, UserRoleOrmEntity, RefreshTokenOrmEntity, RoleOrmEntity, RolePermissionOrmEntity, ModuleOrmEntity, TenantModuleOrmEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'default-secret-change-me'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: TOKENS.USER_REPOSITORY, useClass: TypeOrmUserRepository },
    { provide: TOKENS.REFRESH_TOKEN_REPOSITORY, useClass: TypeOrmRefreshTokenRepository },
    { provide: TOKENS.ROLE_REPOSITORY, useClass: TypeOrmRoleRepository },
    { provide: TOKENS.MODULE_REPOSITORY, useClass: TypeOrmModuleRepository },
    { provide: TOKENS.PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKENS.TOKEN_GENERATOR, useClass: JwtTokenGenerator },
    { provide: TOKENS.EVENT_DISPATCHER, useClass: SyncEventDispatcher },
    {
      provide: TOKENS.LOGIN_USE_CASE,
      useFactory: (userRepo: any, tokenRepo: any, hasher: any, tokenGen: any, dispatcher: any) =>
        new LoginUseCase(userRepo, tokenRepo, hasher, tokenGen, dispatcher),
      inject: [
        TOKENS.USER_REPOSITORY,
        TOKENS.REFRESH_TOKEN_REPOSITORY,
        TOKENS.PASSWORD_HASHER,
        TOKENS.TOKEN_GENERATOR,
        TOKENS.EVENT_DISPATCHER,
      ],
    },
    {
      provide: TOKENS.REFRESH_TOKEN_USE_CASE,
      useFactory: (tokenRepo: any, tokenGen: any, userRepo: any) =>
        new RefreshTokenUseCase(tokenRepo, tokenGen, userRepo),
      inject: [TOKENS.REFRESH_TOKEN_REPOSITORY, TOKENS.TOKEN_GENERATOR, TOKENS.USER_REPOSITORY],
    },
    {
      provide: TOKENS.LOGOUT_USE_CASE,
      useFactory: (tokenRepo: any) => new LogoutUseCase(tokenRepo),
      inject: [TOKENS.REFRESH_TOKEN_REPOSITORY],
    },
  ],
  exports: [TOKENS.TOKEN_GENERATOR, TOKENS.USER_REPOSITORY, TOKENS.PASSWORD_HASHER, TOKENS.EVENT_DISPATCHER],
})
export class AuthModule {}
