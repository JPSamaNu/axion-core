'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/ui/Toast';
import { HttpError } from '@/lib/api/http-client';
import { Input, Button } from '@/components/ui';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'El email es requerido';
    if (!password.trim()) e.password = 'La contraseña es requerida';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function getErrorMessage(err: unknown): string {
    if (err instanceof HttpError) {
      if (err.status === 401) return 'Credenciales inválidas';
      if (err.status === 403) return 'Acceso denegado';
      if (err.status >= 500) return 'Error del servidor. Intenta más tarde';
      return err.message || 'Error al iniciar sesión';
    }
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      return 'No se pudo conectar con el servidor';
    }
    if (err instanceof Error) return err.message;
    return 'Error al iniciar sesión';
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      showToast('Sesión iniciada correctamente', 'success');
      // Use window.location for reliable navigation after state update
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setServerError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoText}>Axion Core</div>
          <p className={styles.subtitle}>Inicia sesión en tu cuenta</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {serverError && <div className={styles.error}>{serverError}</div>}

          <Input
            label="Email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
          />

          <Button type="submit" loading={loading} style={{ width: '100%', marginTop: 'var(--space-sm)' }}>
            Iniciar sesión
          </Button>
        </form>
      </div>
    </div>
  );
}
