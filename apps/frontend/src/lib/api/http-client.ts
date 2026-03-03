import { RefreshRequest, RefreshResponse } from '@axion/types';
import { tokenStorage } from './token-storage';

export interface RequestConfig {
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

export interface HttpClientConfig {
  baseUrl: string;
  tenantId: string | null;
  onTokenRefreshed?: (accessToken: string, refreshToken: string) => void;
  onRefreshFailed?: () => void;
}

export class HttpClient {
  private config: HttpClientConfig;
  private isRefreshing = false;
  private refreshQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor(config: HttpClientConfig) {
    this.config = config;
  }

  setTenantId(tenantId: string | null): void {
    this.config.tenantId = tenantId;
  }

  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('GET', url, undefined, config);
  }

  async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('POST', url, data, config);
  }

  async put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>('PUT', url, data, config);
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config);
  }

  private buildHeaders(config?: RequestConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config?.headers,
    };

    if (!config?.skipAuth) {
      const token = tokenStorage.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    if (this.config.tenantId) {
      headers['x-tenant-id'] = this.config.tenantId;
    }

    return headers;
  }

  private async request<T>(
    method: string,
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<T> {
    const fullUrl = `${this.config.baseUrl}${url}`;
    const headers = this.buildHeaders(config);

    const response = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (response.status === 401 && !config?.skipAuth) {
      return this.handleUnauthorized<T>(method, url, data, config);
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new HttpError(response.status, errorBody.message || response.statusText, errorBody.code);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  private async handleUnauthorized<T>(
    method: string,
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<T> {
    if (this.isRefreshing) {
      // Queue this request until refresh completes
      return new Promise<T>((resolve, reject) => {
        this.refreshQueue.push({
          resolve: () => {
            this.request<T>(method, url, data, { ...config, skipAuth: false })
              .then(resolve)
              .catch(reject);
          },
          reject,
        } as any);
      });
    }

    this.isRefreshing = true;

    try {
      const currentRefreshToken = tokenStorage.getRefreshToken();
      if (!currentRefreshToken) {
        throw new Error('No refresh token available');
      }

      const refreshData: RefreshRequest = { refreshToken: currentRefreshToken };
      const refreshResponse = await this.request<RefreshResponse>(
        'POST',
        '/auth/refresh',
        refreshData,
        { skipAuth: true },
      );

      tokenStorage.setAccessToken(refreshResponse.accessToken);
      tokenStorage.setRefreshToken(refreshResponse.refreshToken);

      this.config.onTokenRefreshed?.(
        refreshResponse.accessToken,
        refreshResponse.refreshToken,
      );

      // Process queued requests
      this.refreshQueue.forEach((queued) => queued.resolve(refreshResponse.accessToken));
      this.refreshQueue = [];

      // Retry original request
      return this.request<T>(method, url, data, config);
    } catch (error) {
      this.refreshQueue.forEach((queued) => queued.reject(error as Error));
      this.refreshQueue = [];
      tokenStorage.clear();
      this.config.onRefreshFailed?.();
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
