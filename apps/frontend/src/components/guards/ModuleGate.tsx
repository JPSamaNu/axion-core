'use client';

import React from 'react';
import { usePermissions } from '@/lib/permissions/permission-context';

interface ModuleGateProps {
  moduleId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ModuleGate({ moduleId, children, fallback = null }: ModuleGateProps) {
  const { isModuleActive } = usePermissions();

  if (!isModuleActive(moduleId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
