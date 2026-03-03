/**
 * Feature: frontend-ui-design
 * Property 12: Componentes de formulario renderizan estados de error y deshabilitado
 * **Valida: Requisitos 10.3**
 */
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import { Input } from '../Input';
import { Select } from '../Select';
import { Button } from '../Button';

describe('Property 12: Componentes de formulario renderizan estados de error y deshabilitado', () => {
  it('Input renders error message and aria-invalid when error prop is provided', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
        (errorMsg) => {
          const { container, unmount } = render(<Input error={errorMsg} />);
          const input = container.querySelector('input')!;
          expect(input).toHaveAttribute('aria-invalid', 'true');
          const alert = container.querySelector('[role="alert"]')!;
          expect(alert.textContent).toBe(errorMsg);
          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Input does not render error when error prop is undefined', () => {
    const { container, unmount } = render(<Input />);
    const input = container.querySelector('input')!;
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(container.querySelector('[role="alert"]')).toBeNull();
    unmount();
  });

  it('Select renders error message and aria-invalid when error prop is provided', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
        (errorMsg) => {
          const { container, unmount } = render(
            <Select error={errorMsg} options={[{ value: 'a', label: 'A' }]} />,
          );
          const select = container.querySelector('select')!;
          expect(select).toHaveAttribute('aria-invalid', 'true');
          const alert = container.querySelector('[role="alert"]')!;
          expect(alert.textContent).toBe(errorMsg);
          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Button is disabled when disabled prop is true', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        (label) => {
          const { container, unmount } = render(<Button disabled>{label}</Button>);
          const btn = container.querySelector('button')!;
          expect(btn).toBeDisabled();
          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Button is disabled when loading prop is true', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        (label) => {
          const { container, unmount } = render(<Button loading>{label}</Button>);
          const btn = container.querySelector('button')!;
          expect(btn).toBeDisabled();
          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });
});
