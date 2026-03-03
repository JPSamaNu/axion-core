'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import styles from './Toast.module.css';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children, duration = 4000 }: { children: React.ReactNode; duration?: number }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    const id = String(++counter.current);
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.container}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} duration={duration} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, duration, onDismiss }: { toast: ToastItem; duration: number; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  return (
    <div className={`${styles.toast} ${styles[toast.variant]}`} role="alert">
      <span className={styles.message}>{toast.message}</span>
      <button className={styles.dismiss} onClick={() => onDismiss(toast.id)} aria-label="Cerrar">×</button>
    </div>
  );
}
