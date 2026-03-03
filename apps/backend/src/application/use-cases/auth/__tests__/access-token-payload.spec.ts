import * as fc from 'fast-check';
import { LoginUseCase } from '../login.use-case';
import { User, UserRole } from '@domain/entities';
import { UserStatus } from '@axion/types';
import { IUserRepository, IRefreshTokenRepository } from '@domain/repositories';
import { IPasswordHasher, ITokenGenerator, TokenPayload } from '@domain/services';
import { IEventDispatcher } from '@domain/events';

/**
 * Feature: saas-multi-tenant-core, Property 6: Payload del Access Token
 * **Valida: Requisito 5.6**
 *
 * Para cualquier Access Token generado, al decodificarlo debe contener
 * userId, tenantId y roles que coincidan con los datos del usuario autenticado.
 */
describe('Property 6: Payload del Access Token', () => {
  it('should generate access token with correct userId, tenantId and roles', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        fc.array(fc.uuid(), { minLength: 0, maxLength: 5 }),
        async (userId, tenantId, roleIds) => {
          let capturedPayload: TokenPayload | null = null;

          const roles = roleIds.map(
            (rid) =>
              new UserRole({
                id: `ur-${rid}`,
                userId,
                roleId: rid,
                tenantId,
                assignedBy: 'system',
              }),
          );

          const user = new User({
            id: userId,
            tenantId,
            email: 'test@test.com',
            passwordHash: 'hashed',
            firstName: 'Test',
            lastName: 'User',
            status: UserStatus.ACTIVE,
            roles,
            createdBy: 'system',
            updatedBy: 'system',
          });

          const userRepo: IUserRepository = {
            findByEmail: jest.fn().mockResolvedValue(user),
            findById: jest.fn(),
            findAll: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
            findWithRoles: jest.fn(),
          };

          const tokenRepo: IRefreshTokenRepository = {
            save: jest.fn().mockResolvedValue({}),
            findByToken: jest.fn(),
            revokeByUserId: jest.fn(),
            revokeFamily: jest.fn(),
          };

          const hasher: IPasswordHasher = {
            hash: jest.fn(),
            compare: jest.fn().mockResolvedValue(true),
          };

          const tokenGenerator: ITokenGenerator = {
            generateAccessToken: jest.fn().mockImplementation((payload: TokenPayload) => {
              capturedPayload = payload;
              return 'access-token';
            }),
            generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
            verifyAccessToken: jest.fn(),
          };

          const eventDispatcher: IEventDispatcher = {
            dispatch: jest.fn(),
            register: jest.fn(),
          };

          const useCase = new LoginUseCase(
            userRepo,
            tokenRepo,
            hasher,
            tokenGenerator,
            eventDispatcher,
          );

          await useCase.execute({ email: 'test@test.com', password: 'password123' } as any, tenantId);

          // Verify the payload passed to generateAccessToken
          expect(capturedPayload).not.toBeNull();
          expect(capturedPayload!.userId).toBe(userId);
          expect(capturedPayload!.tenantId).toBe(tenantId);
          expect(capturedPayload!.roles).toEqual(roleIds);
        },
      ),
      { numRuns: 100 },
    );
  });
});
