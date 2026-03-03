import styles from './Badge.module.css';

type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

const STATUS_MAP: Record<string, BadgeVariant> = {
  active: 'success',
  inactive: 'neutral',
  suspended: 'error',
  global: 'info',
  tenant: 'warning',
};

export function Badge({ variant, children }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[variant]}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const variant = STATUS_MAP[status] ?? 'neutral';
  return <Badge variant={variant}>{status}</Badge>;
}
