import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModulesController } from '@infrastructure/http/controllers/modules.controller';
import { ModuleOrmEntity, TenantModuleOrmEntity } from '@infrastructure/database/entities';
import { TypeOrmModuleRepository } from '@infrastructure/database/repositories';
import { SyncEventDispatcher } from '@infrastructure/events';
import { ToggleModuleUseCase } from '@application/use-cases';
import { TOKENS } from '@infrastructure/di/tokens';

@Module({
  imports: [TypeOrmModule.forFeature([ModuleOrmEntity, TenantModuleOrmEntity])],
  controllers: [ModulesController],
  providers: [
    { provide: TOKENS.MODULE_REPOSITORY, useClass: TypeOrmModuleRepository },
    { provide: TOKENS.EVENT_DISPATCHER, useClass: SyncEventDispatcher },
    {
      provide: TOKENS.TOGGLE_MODULE_USE_CASE,
      useFactory: (moduleRepo: any, dispatcher: any) =>
        new ToggleModuleUseCase(moduleRepo, dispatcher),
      inject: [TOKENS.MODULE_REPOSITORY, TOKENS.EVENT_DISPATCHER],
    },
  ],
  exports: [TOKENS.MODULE_REPOSITORY],
})
export class ModuleManagementModule {}
