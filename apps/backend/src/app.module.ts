import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ModuleManagementModule } from './modules/module-management/module-management.module';

// Guards
import { AuthGuard } from '@infrastructure/http/guards/auth.guard';
import { RBACGuard } from '@infrastructure/http/guards/rbac.guard';
import { ModuleGuard } from '@infrastructure/http/guards/module.guard';

// Middleware & Filters
import { TenantContextMiddleware } from '@infrastructure/http/middleware/tenant-context.middleware';
import { GlobalExceptionFilter } from '@infrastructure/http/filters/global-exception.filter';

// Domain services
import { PermissionEvaluator } from '@domain/services';
import { TOKENS } from '@infrastructure/di/tokens';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_DATABASE', 'axion_core'),
        entities: [__dirname + '/infrastructure/database/entities/*.entity{.ts,.js}'],
        migrations: [__dirname + '/infrastructure/database/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: config.get<string>('DB_LOGGING', 'false') === 'true',
      }),
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    TenantsModule,
    ModuleManagementModule,
  ],
  providers: [
    // Domain services
    { provide: TOKENS.PERMISSION_EVALUATOR, useValue: new PermissionEvaluator() },

    // Global guards (order matters: Auth → RBAC → Module)
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RBACGuard },
    { provide: APP_GUARD, useClass: ModuleGuard },

    // Global exception filter
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
