export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class EntityNotFoundError extends DomainError {
  readonly code = 'ENTITY_NOT_FOUND';
  readonly statusCode = 404;

  constructor(entity: string, id: string) {
    super(`${entity} con id ${id} no encontrado`);
  }
}

export class TenantMismatchError extends DomainError {
  readonly code = 'TENANT_MISMATCH';
  readonly statusCode = 403;

  constructor() {
    super('Acceso denegado: recurso pertenece a otro tenant');
  }
}

export class InvalidCredentialsError extends DomainError {
  readonly code = 'INVALID_CREDENTIALS';
  readonly statusCode = 401;

  constructor() {
    super('Credenciales inválidas');
  }
}

export class ModuleInactiveError extends DomainError {
  readonly code = 'MODULE_INACTIVE';
  readonly statusCode = 403;

  constructor(moduleName: string) {
    super(`Módulo ${moduleName} no está activo para este tenant`);
  }
}

export class InsufficientPermissionsError extends DomainError {
  readonly code = 'INSUFFICIENT_PERMISSIONS';
  readonly statusCode = 403;

  constructor() {
    super('Permisos insuficientes para esta operación');
  }
}

export class TokenExpiredError extends DomainError {
  readonly code = 'TOKEN_EXPIRED';
  readonly statusCode = 401;

  constructor() {
    super('Token expirado');
  }
}

export class TokenReuseDetectedError extends DomainError {
  readonly code = 'TOKEN_REUSE_DETECTED';
  readonly statusCode = 401;

  constructor() {
    super('Reutilización de token detectada');
  }
}
