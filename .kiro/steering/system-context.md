---
inclusion: auto
---

# Axion Core — Contexto del Sistema

## Descripción General

Axion Core es una plataforma SaaS multi-tenant empresarial construida como monorepo. Provee autenticación JWT, autorización RBAC (Role-Based Access Control), gestión de usuarios, roles, permisos, tenants y módulos activables por tenant. La arquitectura backend sigue el patrón hexagonal (Ports & Adapters) con Domain-Driven Design.

## Estructura del Monorepo

```
axion-core/
├── apps/
│   ├── backend/          # NestJS + TypeORM + PostgreSQL (puerto 3000)
│   └── frontend/         # Next.js 14 App Router (puerto 3001)
├── packages/
│   ├── core-types/       # @axion/types — DTOs, enums, contratos compartidos
│   └── ts-config/        # tsconfig base compartido
├── package.json          # Workspaces: apps/*, packages/*
└── .kiro/
    ├── steering/         # Archivos de contexto (este archivo)
    └── specs/            # Especificaciones de diseño
```

## Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| Backend | NestJS | ^10.3 |
| ORM | TypeORM | ^0.3.20 |
| Base de datos | PostgreSQL | 18 |
| Frontend | Next.js (App Router) | ^14.2 |
| UI | React + CSS Modules | ^18.3 |
| Tipos compartidos | TypeScript | ^5.4 |
| Testing | Jest + fast-check | ^29.7 / ^3.15 |
| Documentación API | Swagger (@nestjs/swagger) | ^7.4 |

## Base de Datos

- Host: localhost, Puerto: 5432
- Usuario: postgres, Contraseña: postgres
- Base de datos: axion_core
- Las migraciones están en `apps/backend/src/infrastructure/database/migrations/`
- Seed: `npm run seed` (desde apps/backend)
- Usuario admin del seed: admin@axion.com / Axion26*

## Arquitectura Backend (Hexagonal)

### Capas

```
src/
├── domain/                    # Capa de dominio (pura, sin dependencias de framework)
│   ├── entities/              # Entidades: User, Role, Permission, Tenant, Module, etc.
│   ├── value-objects/         # VOs: TenantId, Email, PermissionSpec
│   ├── repositories/          # Interfaces (puertos): IUserRepository, IRoleRepository, etc.
│   ├── services/              # Servicios de dominio: PermissionEvaluator
│   ├── events/                # Domain Events: UserCreated, RoleAssigned, ModuleToggled
│   └── errors/                # Errores de dominio: EntityNotFoundError, InvalidCredentialsError
├── application/               # Capa de aplicación
│   ├── use-cases/             # Casos de uso: LoginUseCase, CreateUserUseCase, etc.
│   ├── dto/                   # DTOs con validación (class-validator + @ApiProperty)
│   └── types/                 # TenantContext type
├── infrastructure/            # Capa de infraestructura (adaptadores)
│   ├── database/
│   │   ├── entities/          # Entidades TypeORM (decoradas con @Entity, @Column, etc.)
│   │   ├── repositories/     # Implementaciones TypeORM de los puertos
│   │   ├── migrations/       # Migraciones SQL
│   │   └── seeds/            # Script de seed
│   ├── auth/                  # BcryptPasswordHasher, JwtTokenGenerator
│   ├── http/
│   │   ├── controllers/      # Controllers NestJS (Auth, Users, Roles, Modules, Tenants)
│   │   ├── guards/           # AuthGuard (JWT), RBACGuard, ModuleGuard
│   │   ├── middleware/       # TenantContextMiddleware
│   │   ├── decorators/       # @RequirePermission, @Public
│   │   └── filters/          # GlobalExceptionFilter
│   ├── events/               # SyncEventDispatcher
│   └── di/                   # tokens.ts (constantes de inyección)
└── modules/                   # Módulos NestJS (auth, users, roles, tenants, module-management)
```

### Path Aliases del Backend

Configurados en `apps/backend/tsconfig.json`, requieren `-r tsconfig-paths/register` para ts-node:

