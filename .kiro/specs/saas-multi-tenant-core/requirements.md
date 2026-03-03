# Documento de Requisitos: Core Multi-Tenant SaaS

## Introducción

Este documento define los requisitos para el núcleo reutilizable de un sistema SaaS multi-tenant empresarial. El sistema se construye con arquitectura hexagonal (Ports & Adapters), Domain-Driven Design (DDD) y preparación para evolucionar a microservicios y arquitectura event-driven. El stack tecnológico incluye NestJS + TypeORM + PostgreSQL en backend, Next.js + Vue 3 en frontend, y un paquete compartido de tipos en TypeScript.

## Glosario

- **Tenant**: Organización o empresa que utiliza el sistema SaaS de forma aislada lógicamente de otros tenants.
- **RBAC**: Control de acceso basado en roles (Role-Based Access Control).
- **Permiso**: Autorización granular que define una acción sobre un recurso con un alcance determinado.
- **Alcance**: Nivel de visibilidad de un permiso: `global` (todo el sistema), `tenant` (dentro del tenant) u `own` (solo recursos propios).
- **Módulo**: Unidad funcional del sistema que puede activarse o desactivarse dinámicamente por tenant.
- **Domain_Event**: Evento de dominio que representa un hecho ocurrido en el sistema, preparado para ser consumido de forma asíncrona.
- **Arquitectura_Hexagonal**: Patrón arquitectónico que separa el dominio de la infraestructura mediante puertos (interfaces) y adaptadores (implementaciones).
- **Access_Token**: Token JWT de corta duración utilizado para autenticar peticiones HTTP.
- **Refresh_Token**: Token de larga duración persistido en base de datos, utilizado para obtener nuevos Access Tokens.
- **Soft_Delete**: Estrategia de eliminación lógica que marca registros como eliminados sin borrarlos físicamente.
- **Auditoría**: Registro automático de quién creó, modificó o eliminó un recurso y cuándo.
- **Guard**: Componente de seguridad que intercepta peticiones para verificar autenticación y autorización.
- **Core_Types**: Paquete compartido independiente de framework que contiene tipos, enums, DTOs y contratos de API.
- **Tenant_Context**: Contexto inyectado en cada petición que identifica el tenant activo.
- **Puerto**: Interfaz definida en la capa de dominio que abstrae dependencias externas.
- **Adaptador**: Implementación concreta de un puerto en la capa de infraestructura.

## Requisitos

### Requisito 1: Arquitectura Hexagonal y Estructura del Proyecto

**Historia de Usuario:** Como arquitecto de software, quiero que el sistema siga una arquitectura hexagonal con separación estricta de capas, para que el dominio sea independiente del framework y el sistema sea mantenible y extensible.

#### Criterios de Aceptación

1. THE Arquitectura_Hexagonal SHALL organizar el código backend en tres capas: Domain, Application e Infrastructure
2. THE Domain SHALL definir entidades, value objects, interfaces de repositorio, servicios de dominio y eventos de dominio sin depender de NestJS ni de ningún framework de infraestructura
3. THE Application SHALL contener casos de uso explícitos y DTOs que orquesten la lógica de dominio
4. THE Infrastructure SHALL contener las implementaciones concretas de repositorios, adaptadores de base de datos, autenticación y controladores HTTP
5. WHEN se añade un nuevo módulo funcional, THE Arquitectura_Hexagonal SHALL permitir su integración sin modificar las capas de Domain ni Application existentes
6. THE Arquitectura_Hexagonal SHALL aplicar inversión de dependencias real donde las capas superiores dependan de abstracciones definidas en Domain

### Requisito 2: Multi-Tenancy

**Historia de Usuario:** Como operador del sistema SaaS, quiero que cada tenant tenga sus datos aislados lógicamente, para que no exista fuga de información entre organizaciones.

#### Criterios de Aceptación

1. THE Tenant SHALL ser una entidad de dominio con identificador único, nombre, estado (activo/inactivo) y configuración propia
2. WHEN una petición HTTP llega al sistema, THE Tenant_Context SHALL resolver e inyectar el tenant_id correspondiente antes de ejecutar cualquier lógica de negocio
3. THE Multi-Tenancy SHALL requerir un tenant_id obligatorio en todas las entidades que pertenezcan a un tenant
4. WHEN se ejecuta una consulta a la base de datos, THE Repositorio SHALL filtrar automáticamente los resultados por el tenant_id del contexto activo
5. IF una petición intenta acceder a datos de un tenant diferente al del contexto activo, THEN THE Guard SHALL rechazar la petición con un error de autorización
6. WHEN se crea un nuevo recurso, THE Sistema SHALL asignar automáticamente el tenant_id del contexto activo al recurso

### Requisito 3: Sistema RBAC Empresarial

