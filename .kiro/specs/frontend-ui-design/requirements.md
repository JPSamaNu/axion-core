# Documento de Requisitos: Diseño UI del Frontend

## Introducción

Este documento define los requisitos para la implementación del diseño UI completo del frontend de la aplicación SaaS multi-tenant. El objetivo es crear una interfaz limpia, moderna y minimalista usando CSS Modules con un sistema de design tokens basado en CSS custom properties. La UI debe integrarse con los contextos existentes (AuthContext, PermissionContext, TenantContext) y comunicarse con el backend a través del HttpClient ya implementado.

## Glosario

- **Sistema_UI**: El conjunto de componentes visuales y páginas del frontend Next.js 14
- **Design_Tokens**: Variables CSS custom properties que definen colores, espaciado, tipografía y otros valores de diseño reutilizables
- **Layout_Principal**: La estructura visual que envuelve las páginas autenticadas, compuesta por sidebar, header y área de contenido
- **Sidebar**: Panel lateral de navegación con enlaces a las secciones del sistema
- **Componente_Tabla**: Componente reutilizable para mostrar datos tabulares con soporte para acciones
- **Componente_Modal**: Componente reutilizable para diálogos superpuestos con formularios o confirmaciones
- **Componente_Toast**: Componente de notificación temporal que aparece brevemente para informar al usuario
- **HttpClient**: Cliente HTTP tipado existente que maneja autenticación y headers de tenant automáticamente
- **PermissionGate**: Componente existente que renderiza contenido condicionalmente según permisos del usuario
- **ModuleGate**: Componente existente que renderiza contenido condicionalmente según módulos activos del tenant

## Requisitos

### Requisito 1: Sistema de Design Tokens

**Historia de Usuario:** Como desarrollador, quiero un sistema de design tokens centralizado, para que todos los componentes mantengan consistencia visual y sea fácil modificar el tema.

#### Criterios de Aceptación

1. THE Sistema_UI SHALL definir design tokens como CSS custom properties en un archivo global que incluya paleta de colores, escala de espaciado, escala tipográfica y radios de borde
2. WHEN el usuario tiene preferencia de esquema oscuro en su sistema operativo, THE Sistema_UI SHALL aplicar automáticamente un tema oscuro alternando los valores de los design tokens
3. THE Sistema_UI SHALL usar exclusivamente los design tokens definidos para todos los valores de color, espaciado y tipografía en los componentes

### Requisito 2: Página de Login

**Historia de Usuario:** Como usuario no autenticado, quiero una página de login clara y centrada, para que pueda iniciar sesión de forma rápida e intuitiva.

#### Criterios de Aceptación

1. WHEN un usuario no autenticado accede a la aplicación, THE Sistema_UI SHALL mostrar un formulario de login centrado vertical y horizontalmente con campos de email y contraseña y un botón de envío
2. WHEN el usuario envía credenciales válidas, THE Sistema_UI SHALL invocar la función login del AuthContext y redirigir al dashboard
3. WHEN el servidor retorna un error de autenticación, THE Sistema_UI SHALL mostrar un mensaje de error descriptivo debajo del formulario sin recargar la página
4. WHILE el formulario está procesando la solicitud de login, THE Sistema_UI SHALL deshabilitar el botón de envío y mostrar un indicador de carga
5. WHEN el usuario envía el formulario con campos vacíos, THE Sistema_UI SHALL mostrar mensajes de validación inline para cada campo requerido sin enviar la solicitud al servidor

### Requisito 3: Layout Principal con Sidebar y Header

**Historia de Usuario:** Como usuario autenticado, quiero un layout con navegación lateral y header informativo, para que pueda navegar entre secciones y ver mi contexto actual.

#### Criterios de Aceptación

