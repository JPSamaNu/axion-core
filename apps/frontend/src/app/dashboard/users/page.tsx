'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import { DataTable, Button, Input, Select, Modal, Badge, StatusBadge } from '@/components/ui';
import { PermissionGate } from '@/components/guards';
import { Action } from '@axion/types';
import type { UserDto, CreateUserRequest, UpdateUserRequest } from '@axion/types';
import styles from './users.module.css';

type ModalMode = null | 'create' | 'edit' | 'delete';

export default function UsersPage() {
  const { httpClient } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<UserDto | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', status: 'active' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await httpClient.get<UserDto[]>('/users');
      setUsers(data);
    } catch (err: any) {
      setError(err?.message ?? 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [httpClient]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => {
    setForm({ email: '', password: '', firstName: '', lastName: '', status: 'active' });
    setModalMode('create');
  };

  const openEdit = (user: UserDto) => {
    setSelected(user);
    setForm({ email: user.email, password: '', firstName: user.firstName, lastName: user.lastName, status: user.status });
    setModalMode('edit');
  };

  const openDelete = (user: UserDto) => {
    setSelected(user);
    setModalMode('delete');
  };

  const closeModal = () => { setModalMode(null); setSelected(null); };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const body: CreateUserRequest = { email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName };
      await httpClient.post('/users', body);
      showToast('Usuario creado correctamente', 'success');
      closeModal();
      fetchUsers();
    } catch (err: any) {
      showToast(err?.message ?? 'Error al crear usuario', 'error');
    } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const body: UpdateUserRequest = { firstName: form.firstName, lastName: form.lastName, status: form.status };
      await httpClient.put(`/users/${selected.id}`, body);
      showToast('Usuario actualizado correctamente', 'success');
      closeModal();
      fetchUsers();
    } catch (err: any) {
      showToast(err?.message ?? 'Error al actualizar usuario', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await httpClient.delete(`/users/${selected.id}`);
      showToast('Usuario eliminado correctamente', 'success');
      closeModal();
      fetchUsers();
    } catch (err: any) {
      showToast(err?.message ?? 'Error al eliminar usuario', 'error');
    } finally { setSaving(false); }
  };

  const columns = [
    { key: 'email', header: 'Email' },
    { key: 'name', header: 'Nombre', render: (u: UserDto) => `${u.firstName} ${u.lastName}` },
    { key: 'status', header: 'Estado', render: (u: UserDto) => <StatusBadge status={u.status} /> },
    {
      key: 'roles', header: 'Roles', render: (u: UserDto) => (
        <div className={styles.roles}>
          {u.roles.map((r) => <Badge key={r.id} variant="info">{r.name}</Badge>)}
        </div>
      ),
    },
  ];

  if (error) return <p className={styles.errorMsg}>{error} <Button variant="secondary" size="sm" onClick={fetchUsers}>Reintentar</Button></p>;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Usuarios</h1>
        <PermissionGate resource="users" action={Action.CREATE}>
          <Button onClick={openCreate}>Crear usuario</Button>
        </PermissionGate>
      </div>

      <DataTable
        columns={columns}
        data={users}
        actions={(u) => (
          <div className={styles.footerActions}>
            <PermissionGate resource="users" action={Action.UPDATE}>
              <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>Editar</Button>
            </PermissionGate>
            <PermissionGate resource="users" action={Action.DELETE}>
              <Button variant="danger" size="sm" onClick={() => openDelete(u)}>Eliminar</Button>
            </PermissionGate>
          </div>
        )}
      />

      {/* Create Modal */}
      <Modal isOpen={modalMode === 'create'} onClose={closeModal} title="Crear usuario" footer={
        <div className={styles.footerActions}>
          <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
          <Button loading={saving} onClick={handleCreate}>Crear</Button>
        </div>
      }>
        <div className={styles.formGrid}>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Contraseña" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Input label="Nombre" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <Input label="Apellido" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={modalMode === 'edit'} onClose={closeModal} title="Editar usuario" footer={
        <div className={styles.footerActions}>
          <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
          <Button loading={saving} onClick={handleEdit}>Guardar</Button>
        </div>
      }>
        <div className={styles.formGrid}>
          <Input label="Nombre" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <Input label="Apellido" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[
            { value: 'active', label: 'Activo' },
            { value: 'inactive', label: 'Inactivo' },
            { value: 'suspended', label: 'Suspendido' },
          ]} />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={modalMode === 'delete'} onClose={closeModal} title="Eliminar usuario" footer={
        <div className={styles.footerActions}>
          <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}>Eliminar</Button>
        </div>
      }>
        <p className={styles.confirmText}>¿Estás seguro de que deseas eliminar a {selected?.firstName} {selected?.lastName}? Esta acción no se puede deshacer.</p>
      </Modal>
    </div>
  );
}
