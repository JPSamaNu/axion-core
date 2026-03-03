/**
 * Unit tests for Tenants page
 * **Valida: Requisitos 7.1, 7.3**
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
const mockPut = jest.fn();
jest.mock('@/lib/auth', () => ({
  useAuth: () => ({
    httpClient: { get: mockGet, post: mockPost, put: mockPut },
  }),
}));

import TenantsPage from '../page';

const mockTenants = [
  { id: 't1', name: 'Acme Corp', slug: 'acme', status: 'active' },
  { id: 't2', name: 'Beta Inc', slug: 'beta', status: 'inactive' },
];

describe('Tenants page unit tests', () => {
  beforeEach(() => {
    mockGet.mockResolvedValue(mockTenants);
    mockPost.mockResolvedValue({});
    mockShowToast.mockClear();
  });

  it('renders table of tenants', async () => {
    render(<TenantsPage />);
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeTruthy();
      expect(screen.getByText('Beta Inc')).toBeTruthy();
    });
  });

  it('create modal sends correct request', async () => {
    render(<TenantsPage />);
    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeTruthy());

    fireEvent.click(screen.getByText('Crear tenant'));

    // Fill form in modal
    const inputs = document.querySelectorAll('[role="dialog"] input');
    fireEvent.change(inputs[0], { target: { value: 'New Tenant' } });
    fireEvent.change(inputs[1], { target: { value: 'new-tenant' } });

    // Click create in modal
    const createBtns = screen.getAllByText('Crear');
    const modalBtn = createBtns.find((el) => el.closest('[role="dialog"]'));
    if (modalBtn) fireEvent.click(modalBtn);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/tenants', { name: 'New Tenant', slug: 'new-tenant' });
    });
  });
});
