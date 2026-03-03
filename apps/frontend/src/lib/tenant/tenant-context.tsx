'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { TenantDto } from '@axion/types';

interface TenantContextValue {
  currentTenant: TenantDto | null;
  availableTenants: TenantDto[];
  setCurrentTenant: (tenant: TenantDto) => void;
  setAvailableTenants: (tenants: TenantDto[]) => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

interface TenantProviderProps {
  children: React.ReactNode;
  initialTenant?: TenantDto | null;
}

export function TenantProvider({ children, initialTenant = null }: TenantProviderProps) {
  const [currentTenant, setCurrentTenantState] = useState<TenantDto | null>(initialTenant);
  const [availableTenants, setAvailableTenants] = useState<TenantDto[]>([]);

  const setCurrentTenant = useCallback((tenant: TenantDto) => {
    setCurrentTenantState(tenant);
  }, []);

  const value = useMemo<TenantContextValue>(
    () => ({ currentTenant, availableTenants, setCurrentTenant, setAvailableTenants }),
    [currentTenant, availableTenants, setCurrentTenant],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}
