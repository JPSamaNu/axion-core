/**
 * Feature: frontend-ui-design
 * Property 8: Toggle de módulo envía solicitud correcta
 * Property 9: Módulos core tienen toggle deshabilitado
 * Property 10: Toggle fallido revierte al estado anterior
 * **Valida: Requisitos 8.2, 8.3, 8.4**
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockShowToast = jest.fn();
jest.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
  ToastProvider: ({ children }: any) => <>{children}</>,
}));

// Stable mock references — critical to avoid useCallback infinite loops
const mockGet = jest.fn();
const mockPost = jest.fn();
const stableHttpClient = { get: mockGet, post: mockPost };
const stableTenant = { id: 'tenant-1', name: 'Test', slug: 'test', status: 'active' };

jest.mock('@/lib/auth', () => ({
  useAuth: () => ({ httpClient: stableHttpClient }),
}));

jest.mock('@/lib/tenant', () => ({
  useTenant: () => ({ currentTenant: stableTenant }),
}));

import ModulesPage from '../page';

function setupMocks(modules: any[], tenantModules: any[]) {
  mockGet.mockImplementation((url: string) => {
    if (url === '/modules') return Promise.resolve(modules);
    if (url.includes('/modules/tenant/')) return Promise.resolve(tenantModules);
    return Promise.resolve([]);
  });
}

describe('Property 8: Toggle de módulo envía solicitud correcta', () => {
  beforeEach(() => { mockGet.mockReset(); mockPost.mockReset(); mockShowToast.mockClear(); });

  it('toggle sends POST with correct payload', async () => {
    const mod = { id: 'mod-1', name: 'Users', description: 'User management', isCore: false };
    setupMocks([mod], [{ moduleId: mod.id, tenantId: 'tenant-1', isActive: true, activatedAt: null, deactivatedAt: null }]);
    mockPost.mockResolvedValue({});

    render(<ModulesPage />);
    await waitFor(() => expect(screen.getByText('Users')).toBeTruthy(), { timeout: 3000 });

    fireEvent.click(screen.getByLabelText('Toggle Users'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        `/modules/${mod.id}/toggle`,
        { moduleId: mod.id, tenantId: 'tenant-1', isActive: false },
      );
    }, { timeout: 3000 });
  });
});

describe('Property 9: Módulos core tienen toggle deshabilitado', () => {
  beforeEach(() => { mockGet.mockReset(); mockPost.mockReset(); mockShowToast.mockClear(); });

  it('core modules have disabled toggle', async () => {
    const mod = { id: 'mod-core', name: 'AuthCore', description: 'Core auth', isCore: true };
    setupMocks([mod], [{ moduleId: mod.id, tenantId: 'tenant-1', isActive: true, activatedAt: null, deactivatedAt: null }]);

    render(<ModulesPage />);
    await waitFor(() => expect(screen.getByText('AuthCore')).toBeTruthy(), { timeout: 3000 });

    const toggle = screen.getByLabelText('Toggle AuthCore') as HTMLInputElement;
    expect(toggle.disabled).toBe(true);
  });
});

describe('Property 10: Toggle fallido revierte al estado anterior', () => {
  beforeEach(() => { mockGet.mockReset(); mockPost.mockReset(); mockShowToast.mockClear(); });

  it('reverts toggle on API error', async () => {
    const mod = { id: 'mod-2', name: 'RoleMgmt', description: 'Role management', isCore: false };
    setupMocks([mod], [{ moduleId: mod.id, tenantId: 'tenant-1', isActive: true, activatedAt: null, deactivatedAt: null }]);
    mockPost.mockRejectedValue(new Error('Server error'));

    render(<ModulesPage />);
    await waitFor(() => expect(screen.getByText('RoleMgmt')).toBeTruthy(), { timeout: 3000 });

    const toggle = screen.getByLabelText('Toggle RoleMgmt') as HTMLInputElement;
    expect(toggle.checked).toBe(true);

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'error');
    }, { timeout: 3000 });

    // Toggle should be back to original state
    const t = screen.getByLabelText('Toggle RoleMgmt') as HTMLInputElement;
    expect(t.checked).toBe(true);
  });
});