**Historia de Usuario:** Como administrador de tenant, quiero gestionar roles y permisos granulares, para que cada usuario tenga acceso solo a las funcionalidades que le corresponden.

#### Criterios de Aceptación

1. THE RBAC SHALL definir las entidades: User, Role, Permission, UserRole y RolePermission
2. THE Permission SHALL incluir tres atributos: recurso (string), acción (create, read, update, delete) y alcance (global, tenant, own)
3. THE Role SHALL poder ser de alcance global (aplica a todo el sistema) o de alcance tenant (aplica solo dentro de un tenant específico)
4. WHEN se asigna un rol a un usuario, THE RBAC SHALL crear una relación UserRole que vincule usuario, rol y opcionalmente tenant
5. WHEN una petición requiere autorización, THE Guard SHALL evaluar los permisos del usuario considerando el recurso, la acción y el alcance
6. WHEN el alcance de un permiso es "own", THE Guard SHALL verificar que el usuario sea el propietario del recurso solicitado
7. WHEN el alcance de un permiso es "tenant", THE Guard SHALL verificar que el recurso pertenezca al mismo tenant que el usuario
8. THE RBAC SHALL proporcionar un decorador @RequirePermission(recurso, acción) que se aplique a endpoints para declarar permisos requeridos

### Requisito 4: Sistema de Módulos Dinámico

**Historia de Usuario:** Como operador del sistema SaaS, quiero activar o desactivar módulos funcionales por tenant, para que cada organización tenga acceso solo a las funcionalidades contratadas.

#### Criterios de Aceptación

1. THE Module SHALL ser una entidad con identificador, nombre, descripción y estado (activo/inactivo)
2. THE Sistema SHALL mantener una relación TenantModule que vincule módulos activos a cada tenant
3. WHEN un usuario intenta acceder a una funcionalidad de un módulo, THE Guard SHALL verificar que el módulo esté activo para el tenant del usuario
4. IF un módulo no está activo para el tenant, THEN THE Guard SHALL rechazar la petición con un error indicando que el módulo no está disponible
5. WHEN se activa o desactiva un módulo para un tenant, THE Sistema SHALL emitir un Domain_Event correspondiente
6. THE Permission SHALL estar vinculado opcionalmente a un módulo, de forma que los permisos de un módulo desactivado no se evalúen


### Requisito 5: Autenticación Empresarial

**Historia de Usuario:** Como usuario del sistema, quiero autenticarme de forma segura con tokens de corta duración y capacidad de renovación, para que mis sesiones estén protegidas contra accesos no autorizados.

#### Criterios de Aceptación

1. WHEN un usuario se autentica con credenciales válidas, THE Sistema_Auth SHALL generar un Access_Token JWT de corta duración y un Refresh_Token persistido en base de datos
2. WHEN un Access_Token expira, THE Sistema_Auth SHALL permitir obtener un nuevo Access_Token presentando un Refresh_Token válido
3. WHEN se utiliza un Refresh_Token para renovación, THE Sistema_Auth SHALL rotar el Refresh_Token generando uno nuevo e invalidando el anterior
4. WHEN un usuario cierra sesión, THE Sistema_Auth SHALL revocar todos los Refresh_Tokens activos de esa sesión
5. IF un Refresh_Token ya utilizado se presenta nuevamente, THEN THE Sistema_Auth SHALL revocar todos los Refresh_Tokens de la familia del usuario como medida de seguridad
6. WHEN se genera un Access_Token, THE Sistema_Auth SHALL incluir en el payload: userId, tenantId y roles del usuario
7. IF las credenciales proporcionadas son inválidas, THEN THE Sistema_Auth SHALL rechazar la petición sin revelar si el error es de usuario o contraseña
8. THE Sistema_Auth SHALL almacenar las contraseñas utilizando un algoritmo de hashing seguro (bcrypt) con salt

### Requisito 6: Domain Events

**Historia de Usuario:** Como arquitecto de software, quiero que el sistema emita eventos de dominio ante hechos relevantes, para que el sistema esté preparado para evolucionar a una arquitectura event-driven con message brokers.

#### Criterios de Aceptación

1. THE Domain_Event SHALL tener una clase base con: eventId (UUID), eventType (string), occurredAt (timestamp), aggregateId (string) y payload (objeto)
2. THE Sistema SHALL proporcionar un EventDispatcher simple que permita registrar handlers y despachar eventos de forma síncrona
3. WHEN se crea un usuario, THE Sistema SHALL emitir un UserCreatedEvent con los datos del usuario creado
4. WHEN se asigna un rol a un usuario, THE Sistema SHALL emitir un RoleAssignedEvent con los datos de la asignación
5. WHEN se activa o desactiva un módulo para un tenant, THE Sistema SHALL emitir un ModuleToggledEvent
6. THE EventDispatcher SHALL definirse como un puerto (interfaz) en Domain para que pueda reemplazarse por un adaptador de message broker en el futuro
7. THE Domain_Event SHALL ser serializable a JSON para facilitar su transmisión futura a través de message brokers

