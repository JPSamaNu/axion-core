import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsController } from '@infrastructure/http/controllers/tenants.controller';
import { TenantOrmEntity } from '@infrastructure/database/entities';
import { TypeOrmTenantRepository } from '@infrastructure/database/repositories';
import { TOKENS } from '@infrastructure/di/tokens';

@Module({
  imports: [TypeOrmModule.forFeature([TenantOrmEntity])],
  controllers: [TenantsController],
  providers: [
    { provide: TOKENS.TENANT_REPOSITORY, useClass: TypeOrmTenantRepository },
  ],
  exports: [TOKENS.TENANT_REPOSITORY],
})
export class TenantsModule {}
