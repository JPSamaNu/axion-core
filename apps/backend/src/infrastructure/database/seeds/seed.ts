import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'axion_core',
  logging: true,
});

async function seed() {
  await dataSource.initialize();
  const qr = dataSource.createQueryRunner();

  try {
    await qr.startTransaction();

    // 1. Tenant principal
    const [tenant] = await qr.query(`
      INSERT INTO tenants (name, slug, status, settings)
      VALUES ('Axion Corp', 'axion-corp', 'active', '{}')
      RETURNING id
    `);

    // 2. Módulos del sistema
    const modules: Record<string, string> = {};
    const moduleData = [
      { name: 'auth', description: 'Authentication & authorization', isCore: true },
      { name: 'users', description: 'User management', isCore: true },
      { name: 'roles', description: 'Role management', isCore: true },
      { name: 'tenants', description: 'Tenant management', isCore: true },
      { name: 'module-management', description: 'Module management', isCore: true },
    ];

    for (const mod of moduleData) {
      const [row] = await qr.query(
        `INSERT INTO modules (name, description, is_core) VALUES ($1, $2, $3) RETURNING id`,
        [mod.name, mod.description, mod.isCore],
      );
      modules[mod.name] = row.id;
    }

    // 3. Activar todos los módulos para el tenant
    for (const modName of Object.keys(modules)) {
      await qr.query(
        `INSERT INTO tenant_modules (tenant_id, module_id, is_active, activated_at)
         VALUES ($1, $2, true, now())`,
        [tenant.id, modules[modName]],
      );
    }

    // 4. Permisos CRUD para cada recurso
    const resources = ['users', 'roles', 'tenants', 'modules'];
    const actions = ['create', 'read', 'update', 'delete'];
    const permissionIds: string[] = [];

    for (const resource of resources) {
      const moduleId = modules[resource] || modules['module-management'] || null;
      for (const action of actions) {
        const [perm] = await qr.query(
          `INSERT INTO permissions (resource, action, scope, module_id, description)
           VALUES ($1, $2, 'global', $3, $4) RETURNING id`,
          [resource, action, moduleId, `${action} ${resource}`],
        );
        permissionIds.push(perm.id);
      }
    }

    // 5. Rol Super Admin (global)
    const [superAdminRole] = await qr.query(
      `INSERT INTO roles (tenant_id, name, description, scope)
       VALUES (NULL, 'Super Admin', 'Full system access', 'global')
       RETURNING id`,
    );

    // 6. Rol Tenant Admin
    const [tenantAdminRole] = await qr.query(
      `INSERT INTO roles (tenant_id, name, description, scope)
       VALUES ($1, 'Tenant Admin', 'Full tenant access', 'tenant')
       RETURNING id`,
      [tenant.id],
    );

    // 7. Asignar todos los permisos a ambos roles
    for (const permId of permissionIds) {
      await qr.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`,
        [superAdminRole.id, permId],
      );
      await qr.query(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)`,
        [tenantAdminRole.id, permId],
      );
    }

    // 8. Usuario admin
    const passwordHash = await bcrypt.hash('Axion26*', 10);
    const [adminUser] = await qr.query(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, status)
       VALUES ($1, $2, $3, 'Admin', 'Axion', 'active')
       RETURNING id`,
      [tenant.id, 'admin@axion.com', passwordHash],
    );

    // 9. Asignar ambos roles al admin
    await qr.query(
      `INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by)
       VALUES ($1, $2, $3, $1)`,
      [adminUser.id, superAdminRole.id, tenant.id],
    );
    await qr.query(
      `INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by)
       VALUES ($1, $2, $3, $1)`,
      [adminUser.id, tenantAdminRole.id, tenant.id],
    );

    await qr.commitTransaction();
    console.log('\n✅ Seed completed successfully!');
    console.log(`   Tenant: Axion Corp (${tenant.id})`);
    console.log(`   Admin:  admin@axion.com / Axion26*`);
    console.log(`   Roles:  Super Admin, Tenant Admin`);
    console.log(`   Modules: ${Object.keys(modules).join(', ')}`);
    console.log(`   Permissions: ${permissionIds.length} created\n`);
  } catch (error) {
    await qr.rollbackTransaction();
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await qr.release();
    await dataSource.destroy();
  }
}

seed();