- `@domain/*` → `src/domain/*`
- `@application/*` → `src/application/*`
- `@infrastructure/*` → `src/infrastructure/*`
- `@axion/types` → `../../packages/core-types/dist`

### Inyección de Dependencias

Los tokens de inyección están en `apps/backend/src/infrastructure/di/tokens.ts`:

```
TOKENS.USER_REPOSITORY, TOKENS.ROLE_REPOSITORY, TOKENS.TENANT_REPOSITORY,
TOKENS.REFRESH_TOKEN_REPOSITORY, TOKENS.MODULE_REPOSITORY,
TOKENS.PASSWORD_HASHER, TOKENS.TOKEN_GENERATOR, TOKENS.PERMISSION_EVALUATOR,
TOKENS.EVENT_DISPATCHER,
TOKENS.LOGIN_USE_CASE, TOKENS.REFRESH_TOKEN_USE_CASE, TOKENS.LOGOUT_USE_CASE,
TOKENS.CREATE_USER_USE_CASE, TOKENS.ASSIGN_ROLE_USE_CASE, TOKENS.TOGGLE_MODULE_USE_CASE
```

### Flujo de una Petición HTTP

1. **TenantContextMiddleware** — extrae `x-tenant-id` del header, valida que el tenant exista y esté activo
2. **AuthGuard** — valida JWT Bearer token, extrae userId/tenantId/roles y los inyecta en `req.user`
3. **RBACGuard** — lee `@RequirePermission(resource, action)`, carga permisos del usuario vía roleRepo, evalúa con PermissionEvaluator (filtra permisos de módulos inactivos)
4. **ModuleGuard** — si el endpoint tiene `@RequireModule`, verifica que el módulo esté activo para el tenant
5. **Controller** — ejecuta el caso de uso
6. **GlobalExceptionFilter** — captura DomainError y HttpException, devuelve JSON estandarizado

### Formato de Respuesta de Error

```json
{ "statusCode": 404, "code": "ENTITY_NOT_FOUND", "message": "...", "timestamp": "..." }
```

## API Endpoints

Swagger UI disponible en: `http://localhost:3000/api/docs`

### Auth (`/auth`) — ApiTags: Auth

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/login` | Público | Login, devuelve accessToken + refreshToken + user |
| POST | `/auth/refresh` | Público | Renueva tokens con refreshToken |
| POST | `/auth/logout` | Bearer | Revoca refresh tokens del usuario |
| GET | `/auth/me` | Bearer | Devuelve permisos y módulos activos del usuario |

### Users (`/users`) — ApiTags: Users

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | `/users` | users:create | Crear usuario en el tenant actual |
| GET | `/users` | users:read | Listar usuarios con roles enriquecidos |
| GET | `/users/:id` | users:read | Obtener usuario por ID |
| PUT | `/users/:id` | users:update | Actualizar nombre/apellido/email |
| DELETE | `/users/:id` | users:delete | Soft delete |

### Roles (`/roles`) — ApiTags: Roles

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/roles` | roles:read | Listar roles (tenant + globales) |
| GET | `/roles/system/permissions` | roles:read | Listar todos los permisos del sistema |
| GET | `/roles/:id` | roles:read | Obtener rol con permisos |
| POST | `/roles` | roles:create | Crear rol (scope global o tenant) |
| PUT | `/roles/:id` | roles:update | Actualizar nombre/descripción |
| DELETE | `/roles/:id` | roles:delete | Soft delete |
| POST | `/roles/:id/assign` | roles:update | Asignar rol a usuario |
| GET | `/roles/:id/permissions` | roles:read | IDs de permisos asignados al rol |
| POST | `/roles/:id/permissions` | roles:update | Establecer permisos del rol (reemplaza todos) |

### Modules (`/modules`) — ApiTags: Modules

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/modules` | modules:read | Listar todos los módulos |
| GET | `/modules/tenant/:tenantId` | modules:read | Módulos activos de un tenant |
| POST | `/modules/:id/toggle` | modules:update | Activar/desactivar módulo para el tenant |

### Tenants (`/tenants`) — ApiTags: Tenants

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/tenants` | tenants:read | Listar tenants |
| GET | `/tenants/:id` | tenants:read | Obtener tenant por ID |
| POST | `/tenants` | tenants:create | Crear tenant |
| PUT | `/tenants/:id` | tenants:update | Actualizar nombre/estado |

