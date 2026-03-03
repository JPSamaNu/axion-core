import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string;
  height?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export function Skeleton({ width, height, variant = 'text' }: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${styles[variant]}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
