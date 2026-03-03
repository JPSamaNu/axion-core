# Plan de Implementación: Diseño UI del Frontend

## Visión General

Implementación incremental del diseño UI del frontend SaaS multi-tenant. Se comienza con los design tokens y componentes base, luego el layout principal, y finalmente las páginas de cada sección. Cada paso construye sobre el anterior. Todos los tests (unitarios y de propiedades) se incluyen como sub-tareas.

## Tareas

- [x] 1. Configurar design tokens y estilos globales
  - [x] 1.1 Crear `apps/frontend/src/app/globals.css` con todos los design tokens (colores, espaciado, tipografía, radios, sombras, transiciones, layout) como CSS custom properties, incluyendo el bloque `@media (prefers-color-scheme: dark)` con los tokens del tema oscuro, y un CSS reset básico
    - _Requisitos: 1.1, 1.2, 1.3_

- [x] 2. Implementar componentes UI base
  - [x] 2.1 Crear componente `Button` (`apps/frontend/src/components/ui/Button.tsx` + `Button.module.css`) con variantes primary/secondary/danger/ghost, tamaños sm/md/lg, y soporte para estado loading con Spinner
    - _Requisitos: 10.3_
  - [x] 2.2 Crear componente `Spinner` (`apps/frontend/src/components/ui/Spinner.tsx` + `Spinner.module.css`) con animación CSS pura y tamaños sm/md/lg
    - _Requisitos: 10.3_
  - [x] 2.3 Crear componente `Input` (`apps/frontend/src/components/ui/Input.tsx` + `Input.module.css`) con label, error message, y atributos aria-invalid/aria-describedby
    - _Requisitos: 10.3_
  - [x] 2.4 Crear componente `Select` (`apps/frontend/src/components/ui/Select.tsx` + `Select.module.css`) con label, opciones, error message y estados disabled/error
    - _Requisitos: 10.3_
  - [x]* 2.5 Escribir test de propiedad para componentes de formulario (Input, Select, Button)
    - **Propiedad 12: Componentes de formulario renderizan estados de error y deshabilitado**
    - **Valida: Requisitos 10.3**
  - [x] 2.6 Crear componente `Badge` (`apps/frontend/src/components/ui/Badge.tsx` + `Badge.module.css`) con variantes success/error/warning/info/neutral y mapeo de estados
    - _Requisitos: 10.5_
  - [x]* 2.7 Escribir test de propiedad para Badge
    - **Propiedad 14: Badge renderiza variante correcta por estado**
    - **Valida: Requisitos 10.5**
  - [x] 2.8 Crear componente `Card` (`apps/frontend/src/components/ui/Card.tsx` + `Card.module.css`) con título opcional y contenido
    - _Requisitos: 10.6_
  - [x] 2.9 Crear componente `Skeleton` (`apps/frontend/src/components/ui/Skeleton.tsx` + `Skeleton.module.css`) con variantes text/rect/circle y animación de pulso
    - _Requisitos: 4.2_

- [x] 3. Implementar componentes UI complejos
  - [x] 3.1 Crear componente `DataTable` (`apps/frontend/src/components/ui/DataTable.tsx` + `DataTable.module.css`) que acepte columns, data, actions y emptyMessage, con scroll horizontal en móvil
    - _Requisitos: 10.1, 11.1_
  - [x]* 3.2 Escribir test de propiedad para DataTable
    - **Propiedad 4: DataTable renderiza filas y columnas correctamente**
    - **Valida: Requisitos 10.1, 5.1, 6.1, 7.1**
  - [x] 3.3 Crear componente `Modal` (`apps/frontend/src/components/ui/Modal.tsx` + `Modal.module.css`) con overlay, título, contenido, footer, cierre por overlay/Escape, y trap de foco
    - _Requisitos: 10.2_
  - [x]* 3.4 Escribir test de propiedad para Modal
    - **Propiedad 11: Modal se cierra con overlay y Escape**
    - **Valida: Requisitos 10.2**
  - [x] 3.5 Crear `ToastProvider`, componente `Toast` y hook `useToast` (`apps/frontend/src/components/ui/Toast.tsx` + `Toast.module.css` + `apps/frontend/src/hooks/useToast.ts`) con variantes success/error/info y auto-descarte configurable
    - _Requisitos: 10.4_
  - [x]* 3.6 Escribir test de propiedad para Toast auto-descarte
    - **Propiedad 13: Toast se auto-descarta después del tiempo configurado**
    - **Valida: Requisitos 10.4**
  - [x] 3.7 Crear archivo barrel `apps/frontend/src/components/ui/index.ts` exportando todos los componentes UI

- [x] 4. Checkpoint - Verificar componentes base
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [x] 5. Implementar página de Login
  - [x] 5.1 Crear página de login (`apps/frontend/src/app/login/page.tsx` + `login.module.css`) con formulario centrado, campos email/password, validación client-side, estado de carga, manejo de error, e integración con AuthContext.login y redirección a /dashboard
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x]* 5.2 Escribir test de propiedad para validación de campos vacíos/whitespace
    - **Propiedad 1: Validación de campos vacíos/whitespace rechaza envío**
    - **Valida: Requisitos 2.5**
  - [x]* 5.3 Escribir tests unitarios para la página de login
    - Test: renderiza formulario con campos email y password
    - Test: muestra error cuando login falla
    - Test: deshabilita botón durante carga
    - _Requisitos: 2.1, 2.3, 2.4_