1. WHEN un usuario autenticado accede a cualquier página protegida, THE Layout_Principal SHALL mostrar un sidebar con enlaces de navegación a Dashboard, Usuarios, Roles, Tenants y Módulos
2. THE Layout_Principal SHALL mostrar un header con el nombre del usuario actual, el selector de tenant y un botón de cerrar sesión
3. WHEN el usuario hace clic en el botón de cerrar sesión, THE Layout_Principal SHALL invocar la función logout del AuthContext y redirigir a la página de login
4. WHEN el ancho de la ventana es menor a 768px, THE Layout_Principal SHALL colapsar el sidebar y mostrar un botón hamburguesa para abrirlo como overlay
5. THE Sidebar SHALL resaltar visualmente el enlace de navegación correspondiente a la ruta activa actual
6. WHEN un módulo del sistema no está activo para el tenant actual, THE Sidebar SHALL ocultar el enlace de navegación correspondiente a ese módulo usando ModuleGate

### Requisito 4: Página de Dashboard

**Historia de Usuario:** Como usuario autenticado, quiero ver un resumen general al entrar al sistema, para que pueda tener una vista rápida del estado del tenant.

#### Criterios de Aceptación

1. WHEN un usuario autenticado accede al dashboard, THE Sistema_UI SHALL mostrar tarjetas de resumen con contadores de usuarios, roles y módulos activos del tenant actual
2. WHEN los datos están cargando, THE Sistema_UI SHALL mostrar estados de carga (skeleton) en las tarjetas de resumen
3. IF la solicitud de datos falla, THEN THE Sistema_UI SHALL mostrar un mensaje de error con opción de reintentar

### Requisito 5: Gestión de Usuarios

**Historia de Usuario:** Como administrador, quiero gestionar los usuarios del tenant, para que pueda crear, editar y eliminar cuentas de usuario.

#### Criterios de Aceptación

1. WHEN un administrador accede a la sección de usuarios, THE Sistema_UI SHALL mostrar una tabla con la lista de usuarios del tenant mostrando email, nombre, estado y roles asignados
2. WHEN un administrador hace clic en "Crear usuario", THE Sistema_UI SHALL abrir un modal con un formulario que solicite email, contraseña, nombre y apellido
3. WHEN un administrador envía el formulario de creación con datos válidos, THE Sistema_UI SHALL enviar la solicitud al endpoint POST /users y actualizar la tabla al recibir respuesta exitosa
4. WHEN un administrador hace clic en "Editar" en un usuario, THE Sistema_UI SHALL abrir un modal con los datos actuales del usuario permitiendo modificar nombre, apellido y estado
5. WHEN un administrador hace clic en "Eliminar" en un usuario, THE Sistema_UI SHALL mostrar un modal de confirmación antes de enviar la solicitud DELETE
6. IF una operación CRUD de usuario falla, THEN THE Sistema_UI SHALL mostrar una notificación toast con el mensaje de error
7. WHEN el usuario no tiene permiso para una acción CRUD, THE Sistema_UI SHALL ocultar el botón correspondiente usando PermissionGate

### Requisito 6: Gestión de Roles

**Historia de Usuario:** Como administrador, quiero gestionar los roles y asignarlos a usuarios, para que pueda controlar los permisos de acceso.

#### Criterios de Aceptación

1. WHEN un administrador accede a la sección de roles, THE Sistema_UI SHALL mostrar una tabla con la lista de roles mostrando nombre, scope y cantidad de permisos
2. WHEN un administrador hace clic en "Asignar rol" en un usuario, THE Sistema_UI SHALL abrir un modal con un selector de roles disponibles
3. WHEN un administrador confirma la asignación de rol, THE Sistema_UI SHALL enviar la solicitud al endpoint POST /roles/:id/assign y mostrar una notificación toast de éxito
4. IF la asignación de rol falla, THEN THE Sistema_UI SHALL mostrar una notificación toast con el mensaje de error

### Requisito 7: Gestión de Tenants

**Historia de Usuario:** Como super-administrador, quiero gestionar los tenants del sistema, para que pueda crear y configurar organizaciones.

#### Criterios de Aceptación

