import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Enums
    await queryRunner.query(`CREATE TYPE "tenant_status_enum" AS ENUM('active', 'inactive')`);
    await queryRunner.query(
      `CREATE TYPE "user_status_enum" AS ENUM('active', 'inactive', 'suspended')`,
    );
    await queryRunner.query(`CREATE TYPE "role_scope_enum" AS ENUM('global', 'tenant')`);
    await queryRunner.query(
      `CREATE TYPE "action_enum" AS ENUM('create', 'read', 'update', 'delete')`,
    );
    await queryRunner.query(
      `CREATE TYPE "permission_scope_enum" AS ENUM('global', 'tenant', 'own')`,
    );

    // Tenants
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "slug" varchar NOT NULL UNIQUE,
        "status" "tenant_status_enum" NOT NULL DEFAULT 'active',
        "settings" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id")
      )
    `);

    // Modules
    await queryRunner.query(`
      CREATE TABLE "modules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL UNIQUE,
        "description" varchar NOT NULL DEFAULT '',
        "is_core" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_modules" PRIMARY KEY ("id")
      )
    `);

    // Users
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "email" varchar NOT NULL,
        "password_hash" varchar NOT NULL,
        "first_name" varchar NOT NULL,
        "last_name" varchar NOT NULL,
        "status" "user_status_enum" NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "created_by" uuid,
        "updated_by" uuid,
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_email_tenant" ON "users" ("email", "tenant_id") WHERE "deleted_at" IS NULL`,
    );

    // Permissions
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "resource" varchar NOT NULL,
        "action" "action_enum" NOT NULL,
        "scope" "permission_scope_enum" NOT NULL,
        "module_id" uuid,
        "description" varchar NOT NULL DEFAULT '',
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_permissions_module" FOREIGN KEY ("module_id") REFERENCES "modules"("id")
      )
    `);

    // Roles
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid,
        "name" varchar NOT NULL,
        "description" varchar NOT NULL DEFAULT '',
        "scope" "role_scope_enum" NOT NULL DEFAULT 'tenant',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )
    `);

    // User Roles
    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "assigned_at" TIMESTAMP NOT NULL DEFAULT now(),
        "assigned_by" uuid NOT NULL,
        CONSTRAINT "PK_user_roles" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_roles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id"),
        CONSTRAINT "FK_user_roles_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id")
      )
    `);

    // Role Permissions
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_role_permissions_role" FOREIGN KEY ("role_id") REFERENCES "roles"("id"),
        CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id")
      )
    `);

    // Tenant Modules
    await queryRunner.query(`
      CREATE TABLE "tenant_modules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "module_id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT false,
        "activated_at" TIMESTAMP,
        "deactivated_at" TIMESTAMP,
        CONSTRAINT "PK_tenant_modules" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tenant_modules_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id"),
        CONSTRAINT "FK_tenant_modules_module" FOREIGN KEY ("module_id") REFERENCES "modules"("id"),
        CONSTRAINT "UQ_tenant_modules" UNIQUE ("tenant_id", "module_id")
      )
    `);

    // Refresh Tokens
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" varchar NOT NULL,
        "family_id" varchar NOT NULL,
        "is_revoked" boolean NOT NULL DEFAULT false,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_token_hash" ON "refresh_tokens" ("token_hash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_family_id" ON "refresh_tokens" ("family_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "tenant_modules"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP INDEX "UQ_users_email_tenant"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "modules"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
    await queryRunner.query(`DROP TYPE "permission_scope_enum"`);
    await queryRunner.query(`DROP TYPE "action_enum"`);
    await queryRunner.query(`DROP TYPE "role_scope_enum"`);
    await queryRunner.query(`DROP TYPE "user_status_enum"`);
    await queryRunner.query(`DROP TYPE "tenant_status_enum"`);
  }
}