### Requisito 7: Auditoría y Soft Deletes

**Historia de Usuario:** Como administrador del sistema, quiero que todas las operaciones queden registradas con información de auditoría y que las eliminaciones sean lógicas, para mantener trazabilidad completa y posibilidad de recuperación.

#### Criterios de Aceptación

1. THE Auditoría SHALL incluir los campos: createdAt, updatedAt, deletedAt, createdBy y updatedBy en todas las entidades auditables
2. WHEN se crea un recurso, THE Sistema SHALL registrar automáticamente createdAt con la fecha actual y createdBy con el userId del contexto
3. WHEN se actualiza un recurso, THE Sistema SHALL registrar automáticamente updatedAt con la fecha actual y updatedBy con el userId del contexto
4. WHEN se elimina un recurso, THE Soft_Delete SHALL marcar el campo deletedAt con la fecha actual en lugar de eliminar físicamente el registro
5. WHEN se consultan recursos, THE Repositorio SHALL excluir automáticamente los registros con deletedAt no nulo, salvo que se solicite explícitamente incluirlos
6. THE Auditoría SHALL implementarse de forma centralizada para evitar duplicación de lógica en cada entidad

### Requisito 8: Paquete Compartido Core Types

**Historia de Usuario:** Como desarrollador, quiero un paquete compartido de tipos independiente de framework, para que frontend y backend utilicen los mismos contratos y se reduzcan errores de integración.

#### Criterios de Aceptación

1. THE Core_Types SHALL definir enums de permisos (acciones: create, read, update, delete) y alcances (global, tenant, own)
2. THE Core_Types SHALL definir enums de módulos disponibles en el sistema
3. THE Core_Types SHALL definir interfaces de contratos de API (request/response) para cada endpoint
4. THE Core_Types SHALL definir tipos de DTOs compartidos entre frontend y backend
5. THE Core_Types SHALL definir tipos de Domain Events para que los consumidores conozcan la estructura de cada evento
6. THE Core_Types SHALL ser completamente independiente de cualquier framework (NestJS, Next.js, Vue)
7. WHEN se modifica un contrato en Core_Types, THE Sistema SHALL detectar incompatibilidades en tiempo de compilación tanto en frontend como en backend

### Requisito 9: Frontend – Arquitectura Modular y Seguridad

**Historia de Usuario:** Como desarrollador frontend, quiero una arquitectura modular con manejo automático de autenticación y permisos reactivos, para construir interfaces seguras y mantenibles.

#### Criterios de Aceptación

1. THE Frontend SHALL implementar un cliente HTTP tipado basado en los contratos definidos en Core_Types
2. WHEN un Access_Token expira durante una petición, THE Frontend SHALL interceptar el error, renovar el token automáticamente usando el Refresh_Token y reintentar la petición original
3. THE Frontend SHALL mantener un contexto global de usuario que incluya: datos del usuario, tenant activo y permisos
4. THE Frontend SHALL proporcionar un sistema reactivo de permisos que permita mostrar u ocultar elementos de UI según los permisos del usuario
5. WHEN un usuario intenta navegar a una ruta protegida sin los permisos necesarios, THE Frontend SHALL redirigir al usuario a una página de acceso denegado
6. THE Frontend SHALL soportar renderizado dinámico de módulos según los módulos activos del tenant
7. WHEN el usuario tiene acceso a múltiples tenants, THE Frontend SHALL proporcionar un selector de tenant para cambiar entre organizaciones

### Requisito 10: Escalabilidad y Preparación para Microservicios

**Historia de Usuario:** Como arquitecto de software, quiero que el core esté diseñado para escalar horizontalmente y migrar a microservicios, para que el sistema pueda crecer según las necesidades del negocio.

#### Criterios de Aceptación

1. THE Arquitectura_Hexagonal SHALL organizar los módulos de forma que cada bounded context pueda extraerse como un microservicio independiente
2. THE EventDispatcher SHALL diseñarse como un puerto reemplazable para que pueda sustituirse por un adaptador de RabbitMQ o Kafka sin modificar el dominio
3. THE Repositorio SHALL definirse como interfaces en Domain para que puedan implementarse con diferentes estrategias de base de datos (una BD compartida, BD por tenant, o BD por servicio)
4. WHEN el sistema evolucione a microservicios, THE Core_Types SHALL servir como contrato compartido entre servicios
5. THE Sistema SHALL evitar acoplamiento directo entre módulos, comunicándose a través de eventos de dominio o interfaces definidas