### Headers Requeridos

- `Authorization: Bearer <accessToken>` — en todos los endpoints protegidos
- `x-tenant-id: <uuid>` — contexto de tenant (se envía automáticamente desde el frontend)
- `Content-Type: application/json`

## Modelo de Datos

### Entidades Principales

- **Tenant** — Organización. Campos: id, name, slug, status (active/inactive), settings (jsonb)
- **User** — Usuario tenant-aware. Campos: id, tenantId, email, passwordHash, firstName, lastName, status (active/inactive/suspended), audit fields, softDelete
- **Role** — Rol global (tenantId=null) o de tenant. Campos: id, tenantId?, name, description, scope (global/tenant), softDelete
- **Permission** — Permiso del sistema. Campos: id, resource, action (CRUD), scope (global/tenant/own), moduleId?, description
- **UserRole** — Relación usuario-rol. Campos: id, userId, roleId, tenantId, assignedAt, assignedBy
- **RolePermission** — Relación rol-permiso. Campos: id, roleId, permissionId
- **Module** — Módulo del sistema. Campos: id, name, description, isCore
- **TenantModule** — Activación de módulo por tenant. Campos: id, tenantId, moduleId, isActive, activatedAt, deactivatedAt
- **RefreshToken** — Token de refresco. Campos: id, userId, tokenHash, familyId, isRevoked, expiresAt

### Módulos del Sistema (seed)

auth, users, roles, tenants, module-management — todos marcados como isCore=true

### Permisos del Sistema (seed)

CRUD (create/read/update/delete) para: users, roles, tenants, modules — 16 permisos totales, scope=global

### Roles del Seed

- **Super Admin** — global, todos los permisos
- **Tenant Admin** — tenant, todos los permisos

## Arquitectura Frontend

### Estructura

```
apps/frontend/src/
├── app/
│   ├── globals.css              # Design tokens CSS (dark/light mode)
│   ├── layout.tsx               # Root layout con Providers
│   ├── providers.tsx            # AuthProvider > TenantProvider > PermissionLoader > ToastProvider
│   ├── middleware.ts            # Protección de rutas (cookie axion_session)
│   ├── login/page.tsx           # Login con toasts de error
│   ├── access-denied/page.tsx
│   └── dashboard/
│       ├── layout.tsx           # Sidebar colapsable + header con tema + logout
│       ├── page.tsx             # Dashboard con stats
│       ├── users/page.tsx       # CRUD completo con modales
│       ├── roles/page.tsx       # CRUD + gestión de permisos + asignación
│       ├── tenants/page.tsx     # CRUD
│       └── modules/page.tsx     # Cards con toggle de activación
├── components/
│   ├── ui/                      # Button, Input, Select, Badge, Card, DataTable, Modal, Toast, Spinner, Skeleton
│   ├── guards/                  # PermissionGate, ModuleGate
│   └── TenantSelector.tsx
└── lib/
    ├── api/                     # HttpClient (auto-refresh 401), tokenStorage (localStorage)
    ├── auth/                    # AuthContext (login/logout/rehydrate), AuthGuard
    ├── permissions/             # PermissionContext (hasPermission, isModuleActive por ID o name)
    ├── tenant/                  # TenantContext (currentTenant, availableTenants)
    └── theme/                   # ThemeContext (dark/light toggle, data-theme attribute)
```

### Flujo de Autenticación Frontend

1. Usuario envía credenciales en `/login`
2. `AuthProvider.login()` llama `POST /auth/login`
3. Tokens y user se guardan en localStorage (`axion_access_token`, `axion_refresh_token`, `axion_user`)
4. Se setea cookie `axion_session=1` para el middleware de Next.js
5. Se guarda `axion_tenant_id` en localStorage
6. Redirección a `/dashboard` con `window.location.href`
7. `PermissionAndTenantLoader` (en providers.tsx) llama `GET /auth/me` para cargar permisos y módulos activos
8. También carga el tenant completo vía `GET /tenants/:id` y lo setea en TenantContext
9. El sidebar filtra nav items con `isModuleActive(SystemModule.XXX)`