1. WHEN un super-administrador accede a la sección de tenants, THE Sistema_UI SHALL mostrar una tabla con la lista de tenants mostrando nombre, slug y estado
2. WHEN un super-administrador hace clic en "Crear tenant", THE Sistema_UI SHALL abrir un modal con un formulario que solicite nombre y slug
3. WHEN un super-administrador envía el formulario de creación con datos válidos, THE Sistema_UI SHALL enviar la solicitud al endpoint POST /tenants y actualizar la tabla
4. WHEN un super-administrador hace clic en "Editar" en un tenant, THE Sistema_UI SHALL abrir un modal permitiendo modificar nombre y estado
5. IF una operación CRUD de tenant falla, THEN THE Sistema_UI SHALL mostrar una notificación toast con el mensaje de error

### Requisito 8: Gestión de Módulos

**Historia de Usuario:** Como super-administrador, quiero activar o desactivar módulos por tenant, para que pueda controlar las funcionalidades disponibles para cada organización.

#### Criterios de Aceptación

1. WHEN un super-administrador accede a la sección de módulos, THE Sistema_UI SHALL mostrar una lista de módulos del sistema con su nombre, descripción y un toggle de activación por tenant
2. WHEN un super-administrador cambia el estado de un toggle de módulo, THE Sistema_UI SHALL enviar la solicitud al endpoint POST /modules/:id/toggle con el nuevo estado
3. WHILE un módulo es de tipo core, THE Sistema_UI SHALL mostrar el toggle deshabilitado e indicar visualmente que el módulo no puede desactivarse
4. IF el cambio de estado de un módulo falla, THEN THE Sistema_UI SHALL revertir el toggle a su estado anterior y mostrar una notificación toast con el error

### Requisito 9: Página de Acceso Denegado

**Historia de Usuario:** Como usuario, quiero ver una página amigable cuando no tengo permisos, para que entienda la situación y sepa qué hacer.

#### Criterios de Aceptación

1. WHEN un usuario accede a una ruta para la cual no tiene permisos, THE Sistema_UI SHALL mostrar una página de acceso denegado con un mensaje explicativo y un enlace para volver al dashboard
2. THE Sistema_UI SHALL mostrar un icono o ilustración visual que comunique claramente la restricción de acceso

### Requisito 10: Componentes Reutilizables de UI

**Historia de Usuario:** Como desarrollador, quiero un conjunto de componentes UI reutilizables, para que pueda construir interfaces consistentes de forma eficiente.

#### Criterios de Aceptación

1. THE Componente_Tabla SHALL aceptar datos, definición de columnas y acciones opcionales por fila, y renderizar una tabla HTML semántica con estilos consistentes
2. THE Componente_Modal SHALL renderizar un diálogo superpuesto con overlay, título, contenido y botones de acción, y cerrarse al hacer clic en el overlay o presionar Escape
3. THE Sistema_UI SHALL proveer componentes de formulario (Input, Select, Button) que apliquen estilos consistentes del sistema de design tokens y soporten estados de error y deshabilitado
4. THE Componente_Toast SHALL mostrar notificaciones temporales con variantes de éxito, error e información, y desaparecer automáticamente después de un tiempo configurable
5. THE Sistema_UI SHALL proveer un componente Badge para mostrar estados (activo, inactivo, suspendido) con colores diferenciados según el valor del estado
6. THE Sistema_UI SHALL proveer un componente Card para agrupar contenido con título opcional, padding consistente y borde sutil

### Requisito 11: Responsividad

**Historia de Usuario:** Como usuario, quiero que la aplicación se adapte a diferentes tamaños de pantalla, para que pueda usarla en dispositivos móviles y de escritorio.

#### Criterios de Aceptación

1. WHEN el ancho de la ventana es menor a 768px, THE Sistema_UI SHALL adaptar las tablas para que sean scrolleables horizontalmente
2. WHEN el ancho de la ventana es menor a 768px, THE Sistema_UI SHALL apilar los campos de formulario verticalmente en los modales
3. THE Sistema_UI SHALL usar unidades relativas (rem) para tipografía y espaciado para permitir escalado proporcional
