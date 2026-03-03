import { AuthController } from '../auth.controller';
import { LoginUseCase, RefreshTokenUseCase, LogoutUseCase } from '@application/use-cases';
import { AuthTokensDto, UserResponseDto } from '@application/dto';
import { User } from '@domain/entities';
import { UserStatus } from '@axion/types';

describe('Auth Flow Integration: login → refresh → logout', () => {
  let controller: AuthController;
  let loginUseCase: jest.Mocked<LoginUseCase>;
  let refreshTokenUseCase: jest.Mocked<RefreshTokenUseCase>;
  let logoutUseCase: jest.Mocked<LogoutUseCase>;

  const mockUser = new User({
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'test@example.com',
    passwordHash: 'hashed',
    firstName: 'Test',
    lastName: 'User',
    createdBy: 'system',
    updatedBy: 'system',
  });

  const mockTokens = new AuthTokensDto({
    accessToken: 'access-token-1',
    refreshToken: 'refresh-token-1',
    user: new UserResponseDto(mockUser),
  });

  const mockRefreshedTokens = new AuthTokensDto({
    accessToken: 'access-token-2',
    refreshToken: 'refresh-token-2',
    user: new UserResponseDto(mockUser),
  });

  beforeEach(() => {
    loginUseCase = { execute: jest.fn() } as any;
    refreshTokenUseCase = { execute: jest.fn() } as any;
    logoutUseCase = { execute: jest.fn() } as any;

    controller = new AuthController(loginUseCase, refreshTokenUseCase, logoutUseCase);
  });

  it('should complete full auth flow: login → refresh → logout', async () => {
    // Step 1: Login
    loginUseCase.execute.mockResolvedValue(mockTokens);
    const loginResult = await controller.login(
      { email: 'test@example.com', password: 'password123' } as any,
      { tenantId: 'tenant-1' },
    );
    expect(loginResult.accessToken).toBe('access-token-1');
    expect(loginResult.refreshToken).toBe('refresh-token-1');
    expect(loginUseCase.execute).toHaveBeenCalledWith(
      { email: 'test@example.com', password: 'password123' },
      'tenant-1',
    );

    // Step 2: Refresh
    refreshTokenUseCase.execute.mockResolvedValue(mockRefreshedTokens);
    const refreshResult = await controller.refresh({ refreshToken: 'refresh-token-1' } as any);
    expect(refreshResult.accessToken).toBe('access-token-2');
    expect(refreshResult.refreshToken).toBe('refresh-token-2');

    // Step 3: Logout
    logoutUseCase.execute.mockResolvedValue(undefined);
    await controller.logout({ user: { userId: 'user-1' } });
    expect(logoutUseCase.execute).toHaveBeenCalledWith('user-1');
  });

  it('should propagate InvalidCredentialsError on bad login', async () => {
    const { InvalidCredentialsError } = require('@domain/errors');
    loginUseCase.execute.mockRejectedValue(new InvalidCredentialsError());

    await expect(
      controller.login({ email: 'bad@example.com', password: 'wrong' } as any, { tenantId: 'tenant-1' }),
    ).rejects.toThrow('Credenciales inválidas');
  });
});
