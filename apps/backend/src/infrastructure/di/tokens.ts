// Injection tokens for domain ports (interfaces)
export const TOKENS = {
  // Repositories
  USER_REPOSITORY: 'IUserRepository',
  ROLE_REPOSITORY: 'IRoleRepository',
  TENANT_REPOSITORY: 'ITenantRepository',
  REFRESH_TOKEN_REPOSITORY: 'IRefreshTokenRepository',
  MODULE_REPOSITORY: 'IModuleRepository',

  // Services
  PASSWORD_HASHER: 'IPasswordHasher',
  TOKEN_GENERATOR: 'ITokenGenerator',
  PERMISSION_EVALUATOR: 'IPermissionEvaluator',
  EVENT_DISPATCHER: 'IEventDispatcher',

  // Use Cases
  LOGIN_USE_CASE: 'LoginUseCase',
  REFRESH_TOKEN_USE_CASE: 'RefreshTokenUseCase',
  LOGOUT_USE_CASE: 'LogoutUseCase',
  CREATE_USER_USE_CASE: 'CreateUserUseCase',
  ASSIGN_ROLE_USE_CASE: 'AssignRoleUseCase',
  TOGGLE_MODULE_USE_CASE: 'ToggleModuleUseCase',
} as const;
