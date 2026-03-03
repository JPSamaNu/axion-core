'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useTenant } from '@/lib/tenant';
import { Card, Skeleton, Button } from '@/components/ui';
import styles from './dashboard.module.css';

interface DashboardStats {
  users: number;
  roles: number;
  activeModules: number;
}

export default function DashboardPage() {
  const { httpClient } = useAuth();
  const { currentTenant } = useTenant();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [users, roles, modules] = await Promise.all([
        httpClient.get<any[]>('/users').catch(() => []),
        httpClient.get<any[]>('/roles').catch(() => []),
        currentTenant
          ? httpClient.get<any[]>(`/modules/tenant/${currentTenant.id}`).catch(() => [])
          : Promise.resolve([]),
      ]);
      const usersArr = Array.isArray(users) ? users : [];
      const rolesArr = Array.isArray(roles) ? roles : [];
      const modulesArr = Array.isArray(modules) ? modules : [];
      setStats({
        users: usersArr.length,
        roles: rolesArr.length,
        activeModules: modulesArr.filter((m: any) => m.isActive).length,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar datos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [httpClient, currentTenant]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div>
      <h1 className={styles.title}>Dashboard</h1>
      <div className={styles.grid}>
        {loading ? (
          <>
            <Card><Skeleton width="100%" height="3rem" /><Skeleton width="60%" height="1rem" /></Card>
            <Card><Skeleton width="100%" height="3rem" /><Skeleton width="60%" height="1rem" /></Card>
            <Card><Skeleton width="100%" height="3rem" /><Skeleton width="60%" height="1rem" /></Card>
          </>
        ) : error ? (
          <Card className={styles.errorCard}>
            <p className={styles.errorMsg}>{error}</p>
            <Button variant="secondary" onClick={fetchStats}>Reintentar</Button>
          </Card>
        ) : (
          <>
            <Card title="Usuarios">
              <div className={styles.statValue}>{stats?.users ?? 0}</div>
              <div className={styles.statLabel}>usuarios registrados</div>
            </Card>
            <Card title="Roles">
              <div className={styles.statValue}>{stats?.roles ?? 0}</div>
              <div className={styles.statLabel}>roles configurados</div>
            </Card>
            <Card title="Módulos Activos">
              <div className={styles.statValue}>{stats?.activeModules ?? 0}</div>
              <div className={styles.statLabel}>módulos habilitados</div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
