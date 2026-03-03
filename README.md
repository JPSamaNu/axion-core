# Axion Core

Plataforma SaaS multi-tenant empresarial con autenticación JWT, autorización RBAC, gestión de usuarios, roles, permisos, tenants y módulos activables por tenant.

## Stack Tecnológico

| Componente | Tecnología |
|------------|-----------|
| Backend | NestJS 10 · TypeORM · PostgreSQL 18 |
| Frontend | Next.js 14 (App Router) · React 18 · CSS Modules |
| Tipos compartidos | TypeScript 5.4 · @axion/types |
| Testing | Jest · fast-check (PBT) |
| Documentación API | Swagger (OpenAPI) |

## Estructura del Monorepo

```
axion-core/
├── apps/
│   ├── backend/          # API REST — NestJS (puerto 3000)
│   └── frontend/         # UI — Next.js (puerto 3001)
├── packages/
│   ├── core-types/       # @axion/types — DTOs, enums, contratos compartidos
│   ├── ts-config/        # Configuraciones base de TypeScript
│   └── eslint-config/    # Configuración compartida de ESLint
└── package.json          # Workspaces: apps/*, packages/*
```

## Arquitectura

### Backend — Hexagonal (Ports & Adapters) con DDD

```
apps/backend/src/
├── domain/           # Entidades, value objects, puertos (interfaces), servicios de dominio
├── application/      # Casos de uso, DTOs con validación
├── infrastructure/   # Adaptadores: TypeORM, JWT, bcrypt, controllers, guards, middleware
└── modules/          # Módulos NestJS (auth, users, roles, tenants, module-management)
```

### Frontend

```
apps/frontend/src/
├── app/              # App Router: login, dashboard (users, roles, tenants, modules)
├── components/       # UI components (Button, Modal, DataTable, Toast, etc.) + guards
└── lib/              # Contextos: auth, permissions, tenant, theme + HTTP client
```

## Requisitos Previos

- Node.js >= 18
- PostgreSQL 18
- npm (workspaces)

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/JPSamaNu/axion-core.git
cd axion-core

# Instalar dependencias
npm install

# Compilar tipos compartidos (necesario antes de backend/frontend)
npm run build:types
```

## Configuración

### Base de Datos

Crear la base de datos PostgreSQL:

```sql
CREATE DATABASE axion_core;
```

### Variables de Entorno

**Backend** — crear `apps/backend/.env`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=axion_core
DB_LOGGING=false
JWT_SECRET=tu-secreto-jwt-seguro
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION_DAYS=7
```

**Frontend** — crear `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Migraciones y Seed

```bash
cd apps/backend

# Ejecutar migraciones
npm run typeorm migration:run -- -d src/infrastructure/database/data-source.ts

# Poblar datos iniciales
npm run seed
```

El seed crea:
- 1 tenant: "Axion Corp"
- 5 módulos del sistema (auth, users, roles, tenants, module-management)
- 16 permisos CRUD (users, roles, tenants, modules)
- 2 roles: Super Admin (global) y Tenant Admin
- 1 usuario admin: `admin@axion.com` / `Axion26*`

## Ejecución

```bash
# Backend (puerto 3000)
cd apps/backend
npm run start:dev

# Frontend (puerto 3001) — en otra terminal
cd apps/frontend
npm run dev
```

## API

Swagger UI disponible en: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

### Endpoints Principales

| Recurso | Ruta Base | Descripción |
|---------|-----------|-------------|
| Auth | `/auth` | Login, refresh, logout, me |
| Users | `/users` | CRUD de usuarios (tenant-aware) |
| Roles | `/roles` | CRUD de roles + gestión de permisos |
| Tenants | `/tenants` | CRUD de tenants |
| Modules | `/modules` | Listado y activación/desactivación por tenant |

### Headers Requeridos

```
Authorization: Bearer <accessToken>
x-tenant-id: <uuid>
Content-Type: application/json
```

## Características

### Multi-Tenancy
- Aislamiento de datos por tenant vía middleware
- Módulos activables/desactivables por tenant
- Roles con scope global o por tenant

### Autenticación y Autorización
- JWT con access token (15min) y refresh token (7 días)
- Refresh token rotation con detección de reutilización
- RBAC con permisos granulares (resource:action)
- Guards: AuthGuard → RBACGuard → ModuleGuard

### Frontend
- Dark/Light mode con persistencia
- Sidebar colapsable con tooltips
- CRUD completo para todas las entidades
- Componentes UI propios (sin Tailwind)
- Renderizado condicional por permisos (`PermissionGate`) y módulos (`ModuleGate`)

## Testing

```bash
# Todos los workspaces
npm run test

# Backend
cd apps/backend && npm test

# Frontend
cd apps/frontend && npm test
```

## Scripts Principales

| Comando | Descripción |
|---------|-------------|
| `npm run build:types` | Compilar @axion/types |
| `npm run build:backend` | Compilar backend |
| `npm run build:frontend` | Compilar frontend |
| `npm run test` | Tests en todos los workspaces |

## Convenciones

- Idioma de la UI: Español
- Soft delete en todas las operaciones de eliminación
- Entidades tenant-aware filtran automáticamente por tenantId
- Errores de dominio extienden `DomainError` con `code` y `statusCode`
- DTOs con `class-validator` + `@ApiProperty` para Swagger
- CSS Modules con design tokens como CSS custom properties
