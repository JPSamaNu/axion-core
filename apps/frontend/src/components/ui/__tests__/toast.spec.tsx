/**
 * Feature: frontend-ui-design
 * Property 13: Toast se auto-descarta después del tiempo configurado
 * **Valida: Requisitos 10.4**
 */
import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import { ToastProvider, useToast } from '../Toast';

function ToastTrigger({ message, variant }: { message: string; variant: 'success' | 'error' | 'info' }) {
  const { showToast } = useToast();
  React.useEffect(() => { showToast(message, variant); }, [message, variant, showToast]);
  return null;
}

describe('Property 13: Toast se auto-descarta después del tiempo configurado', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('toast disappears after configured duration', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 500, max: 5000 }),
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        fc.constantFrom('success' as const, 'error' as const, 'info' as const),
        (duration, message, variant) => {
          const { container, unmount } = render(
            <ToastProvider duration={duration}>
              <ToastTrigger message={message} variant={variant} />
            </ToastProvider>,
          );

          // Toast should be visible
          const alerts = container.querySelectorAll('[role="alert"]');
          expect(alerts.length).toBeGreaterThan(0);

          // Advance time past duration
          act(() => { jest.advanceTimersByTime(duration + 100); });

          // Toast should be gone
          const alertsAfter = container.querySelectorAll('[role="alert"]');
          expect(alertsAfter.length).toBe(0);

          unmount();
        },
      ),
      { numRuns: 50 },
    );
  });
});
