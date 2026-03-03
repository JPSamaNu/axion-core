'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import { DataTable, Button, Input, Select, Modal, Badge } from '@/components/ui';
import { PermissionGate } from '@/components/guards';
import { Action, RoleScope } from '@axion/types';
import type { UserDto, RoleDto } from '@axion/types';
import styles from './roles.module.css';

interface PermissionItem {
  id: string;
  resource: string;
  action: string;
  scope: string;
  description: string;
}

type ModalMode = null | 'create' | 'edit' | 'delete' | 'permissions' | 'assign';

export default function RolesPage() {
  const { httpClient } = useAuth();
  const { showToast } = useToast();
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<RoleDto | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({ name: '', description: '', scope: RoleScope.TENANT });
  const [selectedPermIds, setSelectedPermIds] = useState<Set<string>>(new Set());
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [r, u, p] = await Promise.all([
        httpClient.get<RoleDto[]>('/roles'),
        httpClient.get<UserDto[]>('/users'),
        httpClient.get<PermissionItem[]>('/roles/system/permissions'),
      ]);
      setRoles(r);
      setUsers(u);
      setAllPermissions(p);
    } catch (err: any) {
      setError(err?.message ?? 'Error al cargar roles');
    } finally { setLoading(false); }
  }, [httpClient]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setForm({ name: '', description: '', scope: RoleScope.TENANT });
    setModalMode('create');
  };

  const openEdit = (role: RoleDto) => {
    setSelected(role);
    setForm({ name: role.name, description: '', scope: role.scope as RoleScope });
    setModalMode('edit');
  };

  const openDelete = (role: RoleDto) => {
    setSelected(role);
    setModalMode('delete');
  };

  const openPermissions = async (role: RoleDto) => {
    setSelected(role);
    try {
      const permIds = await httpClient.get<string[]>(`/roles/${role.id}/permissions`);
      setSelectedPermIds(new Set(permIds));
    } catch {
      setSelectedPermIds(new Set());
    }
    setModalMode('permissions');
  };

  const openAssign = () => {
    setSelectedRoleId(roles[0]?.id ?? '');
    setSelectedUserId(users[0]?.id ?? '');
    setModalMode('assign');
  };

  const closeModal = () => { setModalMode(null); setSelected(null); };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await httpClient.post('/roles', { name: form.name, description: form.description, scope: form.scope });
      showToast('Rol creado correctamente', 'success');
      closeModal();
      fetchData();
    } catch (err: any) {
      showToast(err?.message ?? 'Error al crear rol', 'error');
    } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await httpClient.put(`/roles/${selected.id}`, { name: form.name, description: form.description });
      showToast('Rol actualizado correctamente', 'success');
      closeModal();
      fetchData();
    } catch (err: any) {
      showToast(err?.message ?? 'Error al actualizar rol', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await httpClient.delete(`/roles/${selected.id}`);
      showToast('Rol eliminado correctamente', 'success');
      closeModal();
      fetchData();
    } catch (err: any) {
      showToast(err?.message ?? 'Error al eliminar rol', 'error');
    } finally { setSaving(false); }
  };

  const handleSavePermissions = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await httpClient.post(`/roles/${selected.id}/permissions`, { permissionIds: Array.from(selectedPermIds) });
      showToast('Permisos actualizados correctamente', 'success');
      closeModal();
      fetchData();
    } catch (err: any) {
      showToast(err?.message ?? 'Error al actualizar permisos', 'error');
    } finally { setSaving(false); }
  };

  const handleAssign = async () => {
    setSaving(true);
    try {
      await httpClient.post(`/roles/${selectedRoleId}/assign`, { userId: selectedUserId, roleId: selectedRoleId });
      showToast('Rol asignado correctamente', 'success');
      closeModal();
      fetchData();
    } catch (err: any) {
      showToast(err?.message ?? 'Error al asignar rol', 'error');
    } finally { setSaving(false); }
  };

  const togglePermission = (permId: string) => {
    setSelectedPermIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const scopeVariant = (scope: string) => scope === 'global' ? 'warning' as const : 'info' as const;

  const columns = [
    { key: 'name', header: 'Nombre' },
    { key: 'scope', header: 'Alcance', render: (r: RoleDto) => <Badge variant={scopeVariant(r.scope)}>{r.scope === 'global' ? 'Global' : 'Tenant'}</Badge> },
    { key: 'permissions', header: 'Permisos', render: (r: RoleDto) => String(r.permissions.length) },
  ];

  if (error) return <p className={styles.errorMsg}>{error} <Button variant="secondary" size="sm" onClick={fetchData}>Reintentar</Button></p>;

  // Group permissions by resource for the permissions modal
  const permissionsByResource = allPermissions.reduce<Record<string, PermissionItem[]>>((acc, p) => {
    if (!acc[p.resource]) acc[p.resource] = [];
    acc[p.resource].push(p);
    return acc;
  }, {});

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Roles</h1>
        <div className={styles.footerActions}>
          <Button variant="secondary" onClick={openAssign}>Asignar rol</Button>
          <PermissionGate resource="roles" action={Action.CREATE}>
            <Button onClick={openCreate}>Crear rol</Button>
          </PermissionGate>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={roles}
        actions={(r) => (
          <div className={styles.footerActions}>
            <Button variant="ghost" size="sm" onClick={() => openPermissions(r)}>Permisos</Button>
            <PermissionGate resource="roles" action={Action.UPDATE}>
              <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Editar</Button>
            </PermissionGate>
            <PermissionGate resource="roles" action={Action.DELETE}>
              <Button variant="danger" size="sm" onClick={() => openDelete(r)}>Eliminar</Button>
            </PermissionGate>
          </div>
        )}
      />

      {/* Create Modal */}
      <Modal isOpen={modalMode === 'create'} onClose={closeModal} title="Crear rol" footer={
        <div className={styles.footerActions}>
          <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
          <Button loading={saving} onClick={handleCreate}>Crear</Button>
        </div>
      }>
        <div className={styles.formGrid}>
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Select label="Alcance" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value as RoleScope })} options={[
            { value: RoleScope.TENANT, label: 'Tenant' },
            { value: RoleScope.GLOBAL, label: 'Global' },
          ]} />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={modalMode === 'edit'} onClose={closeModal} title="Editar rol" footer={
        <div className={styles.footerActions}>
          <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
          <Button loading={saving} onClick={handleEdit}>Guardar</Button>
        </div>
      }>
        <div className={styles.formGrid}>
          <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={modalMode === 'delete'} onClose={closeModal} title="Eliminar rol" footer={
        <div className={styles.footerActions}>
          <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}>Eliminar</Button>
        </div>
      }>
        <p className={styles.confirmText}>¿Estás seguro de que deseas eliminar el rol &quot;{selected?.name}&quot;? Esta acción no se puede deshacer.</p>
      </Modal>

      {/* Permissions Modal */}
      <Modal isOpen={modalMode === 'permissions'} onClose={closeModal} title={`Permisos — ${selected?.name ?? ''}`} footer={
        <div className={styles.footerActions}>
          <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
          <PermissionGate resource="roles" action={Action.UPDATE} fallback={null}>
            <Button loading={saving} onClick={handleSavePermissions}>Guardar permisos</Button>
          </PermissionGate>
        </div>
      }>
        <div className={styles.permissionsGrid}>
          {Object.entries(permissionsByResource).map(([resource, perms]) => (
            <div key={resource} className={styles.permGroup}>
              <h3 className={styles.permResource}>{resource}</h3>
              <div className={styles.permActions}>
                {perms.map((p) => (
                  <label key={p.id} className={styles.permLabel}>
                    <input
                      type="checkbox"
                      checked={selectedPermIds.has(p.id)}
                      onChange={() => togglePermission(p.id)}
                    />
                    <span>{p.action}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Assign Role Modal */}
      <Modal isOpen={modalMode === 'assign'} onClose={closeModal} title="Asignar rol a usuario" footer={
        <div className={styles.footerActions}>
          <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
          <Button loading={saving} onClick={handleAssign}>Asignar</Button>
        </div>
      }>
        <div className={styles.formGrid}>
          <Select
            label="Usuario"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            options={users.map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName} (${u.email})` }))}
          />
          <Select
            label="Rol"
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
          />
        </div>
      </Modal>
    </div>
  );
}