### Manejo de Tokens

- Access token: JWT, 15min expiración, se envía como `Authorization: Bearer`
- Refresh token: UUID, 7 días, persistido en DB con familyId para detección de reutilización
- HttpClient intercepta 401 → intenta refresh automático → reintenta request original
- Si refresh falla → limpia storage → redirige a login

### Sistema de Permisos Frontend

- `PermissionProvider` recibe permissions[] y activeModules[] desde `/auth/me`
- `hasPermission(resource, action)` — verifica si el usuario tiene el permiso
- `isModuleActive(moduleId)` — verifica por ID o por nombre del módulo
- `<PermissionGate resource="users" action={Action.CREATE}>` — renderizado condicional

### Tema (Dark/Light Mode)

- ThemeProvider maneja el estado del tema
- Persiste en localStorage
- Aplica `data-theme="dark"` o `data-theme="light"` al HTML
- CSS variables en globals.css cambian según `[data-theme]`
- Toggle en el header del dashboard

### Sidebar Colapsable

- Estado persistido en localStorage (`axion_sidebar_collapsed`)
- Colapsado: muestra solo iconos con tooltips CSS en hover
- Responsive: en móvil se oculta y aparece como overlay con backdrop

## Paquete Compartido (@axion/types)

Ubicación: `packages/core-types/`

### Enums

- `Action` — create, read, update, delete
- `PermissionScope` — global, tenant, own
- `RoleScope` — global, tenant
- `SystemModule` — auth, users, roles, tenants, module-management
- `TenantStatus` — active, inactive
- `UserStatus` — active, inactive, suspended

### DTOs Compartidos

- `UserDto`, `CreateUserRequest`, `UpdateUserRequest`
- `RoleDto`, `CreateRoleRequest`, `AssignRoleRequest`, `AssignPermissionRequest`
- `PermissionDto`
- `ModuleDto`, `TenantModuleDto`, `ToggleModuleRequest`
- `TenantDto`, `CreateTenantRequest`, `UpdateTenantRequest`

### Contratos de API

- `LoginRequest`, `LoginResponse`
- `RefreshRequest`, `RefreshResponse`
- `LogoutRequest`

## Comandos Principales

### Raíz del monorepo

```bash
npm run build:types        # Compilar @axion/types (hacer primero)
npm run build:backend      # Compilar backend
npm run build:frontend     # Compilar frontend
npm run test               # Tests en todos los workspaces
```

### Backend (apps/backend/)

```bash
npm run start:dev          # Desarrollo con hot-reload (ts-node-dev + tsconfig-paths)
npm run build              # Compilar TypeScript
npm run start              # Producción (node dist/main.js)
npm run seed               # Ejecutar seed de datos iniciales
npm run test               # Tests con Jest
npm run typeorm            # CLI de TypeORM para migraciones
```

### Frontend (apps/frontend/)

```bash
npm run dev                # Desarrollo Next.js (puerto 3001)
npm run build              # Build de producción
npm run start              # Servidor de producción
npm run test               # Tests con Jest
```

## Variables de Entorno

### Backend (apps/backend/.env)

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=axion_core
DB_LOGGING=false
JWT_SECRET=<secreto-jwt>
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION_DAYS=7
```

### Frontend (apps/frontend/.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Convenciones del Proyecto

- Idioma de la UI: Español
- Soft delete en todas las operaciones de eliminación (nunca DELETE real)
- Todas las entidades tenant-aware filtran automáticamente por tenantId
- Los roles globales tienen tenantId=null
- Los módulos core no se pueden desactivar
- Los errores de dominio extienden DomainError con code y statusCode
- Los DTOs usan class-validator para validación + @ApiProperty para Swagger
- El frontend usa CSS Modules (no Tailwind) con design tokens como CSS custom properties
- Componentes UI propios: Button, Input, Select, Badge, Card, DataTable, Modal, Toast, Spinner, Skeleton
