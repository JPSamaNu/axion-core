/**
 * Feature: frontend-ui-design
 * Property 14: Badge renderiza variante correcta por estado
 * **Valida: Requisitos 10.5**
 */
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import { StatusBadge } from '../Badge';

const STATUS_MAP: Record<string, string> = {
  active: 'success',
  inactive: 'neutral',
  suspended: 'error',
  global: 'info',
  tenant: 'warning',
};

describe('Property 14: Badge renderiza variante correcta por estado', () => {
  it('StatusBadge maps known statuses to correct variant class', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('active', 'inactive', 'suspended', 'global', 'tenant'),
        (status) => {
          const { container, unmount } = render(<StatusBadge status={status} />);
          const span = container.querySelector('span')!;
          expect(span).toBeTruthy();
          // identity-obj-proxy returns CSS module keys as-is, so className contains the key name
          const expectedVariant = STATUS_MAP[status];
          expect(span.className).toContain(expectedVariant);
          expect(span.textContent).toBe(status);
          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('StatusBadge defaults to neutral for unknown statuses', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('pending', 'blocked', 'archived', 'unknown', 'deleted'),
        (status) => {
          const { container, unmount } = render(<StatusBadge status={status} />);
          const span = container.querySelector('span')!;
          expect(span).toBeTruthy();
          expect(span.className).toContain('neutral');
          expect(span.textContent).toBe(status);
          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });
});
