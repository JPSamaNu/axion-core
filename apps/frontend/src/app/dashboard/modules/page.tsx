'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useTenant } from '@/lib/tenant';
import { useToast } from '@/components/ui/Toast';
import { Card, Button, Skeleton } from '@/components/ui';
import type { ModuleDto } from '@axion/types';
import styles from './modules.module.css';

interface ModuleWithStatus extends ModuleDto {
  isActive: boolean;
}

export default function ModulesPage() {
  const { httpClient } = useAuth();
  const { currentTenant } = useTenant();
  const { showToast } = useToast();
  const [modules, setModules] = useState<ModuleWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    if (!currentTenant) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [allModules, activeModulesList] = await Promise.all([
        httpClient.get<ModuleDto[]>('/modules'),
        httpClient.get<ModuleDto[]>(`/modules/tenant/${currentTenant.id}`),
      ]);
      const activeIds = new Set(activeModulesList.map((m) => m.id));
      setModules(allModules.map((m) => ({ ...m, isActive: activeIds.has(m.id) })));
    } catch (err: any) {
      setError(err?.message ?? 'Error al cargar módulos');
    } finally { setLoading(false); }
  }, [httpClient, currentTenant]);

  useEffect(() => { fetchModules(); }, [fetchModules]);

  const handleToggle = async (mod: ModuleWithStatus) => {
    if (mod.isCore || !currentTenant) return;
    const newActive = !mod.isActive;

    // Optimistic update
    setModules((prev) => prev.map((m) => m.id === mod.id ? { ...m, isActive: newActive } : m));
    setToggling(mod.id);

    try {
      await httpClient.post(`/modules/${mod.id}/toggle`, {
        moduleId: mod.id,
        tenantId: currentTenant.id,
        isActive: newActive,
      });
      showToast(`Módulo ${newActive ? 'activado' : 'desactivado'}`, 'success');
    } catch (err: any) {
      // Revert on error
      setModules((prev) => prev.map((m) => m.id === mod.id ? { ...m, isActive: !newActive } : m));
      showToast(err?.message ?? 'Error al cambiar estado del módulo', 'error');
    } finally { setToggling(null); }
  };

  if (loading) {
    return (
      <div>
        <h1 className={styles.title}>Módulos</h1>
        <div className={styles.grid}>
          {[1, 2, 3].map((i) => (
            <Card key={i}><Skeleton width="100%" height="4rem" /></Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) return <p className={styles.errorMsg}>{error} <Button variant="secondary" size="sm" onClick={fetchModules}>Reintentar</Button></p>;

  return (
    <div>
      <h1 className={styles.title}>Módulos</h1>
      <div className={styles.grid}>
        {modules.map((mod) => (
          <Card key={mod.id}>
            <div className={styles.cardHeader}>
              <span className={styles.moduleName}>{mod.name}</span>
              <label className={styles.toggle}>
                <input
                  className={styles.toggleInput}
                  type="checkbox"
                  checked={mod.isActive}
                  disabled={mod.isCore || toggling === mod.id}
                  onChange={() => handleToggle(mod)}
                  aria-label={`Toggle ${mod.name}`}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            <p className={styles.moduleDesc}>{mod.description}</p>
            {mod.isCore && <p className={styles.coreLabel}>Módulo core — no se puede desactivar</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
