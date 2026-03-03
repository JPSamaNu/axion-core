'use client';

import React, { createContext, useContext, useMemo } from 'react';
import type { PermissionDto, ModuleDto } from '@axion/types';
import { Action } from '@axion/types';

interface PermissionContextValue {
  permissions: PermissionDto[];
  activeModules: ModuleDto[];
  hasPermission: (resource: string, action: Action) => boolean;
  isModuleActive: (moduleId: string) => boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function usePermissions(): PermissionContextValue {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}

interface PermissionProviderProps {
  children: React.ReactNode;
  permissions: PermissionDto[];
  activeModules: ModuleDto[];
}

export function PermissionProvider({ children, permissions, activeModules }: PermissionProviderProps) {
  const value = useMemo<PermissionContextValue>(() => {
    const permissionSet = new Set(
      permissions.map((p) => `${p.resource}:${p.action}`),
    );
    const moduleIdSet = new Set(activeModules.map((m) => m.id));
    const moduleNameSet = new Set(activeModules.map((m) => m.name));

    return {
      permissions,
      activeModules,
      hasPermission: (resource: string, action: Action) =>
        permissionSet.has(`${resource}:${action}`),
      isModuleActive: (moduleId: string) =>
        moduleIdSet.has(moduleId) || moduleNameSet.has(moduleId),
    };
  }, [permissions, activeModules]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}
