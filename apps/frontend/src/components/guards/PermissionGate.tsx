'use client';

import React from 'react';
import { Action } from '@axion/types';
import { usePermissions } from '@/lib/permissions/permission-context';

interface PermissionGateProps {
  resource: string;
  action: Action;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ resource, action, children, fallback = null }: PermissionGateProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
