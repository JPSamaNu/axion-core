import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import styles from './access-denied.module.css';

export default function AccessDeniedPage() {
  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <h1 className={styles.title}>Acceso Denegado</h1>
        <p className={styles.message}>
          No tienes los permisos necesarios para acceder a esta sección. Si crees que esto es un error, contacta a tu administrador.
        </p>
        <Link href="/dashboard">
          <Button variant="secondary">Volver al Dashboard</Button>
        </Link>
      </Card>
    </div>
  );
}
