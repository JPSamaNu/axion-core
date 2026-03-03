/**
 * Feature: frontend-ui-design
 * Property 5: Modal de edición pre-llenado con datos de la entidad
 * Property 6: Errores de API generan notificación toast
 * Property 7: PermissionGate oculta acciones no autorizadas
 * **Valida: Requisitos 5.4, 5.6, 5.7, 7.4**
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';

// Track toast calls
const mockShowToast = jest.fn();
jest.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
  ToastProvider: ({ children }: any) => <>{children}</>,
}));

// Mock auth
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();
jest.mock('@/lib/auth', () => ({
  useAuth: () => ({
    httpClient: { get: mockGet, post: mockPost, put: mockPut, delete: mockDelete },
  }),
}));

// Configurable permissions
let mockHasPermission = (_r: string, _a: string) => true;
jest.mock('@/lib/permissions', () => ({
  usePermissions: () => ({
    hasPermission: (r: string, a: string) => mockHasPermission(r, a),
    isModuleActive: () => true,
  }),
}));

jest.mock('@/lib/permissions/permission-context', () => ({
  usePermissions: () => ({
    hasPermission: (r: string, a: string) => mockHasPermission(r, a),
    isModuleActive: () => true,
  }),
}));

import UsersPage from '../page';

const userArb = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  firstName: fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0 && !/[<>]/.test(s)),
  lastName: fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0 && !/[<>]/.test(s)),
  tenantId: fc.uuid(),
  status: fc.constantFrom('active', 'inactive', 'suspended'),
  roles: fc.constant([]),
});

describe('Property 5: Modal de edición pre-llenado con datos de la entidad', () => {
  beforeEach(() => {
    mockShowToast.mockClear();
    mockHasPermission = () => true;
  });

  it('edit modal is pre-filled with user data', async () => {
    await fc.assert(
      fc.asyncProperty(
        userArb,
        async (user) => {
          mockGet.mockResolvedValue([user]);
          const { unmount } = render(<UsersPage />);

          await waitFor(() => {
            expect(screen.getByText(user.email)).toBeTruthy();
          });

          // Click edit button
          const editBtn = screen.getByText('Editar');
          fireEvent.click(editBtn);

          // Check modal fields are pre-filled
          await waitFor(() => {
            const inputs = document.querySelectorAll('input');
            const firstNameInput = Array.from(inputs).find((i) => (i as HTMLInputElement).value === user.firstName);
            const lastNameInput = Array.from(inputs).find((i) => (i as HTMLInputElement).value === user.lastName);
            expect(firstNameInput).toBeTruthy();
            expect(lastNameInput).toBeTruthy();
          });

          unmount();
        },
      ),
      { numRuns: 20 },
    );
  });
});

describe('Property 6: Errores de API generan notificación toast', () => {
  beforeEach(() => {
    mockShowToast.mockClear();
    mockHasPermission = () => true;
  });

  it('API error on create shows error toast', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        async (errorMsg) => {
          mockGet.mockResolvedValue([]);
          mockPost.mockRejectedValue(new Error(errorMsg));
          mockShowToast.mockClear();

          const { unmount } = render(<UsersPage />);
          await waitFor(() => expect(mockGet).toHaveBeenCalled());

          // Open create modal
          fireEvent.click(screen.getByText('Crear usuario'));

          // Fill and submit
          const inputs = document.querySelectorAll('input');
          fireEvent.change(inputs[0], { target: { value: 'test@test.com' } });
          fireEvent.change(inputs[1], { target: { value: 'pass123' } });
          fireEvent.change(inputs[2], { target: { value: 'John' } });
          fireEvent.change(inputs[3], { target: { value: 'Doe' } });

          const createBtn = screen.getAllByText('Crear').find((el) => el.tagName === 'BUTTON' && el.closest('[role="dialog"]'));
          if (createBtn) fireEvent.click(createBtn);

          await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(errorMsg, 'error');
          });

          unmount();
        },
      ),
      { numRuns: 20 },
    );
  });
});

describe('Property 7: PermissionGate oculta acciones no autorizadas', () => {
  it('hides create button when user lacks create permission', async () => {
    mockHasPermission = (resource: string, action: string) => {
      if (resource === 'users' && action === 'create') return false;
      return true;
    };
    mockGet.mockResolvedValue([]);

    const { unmount } = render(<UsersPage />);
    await waitFor(() => expect(mockGet).toHaveBeenCalled());

    expect(screen.queryByText('Crear usuario')).toBeNull();
    unmount();
  });

  it('shows create button when user has create permission', async () => {
    mockHasPermission = () => true;
    mockGet.mockResolvedValue([]);

    const { unmount } = render(<UsersPage />);
    await waitFor(() => expect(mockGet).toHaveBeenCalled());

    expect(screen.getByText('Crear usuario')).toBeTruthy();
    unmount();
  });
});
