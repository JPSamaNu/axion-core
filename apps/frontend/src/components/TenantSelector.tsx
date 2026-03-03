'use client';

import React from 'react';
import { useTenant } from '@/lib/tenant';
import type { TenantDto } from '@axion/types';

export function TenantSelector() {
  const { currentTenant, availableTenants, setCurrentTenant } = useTenant();

  if (availableTenants.length <= 1) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = availableTenants.find((t) => t.id === e.target.value);
    if (selected) {
      setCurrentTenant(selected);
    }
  };

  return (
    <label>
      Tenant:
      <select
        value={currentTenant?.id ?? ''}
        onChange={handleChange}
        aria-label="Seleccionar tenant"
      >
        {availableTenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
    </label>
  );
}
