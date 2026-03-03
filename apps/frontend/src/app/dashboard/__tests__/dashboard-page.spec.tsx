/**
 * Unit tests for Dashboard page
 * **Valida: Requisitos 4.1, 4.2, 4.3**
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Create stable mock references outside mock factory
const mockGet = jest.fn();
const stableHttpClient = { get: mockGet };
const stableTenant = { id: 'tenant-1', name: 'Test', slug: 'test', status: 'active' };

jest.mock('@/lib/auth', () => ({
  useAuth: () => ({ httpClient: stableHttpClient }),
}));

jest.mock('@/lib/tenant', () => ({
  useTenant: () => ({ currentTenant: stableTenant }),
}));

import DashboardPage from '../page';

describe('Dashboard page unit tests', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('renders cards with data after loading', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === '/users') return Promise.resolve([{ id: '1' }, { id: '2' }, { id: '3' }]);
      if (url === '/roles') return Promise.resolve([{ id: '1' }, { id: '2' }]);
      if (url.includes('/modules/tenant/')) return Promise.resolve([{ isActive: true }, { isActive: false }]);
      return Promise.resolve([]);
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('usuarios registrados')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('shows skeletons during loading', () => {
    mockGet.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<DashboardPage />);
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error with retry button on failure', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Reintentar')).toBeTruthy();
    }, { timeout: 3000 });
  });
});
