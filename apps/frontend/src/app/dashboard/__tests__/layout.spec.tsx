/**
 * Feature: frontend-ui-design
 * Property 2: Ruta activa resaltada en sidebar
 * Property 3: Módulos inactivos ocultos en navegación
 * **Valida: Requisitos 3.5, 3.6**
 */
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';

// Mock next/navigation
let mockPathname = '/dashboard';
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, className, onClick }: any) => (
    <a href={href} className={className} onClick={onClick} data-href={href}>{children}</a>
  );
});

// Mock auth context
const mockLogout = jest.fn();
jest.mock('@/lib/auth', () => ({
  useAuth: () => ({
    user: { firstName: 'Test', lastName: 'User' },
    logout: mockLogout,
    httpClient: {},
  }),
}));

// Mock tenant context
jest.mock('@/lib/tenant', () => ({
  useTenant: () => ({
    currentTenant: { id: '1', name: 'Test Tenant', slug: 'test', status: 'active' },
    availableTenants: [],
    setCurrentTenant: jest.fn(),
    setAvailableTenants: jest.fn(),
  }),
}));

// Mock permissions context with configurable active modules
let mockActiveModules: string[] = [];
jest.mock('@/lib/permissions', () => ({
  usePermissions: () => ({
    permissions: [],
    activeModules: [],
    hasPermission: () => true,
    isModuleActive: (moduleId: string) => mockActiveModules.includes(moduleId),
  }),
}));

// Mock TenantSelector
jest.mock('@/components/TenantSelector', () => ({
  TenantSelector: () => <span data-testid="tenant-selector">TenantSelector</span>,
}));

import DashboardLayout from '../layout';

const ALL_ROUTES = ['/dashboard', '/dashboard/users', '/dashboard/roles', '/dashboard/tenants', '/dashboard/modules'];
const MODULE_ROUTES: Record<string, string> = {
  '/dashboard/users': 'users',
  '/dashboard/roles': 'roles',
  '/dashboard/tenants': 'tenants',
  '/dashboard/modules': 'module-management',
};

describe('Property 2: Ruta activa resaltada en sidebar', () => {
  beforeEach(() => {
    mockActiveModules = ['users', 'roles', 'tenants', 'module-management'];
  });

  it('exactly one nav link has active class for any valid route', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_ROUTES),
        (route) => {
          mockPathname = route;
          const { container, unmount } = render(
            <DashboardLayout><div>content</div></DashboardLayout>,
          );

          const activeLinks = container.querySelectorAll('[class*="navLinkActive"]');
          expect(activeLinks.length).toBe(1);

          const activeLink = activeLinks[0] as HTMLAnchorElement;
          expect(activeLink.getAttribute('data-href') || activeLink.getAttribute('href')).toBe(route);

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('Property 3: Módulos inactivos ocultos en navegación', () => {
  it('only shows nav links for active modules', () => {
    const allModules = ['users', 'roles', 'tenants', 'module-management'];

    fc.assert(
      fc.property(
        fc.subarray(allModules),
        (activeModules) => {
          mockPathname = '/dashboard';
          mockActiveModules = activeModules;

          const { container, unmount } = render(
            <DashboardLayout><div>content</div></DashboardLayout>,
          );

          const navLinks = container.querySelectorAll('nav a');
          // Dashboard link is always shown (no module required)
          const expectedCount = 1 + activeModules.length;
          expect(navLinks.length).toBe(expectedCount);

          // Verify each module-dependent link is only shown if its module is active
          navLinks.forEach((link) => {
            const href = link.getAttribute('data-href') || link.getAttribute('href') || '';
            const requiredModule = MODULE_ROUTES[href];
            if (requiredModule) {
              expect(activeModules).toContain(requiredModule);
            }
          });

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });
});