- [x] 6. Implementar Layout Principal (Dashboard Layout)
  - [x] 6.1 Actualizar `apps/frontend/src/app/layout.tsx` para importar globals.css y envolver con ToastProvider
    - _Requisitos: 1.1_
  - [x] 6.2 Crear layout del dashboard (`apps/frontend/src/app/dashboard/layout.tsx` + `layout.module.css`) con sidebar (navegación filtrada por ModuleGate), header (nombre usuario, TenantSelector estilizado, botón logout), y área de contenido. Incluir sidebar responsive con hamburguesa en móvil
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [x]* 6.3 Escribir test de propiedad para ruta activa en sidebar
    - **Propiedad 2: Ruta activa resaltada en sidebar**
    - **Valida: Requisitos 3.5**
  - [x]* 6.4 Escribir test de propiedad para módulos inactivos ocultos
    - **Propiedad 3: Módulos inactivos ocultos en navegación**
    - **Valida: Requisitos 3.6**

- [x] 7. Implementar página de Dashboard
  - [x] 7.1 Crear página de dashboard (`apps/frontend/src/app/dashboard/page.tsx` + `dashboard.module.css`) con tarjetas de resumen (usuarios, roles, módulos activos), estados de carga con Skeleton, y manejo de error con botón reintentar. Redirigir `/` a `/dashboard`
    - _Requisitos: 4.1, 4.2, 4.3_
  - [x]* 7.2 Escribir tests unitarios para la página de dashboard
    - Test: renderiza cards con datos
    - Test: muestra skeletons durante carga
    - Test: muestra error con botón reintentar
    - _Requisitos: 4.1, 4.2, 4.3_

- [x] 8. Checkpoint - Verificar layout y dashboard
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [x] 9. Implementar página de Gestión de Usuarios
  - [x] 9.1 Crear página de usuarios (`apps/frontend/src/app/dashboard/users/page.tsx` + `users.module.css`) con DataTable (email, nombre, estado Badge, roles), botón crear protegido con PermissionGate, modales de crear/editar/eliminar, integración con endpoints CRUD via httpClient, y notificaciones toast para errores y éxitos
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  - [x]* 9.2 Escribir test de propiedad para modal de edición pre-llenado
    - **Propiedad 5: Modal de edición pre-llenado con datos de la entidad**
    - **Valida: Requisitos 5.4, 7.4**
  - [x]* 9.3 Escribir test de propiedad para errores de API generan toast
    - **Propiedad 6: Errores de API generan notificación toast**
    - **Valida: Requisitos 5.6, 6.4, 7.5, 8.4**
  - [x]* 9.4 Escribir test de propiedad para PermissionGate oculta acciones
    - **Propiedad 7: PermissionGate oculta acciones no autorizadas**
    - **Valida: Requisitos 5.7**

- [x] 10. Implementar página de Gestión de Roles
  - [x] 10.1 Crear página de roles (`apps/frontend/src/app/dashboard/roles/page.tsx` + `roles.module.css`) con DataTable (nombre, scope Badge, conteo permisos), modal de asignación de rol a usuario con Select de roles, integración con endpoints GET /roles y POST /roles/:id/assign, y notificaciones toast
    - _Requisitos: 6.1, 6.2, 6.3, 6.4_
  - [x]* 10.2 Escribir tests unitarios para la página de roles
    - Test: renderiza tabla de roles
    - Test: modal de asignación envía request correcto
    - _Requisitos: 6.1, 6.3_

- [x] 11. Implementar página de Gestión de Tenants
  - [x] 11.1 Crear página de tenants (`apps/frontend/src/app/dashboard/tenants/page.tsx` + `tenants.module.css`) con DataTable (nombre, slug, estado Badge, acciones), modales de crear/editar, integración con endpoints CRUD via httpClient, y notificaciones toast
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [x]* 11.2 Escribir tests unitarios para la página de tenants
    - Test: renderiza tabla de tenants
    - Test: modal de creación envía request correcto
    - _Requisitos: 7.1, 7.3_

- [x] 12. Implementar página de Gestión de Módulos
  - [x] 12.1 Crear página de módulos (`apps/frontend/src/app/dashboard/modules/page.tsx` + `modules.module.css`) con lista de Cards por módulo (nombre, descripción, toggle), toggle deshabilitado para módulos core, integración con endpoints GET /modules/tenant/:tenantId y POST /modules/:id/toggle, reversión de toggle en caso de error, y notificaciones toast
    - _Requisitos: 8.1, 8.2, 8.3, 8.4_
  - [x]* 12.2 Escribir test de propiedad para toggle envía request correcto
    - **Propiedad 8: Toggle de módulo envía solicitud correcta**
    - **Valida: Requisitos 8.2**
  - [x]* 12.3 Escribir test de propiedad para módulos core deshabilitados
    - **Propiedad 9: Módulos core tienen toggle deshabilitado**
    - **Valida: Requisitos 8.3**
  - [x]* 12.4 Escribir test de propiedad para toggle fallido revierte estado
    - **Propiedad 10: Toggle fallido revierte al estado anterior**
    - **Valida: Requisitos 8.4**

- [x] 13. Implementar página de Acceso Denegado
  - [x] 13.1 Actualizar página de acceso denegado (`apps/frontend/src/app/access-denied/page.tsx` + `access-denied.module.css`) con icono SVG de candado, mensaje explicativo, y enlace/botón para volver al dashboard
    - _Requisitos: 9.1, 9.2_

- [x] 14. Checkpoint final - Verificar integración completa
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los tests de propiedades validan propiedades universales de correctitud
- Los tests unitarios validan ejemplos específicos y casos edge
- El proyecto ya tiene fast-check, jest y @testing-library/react instalados
