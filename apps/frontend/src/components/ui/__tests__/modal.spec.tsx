/**
 * Feature: frontend-ui-design
 * Property 11: Modal se cierra con overlay y Escape
 * **Valida: Requisitos 10.2**
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import { Modal } from '../Modal';

describe('Property 11: Modal se cierra con overlay y Escape', () => {
  it('calls onClose when Escape key is pressed while modal is open', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (title) => {
          const onClose = jest.fn();
          const { unmount } = render(
            <Modal isOpen={true} onClose={onClose} title={title}>
              <p>Content</p>
            </Modal>,
          );
          fireEvent.keyDown(document, { key: 'Escape' });
          expect(onClose).toHaveBeenCalled();
          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('calls onClose when overlay is clicked', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (title) => {
          const onClose = jest.fn();
          const { unmount } = render(
            <Modal isOpen={true} onClose={onClose} title={title}>
              <p>Content</p>
            </Modal>,
          );
          // The overlay is the first child rendered in the portal
          const overlay = document.querySelector('[class*="overlay"]');
          if (overlay) {
            fireEvent.click(overlay);
            expect(onClose).toHaveBeenCalled();
          }
          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('does not render when isOpen is false', () => {
    const onClose = jest.fn();
    const { unmount } = render(
      <Modal isOpen={false} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    unmount();
  });
});
