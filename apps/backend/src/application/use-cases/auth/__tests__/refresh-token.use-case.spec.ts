import * as fc from 'fast-check';
import { RefreshTokenUseCase } from '../refresh-token.use-case';
import { TokenExpiredError, TokenReuseDetectedError } from '@domain/errors';
import { RefreshToken, User } from '@domain/entities';
import { UserStatus } from '@axion/types';
import { IUserRepository, IRefreshTokenRepository } from '@domain/repositories';
import { ITokenGenerator } from '@domain/services';

const makeUser = (userId: string, tenantId: string) =>
  new User({
    id: userId,
    tenantId,
    email: 'test@test.com',
    passwordHash: 'hashed',
    firstName: 'Test',
    lastName: 'User',
    status: UserStatus.ACTIVE,
    createdBy: 'system',
    updatedBy: 'system',
  });

/**
 * Feature: saas-multi-tenant-core, Property 7: Rotación de Refresh Token
 * **Valida: Requisitos 5.2, 5.3**
 */
describe('Property 7: Rotación de Refresh Token', () => {
  it('should revoke old token and generate new one with same familyId', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), fc.uuid(), fc.uuid(), async (userId, tenantId, familyId) => {
        const existingToken = new RefreshToken({
          id: 'token-id',
          userId,
          tokenHash: 'old-token',
          familyId,
          isRevoked: false,
          expiresAt: new Date(Date.now() + 60000),
        });

        let savedTokens: RefreshToken[] = [];

        const tokenRepo: IRefreshTokenRepository = {
          findByToken: jest.fn().mockResolvedValue(existingToken),
          save: jest.fn().mockImplementation(async (t: RefreshToken) => {
            savedTokens.push(t);
            return t;
          }),
          revokeByUserId: jest.fn(),
          revokeFamily: jest.fn(),
        };

        const tokenGenerator: ITokenGenerator = {
          generateAccessToken: jest.fn().mockReturnValue('new-access'),
          generateRefreshToken: jest.fn().mockReturnValue('new-refresh'),
          verifyAccessToken: jest.fn(),
        };

        const userRepo: IUserRepository = {
          findWithRoles: jest.fn().mockResolvedValue(makeUser(userId, tenantId)),
          findByEmail: jest.fn(),
          findById: jest.fn(),
          findAll: jest.fn(),
          save: jest.fn(),
          softDelete: jest.fn(),
        };

        const useCase = new RefreshTokenUseCase(tokenRepo, tokenGenerator, userRepo);
        const result = await useCase.execute({ refreshToken: 'old-token' } as any);

        // Old token must be revoked
        expect(existingToken.isRevoked).toBe(true);

        // New token must have same familyId
        const newToken = savedTokens.find((t) => t.tokenHash === 'new-refresh');
        expect(newToken).toBeDefined();
        expect(newToken!.familyId).toBe(familyId);

        // Result must contain new tokens
        expect(result.accessToken).toBe('new-access');
        expect(result.refreshToken).toBe('new-refresh');
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: saas-multi-tenant-core, Property 8: Revocación por reutilización de Refresh Token
 * **Valida: Requisito 5.5**
 */
describe('Property 8: Revocación por reutilización de Refresh Token', () => {
  it('should revoke entire family when a revoked token is reused', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), fc.uuid(), async (userId, familyId) => {
        const revokedToken = new RefreshToken({
          id: 'token-id',
          userId,
          tokenHash: 'reused-token',
          familyId,
          isRevoked: true,
          expiresAt: new Date(Date.now() + 60000),
        });

        const revokeFamilyFn = jest.fn();

        const tokenRepo: IRefreshTokenRepository = {
          findByToken: jest.fn().mockResolvedValue(revokedToken),
          save: jest.fn(),
          revokeByUserId: jest.fn(),
          revokeFamily: revokeFamilyFn,
        };

        const tokenGenerator: ITokenGenerator = {
          generateAccessToken: jest.fn(),
          generateRefreshToken: jest.fn(),
          verifyAccessToken: jest.fn(),
        };

        const userRepo: IUserRepository = {
          findWithRoles: jest.fn(),
          findByEmail: jest.fn(),
          findById: jest.fn(),
          findAll: jest.fn(),
          save: jest.fn(),
          softDelete: jest.fn(),
        };

        const useCase = new RefreshTokenUseCase(tokenRepo, tokenGenerator, userRepo);

        await expect(useCase.execute({ refreshToken: 'reused-token' } as any)).rejects.toThrow(
          TokenReuseDetectedError,
        );

        // Must revoke entire family
        expect(revokeFamilyFn).toHaveBeenCalledWith(familyId);
      }),
      { numRuns: 100 },
    );
  });
});
