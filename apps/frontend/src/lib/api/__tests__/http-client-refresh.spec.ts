/**
 * Property 15: Interceptor de refresh en frontend
 * Validates: Requisito 9.2
 *
 * Para cualquier petición HTTP que falla con error 401 por token expirado,
 * el interceptor del cliente HTTP debe automáticamente solicitar un nuevo
 * Access Token usando el Refresh Token, y reintentar la petición original
 * con el nuevo token.
 */
import * as fc from 'fast-check';
import { HttpClient } from '../http-client';
import { tokenStorage } from '../token-storage';

// Mock global fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

describe('Property 15: Interceptor de refresh en frontend', () => {
  let client: HttpClient;
  let onTokenRefreshed: jest.Mock;
  let onRefreshFailed: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    tokenStorage.clear();
    onTokenRefreshed = jest.fn();
    onRefreshFailed = jest.fn();
    client = new HttpClient({
      baseUrl: 'http://localhost:3000',
      tenantId: 'tenant-1',
      onTokenRefreshed,
      onRefreshFailed,
    });
  });

  it('should automatically refresh token and retry on 401', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('"')),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('"')),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('"')),
        async (originalToken, refreshTokenValue, newAccessToken) => {
          jest.clearAllMocks();
          tokenStorage.setAccessToken(originalToken);
          tokenStorage.setRefreshToken(refreshTokenValue);

          let callCount = 0;
          mockFetch.mockImplementation(async (url: string, options: any) => {
            callCount++;
            // First call: original request returns 401
            if (callCount === 1) {
              return { ok: false, status: 401, json: async () => ({ message: 'Token expired' }) };
            }
            // Second call: refresh endpoint succeeds
            if (callCount === 2) {
              expect(url).toContain('/auth/refresh');
              return {
                ok: true,
                status: 200,
                json: async () => ({
                  accessToken: newAccessToken,
                  refreshToken: 'new-refresh-token',
                }),
              };
            }
            // Third call: retry original request succeeds
            if (callCount === 3) {
              const authHeader = options.headers?.['Authorization'];
              expect(authHeader).toBe(`Bearer ${newAccessToken}`);
              return { ok: true, status: 200, json: async () => ({ data: 'success' }) };
            }
            return { ok: true, status: 200, json: async () => ({}) };
          });

          const result = await client.get<{ data: string }>('/test');
          expect(result.data).toBe('success');
          expect(callCount).toBe(3);
          expect(onTokenRefreshed).toHaveBeenCalledWith(newAccessToken, 'new-refresh-token');
          expect(tokenStorage.getAccessToken()).toBe(newAccessToken);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should call onRefreshFailed and clear tokens when refresh fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('"')),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('"')),
        async (originalToken, refreshTokenValue) => {
          jest.clearAllMocks();
          tokenStorage.setAccessToken(originalToken);
          tokenStorage.setRefreshToken(refreshTokenValue);

          let callCount = 0;
          mockFetch.mockImplementation(async () => {
            callCount++;
            if (callCount === 1) {
              return { ok: false, status: 401, json: async () => ({ message: 'Expired' }) };
            }
            // Refresh also fails
            return { ok: false, status: 401, json: async () => ({ message: 'Invalid refresh' }) };
          });

          await expect(client.get('/test')).rejects.toThrow();
          expect(onRefreshFailed).toHaveBeenCalled();
          expect(tokenStorage.getAccessToken()).toBeNull();
          expect(tokenStorage.getRefreshToken()).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should not attempt refresh when no refresh token is available', async () => {
    tokenStorage.setAccessToken('some-token');
    // No refresh token set

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Expired' }),
    });

    await expect(client.get('/test')).rejects.toThrow('No refresh token available');
    expect(onRefreshFailed).toHaveBeenCalled();
  });
});
