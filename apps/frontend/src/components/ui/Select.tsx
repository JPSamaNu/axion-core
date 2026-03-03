import React, { useId } from 'react';
import styles from './Select.module.css';

interface SelectOption { value: string; label: string; }

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id: externalId, ...props }, ref) => {
    const autoId = useId();
    const id = externalId ?? autoId;
    const errorId = `${id}-error`;

    return (
      <div className={styles.field}>
        {label && <label htmlFor={id} className={styles.label}>{label}</label>}
        <select
          ref={ref}
          id={id}
          className={`${styles.select} ${error ? styles.selectError : ''} ${className ?? ''}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <span id={errorId} className={styles.error} role="alert">{error}</span>}
      </div>
    );
  },
);

Select.displayName = 'Select';
