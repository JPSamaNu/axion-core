import React, { useId } from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id: externalId, ...props }, ref) => {
    const autoId = useId();
    const id = externalId ?? autoId;
    const errorId = `${id}-error`;

    return (
      <div className={styles.field}>
        {label && <label htmlFor={id} className={styles.label}>{label}</label>}
        <input
          ref={ref}
          id={id}
          className={`${styles.input} ${error ? styles.inputError : ''} ${className ?? ''}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        {error && <span id={errorId} className={styles.error} role="alert">{error}</span>}
      </div>
    );
  },
);

Input.displayName = 'Input';
