'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';
import { TenantProvider, useTenant } from '@/lib/tenant';
import { PermissionProvider } from '@/lib/permissions';
import { ThemeProvider } from '@/lib/theme';
import { ToastProvider } from '@/components/ui/Toast';
import type { PermissionDto, ModuleDto, TenantDto } from '@axion/types';

function PermissionAndTenantLoader({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, httpClient } = useAuth();
  const { setCurrentTenant } = useTenant();
  const [permissions, setPermissions] = useState<PermissionDto[]>([]);
  const [activeModules, setActiveModules] = useState<ModuleDto[]>([]);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) {
      setPermissions([]);
      setActiveModules([]);
      return;
    }
    try {
      const data = await httpClient.get<{
        permissions: PermissionDto[];
        activeModules: ModuleDto[];
        tenantId: string;
      }>('/auth/me');
      setPermissions(data.permissions ?? []);
      setActiveModules(data.activeModules ?? []);

      // Auto-load tenant info
      if (data.tenantId) {
        try {
          const tenant = await httpClient.get<TenantDto>(`/tenants/${data.tenantId}`);
          setCurrentTenant(tenant);
        } catch {
          // Tenant fetch failed, not critical
        }
      }
    } catch {
      // Silently fail
    }
  }, [isAuthenticated, httpClient, setCurrentTenant]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <PermissionProvider permissions={permissions} activeModules={activeModules}>
      {children}
    </PermissionProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('axion_tenant_id');
    if (stored) setTenantId(stored);
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider apiBaseUrl={apiBaseUrl} tenantId={tenantId}>
        <TenantProvider>
          <PermissionAndTenantLoader>
            <ToastProvider>{children}</ToastProvider>
          </PermissionAndTenantLoader>
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
