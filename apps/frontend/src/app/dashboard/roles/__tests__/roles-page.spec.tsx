/**
 * Unit tests for Roles page
 * **Valida: Requisitos 6.1, 6.3**
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockShowToast = jest.fn();
jest.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
  ToastProvider: ({ children }: any) => <>{children}</>,
}));

const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock('@/lib/auth', () => ({
  useAuth: () => ({
    httpClient: { get: mockGet, post: mockPost },
  }),
}));

import RolesPage from '../page';

const mockRoles = [
  { id: 'r1', name: 'Admin', scope: 'global', permissions: [{ resource: 'users', action: 'create', scope: 'global' }] },
  { id: 'r2', name: 'Viewer', scope: 'tenant', permissions: [] },
];

const mockUsers = [
  { id: 'u1', email: 'admin@test.com', firstName: 'Admin', lastName: 'User', tenantId: 't1', status: 'active', roles: [] },
];

describe('Roles page unit tests', () => {
  beforeEach(() => {
    mockGet.mockImplementation((url: string) => {
      if (url === '/roles') return Promise.resolve(mockRoles);
      if (url === '/users') return Promise.resolve(mockUsers);
      return Promise.resolve([]);
    });
    mockPost.mockResolvedValue({});
    mockShowToast.mockClear();
  });

  it('renders table of roles', async () => {
    render(<RolesPage />);
    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeTruthy();
      expect(screen.getByText('Viewer')).toBeTruthy();
    });
  });

  it('assign modal sends correct request', async () => {
    render(<RolesPage />);
    await waitFor(() => expect(screen.getByText('Admin')).toBeTruthy());

    fireEvent.click(screen.getByText('Asignar rol'));

    await waitFor(() => {
      expect(screen.getByText('Asignar rol a usuario')).toBeTruthy();
    });

    // Click assign button in modal
    const assignBtns = screen.getAllByText('Asignar');
    const modalAssignBtn = assignBtns.find((el) => el.closest('[role="dialog"]'));
    if (modalAssignBtn) fireEvent.click(modalAssignBtn);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('/roles/'),
        expect.objectContaining({ userId: expect.any(String), roleId: expect.any(String) }),
      );
    });
  });
});
