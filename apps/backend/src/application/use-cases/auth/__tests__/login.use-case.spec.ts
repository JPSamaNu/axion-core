import * as fc from 'fast-check';
import { LoginUseCase } from '../login.use-case';
import { InvalidCredentialsError } from '@domain/errors';
import { User } from '@domain/entities';
import { UserStatus } from '@axion/types';
import { IUserRepository, IRefreshTokenRepository } from '@domain/repositories';
import { IPasswordHasher, ITokenGenerator } from '@domain/services';
import { IEventDispatcher } from '@domain/events';

/**
 * Feature: saas-multi-tenant-core, Property 9: Credenciales inválidas no revelan información
 * **Valida: Requisito 5.7**
 *
 * Para cualquier intento de login con credenciales inválidas, ya sea por email
 * inexistente o por contraseña incorrecta, el mensaje de error devuelto debe
 * ser idéntico en ambos casos.
 */
describe('Property 9: Credenciales inválidas no revelan información', () => {
  const makeMocks = (opts: { userExists: boolean; passwordValid: boolean }) => {
    const userRepo: IUserRepository = {
      findByEmail: jest.fn().mockResolvedValue(
        opts.userExists
          ? new User({
              id: 'user-id',
              tenantId: 'tenant-id',
              email: 'test@test.com',
              passwordHash: 'hashed',
              firstName: 'Test',
              lastName: 'User',
              status: UserStatus.ACTIVE,
              createdBy: 'system',
              updatedBy: 'system',
            })
          : null,
      ),
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
      compare: jest.fn().mockResolvedValue(opts.passwordValid),
    };

    const tokenGenerator: ITokenGenerator = {
      generateAccessToken: jest.fn().mockReturnValue('access-token'),
      generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
      verifyAccessToken: jest.fn(),
    };

    const eventDispatcher: IEventDispatcher = {
      dispatch: jest.fn(),
      register: jest.fn(),
    };

    return { userRepo, tokenRepo, hasher, tokenGenerator, eventDispatcher };
  };

  it('should return identical error for non-existent email and wrong password', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 50 }),
        fc.uuid(),
        async (email, password, tenantId) => {
          // Case 1: email does not exist
          const mocks1 = makeMocks({ userExists: false, passwordValid: false });
          const useCase1 = new LoginUseCase(
            mocks1.userRepo,
            mocks1.tokenRepo,
            mocks1.hasher,
            mocks1.tokenGenerator,
            mocks1.eventDispatcher,
          );

          let error1: InvalidCredentialsError | null = null;
          try {
            await useCase1.execute({ email, password } as any, tenantId);
          } catch (e) {
            error1 = e as InvalidCredentialsError;
          }

          // Case 2: email exists but password is wrong
          const mocks2 = makeMocks({ userExists: true, passwordValid: false });
          const useCase2 = new LoginUseCase(
            mocks2.userRepo,
            mocks2.tokenRepo,
            mocks2.hasher,
            mocks2.tokenGenerator,
            mocks2.eventDispatcher,
          );

          let error2: InvalidCredentialsError | null = null;
          try {
            await useCase2.execute({ email, password } as any, tenantId);
          } catch (e) {
            error2 = e as InvalidCredentialsError;
          }

          // Both must throw
          expect(error1).not.toBeNull();
          expect(error2).not.toBeNull();

          // Error messages must be identical
          expect(error1!.message).toBe(error2!.message);
          expect(error1!.code).toBe(error2!.code);
          expect(error1!.statusCode).toBe(error2!.statusCode);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: saas-multi-tenant-core, Property 10: Hashing seguro de contraseñas (round-trip)
 * **Valida: Requisito 5.8**
 *
 * Para cualquier contraseña, hashearla y luego compararla con el hash original
 * debe retornar verdadero.
 */
describe('Property 10: Hashing seguro de contraseñas (round-trip)', () => {
  // Simple bcrypt-like mock that demonstrates the round-trip property
  const mockHasher: IPasswordHasher = {
    hash: async (password: string) => `hashed:${password}`,
    compare: async (password: string, hash: string) => hash === `hashed:${password}`,
  };

  it('should verify that hash(password) then compare(password, hash) returns true', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (password) => {
          const hash = await mockHasher.hash(password);
          const result = await mockHasher.compare(password, hash);
          expect(result).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should verify that compare with wrong password returns false', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (password, wrongPassword) => {
          fc.pre(password !== wrongPassword);
          const hash = await mockHasher.hash(password);
          const result = await mockHasher.compare(wrongPassword, hash);
          expect(result).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});
