'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import { DataTable, Button, Input, Select, Modal, StatusBadge } from '@/components/ui';
import type { TenantDto, CreateTenantRequest, UpdateTenantRequest } from '@axion/types';
import styles from './tenants.module.css';

type ModalMode = null | 'create' | 'edit';

export default function TenantsPage() {
  const { httpClient } = useAuth();
  const { showToast } = useToast();
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<TenantDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', status: 'active' });

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await httpClient.get<TenantDto[]>('/tenants');
      setTenants(data);
    } catch (err: any) {
      setError(err?.message ?? 'Error al cargar tenants');
    } finally { setLoading(false); }
  }, [httpClient]);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const openCreate = () => {
    setForm({ name: '', slug: '', status: 'active' });
    setModalMode('create');
  };

  const openEdit = (t: TenantDto) => {
    setSelected(t);
    setForm({ name: t.name, slug: t.slug, status: t.status });
    setModalMode('edit');
  };

  const closeModal = () => { setModalMode(null); setSelected(null); };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const body: CreateTenantRequest = { name: form.name, slug: form.slug };
      await httpClient.post('/tenants', body);
      showToast('Tenant creado correctamente', 'success');
      closeModal();
      fetchTenants();
    } catch (err: any) {
      showToast(err?.message ?? 'Error al crear tenant', 'error');
    } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const body: UpdateTenantRequest = { name: form.name, status: form.status as any };
      await httpClient.put(`/tenants/${selected.id}`, body);
      showToast('Tenant actualizado correctamente', 'success');
      closeModal();
      fetchTenants();
    } catch (err: any) {
      showToast(err?.message ?? 'Error al actualizar tenant', 'error');
    } finally { setSaving(false); }
  };

  const columns = [
    { key: 'name', header: 'Nombre' },
    { key: 'slug', header: 'Slug' },
    { key: 'status', header: 'Estado', render: (t: TenantDto) => <StatusBadge status={t.status} /> },
  ];

  if (error) return <p className={styles.errorMsg}>{error} <Button variant="secondary" size="sm" onClick={fetchTenants}>Reintentar</Button></p>;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Tenants</h1>
        <Button onClick={openCreate}>Crear tenant</Button>
      </div>

      <DataTable
        columns={columns}
        data={tenants}
        actions={(t) => (
          <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>Editar</Button>
        )}
      />

      {/* Create Modal */}
      <Modal isOpen={modalMode === 'create'} onClose={closeModal} title="Crear tenant" footer={
        <div className={styles.footerActions}>
          <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
          <Button loading={saving} onClick={handleCreate}>Crear</Button>
        </div>
      }>
        <div className={styles.formGrid}>
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={modalMode === 'edit'} onClose={closeModal} title="Editar tenant" footer={
        <div className={styles.footerActions}>
          <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
          <Button loading={saving} onClick={handleEdit}>Guardar</Button>
        </div>
      }>
        <div className={styles.formGrid}>
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[
            { value: 'active', label: 'Activo' },
            { value: 'inactive', label: 'Inactivo' },
          ]} />
        </div>
      </Modal>
    </div>
  );
}
