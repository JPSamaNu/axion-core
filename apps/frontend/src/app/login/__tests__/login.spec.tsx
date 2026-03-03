/**
 * Feature: frontend-ui-design
 * Property 1: Validación de campos vacíos/whitespace rechaza envío
 * **Valida: Requisitos 2.5**
 *
 * Also includes unit tests for login page (Task 5.3)
 * **Valida: Requisitos 2.1, 2.3, 2.4**
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

import LoginPage from '../page';

describe('Property 1: Validación de campos vacíos/whitespace rechaza envío', () => {
  beforeEach(() => { mockPush.mockClear(); });

  it('rejects submission when email is whitespace-only', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { minLength: 0, maxLength: 10 }),
        (whitespace) => {
          const { unmount } = render(<LoginPage />);
          const emailInput = screen.getByPlaceholderText('tu@email.com');
          const passwordInput = screen.getByPlaceholderText('••••••••');
          const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i });

          fireEvent.change(emailInput, { target: { value: whitespace } });
          fireEvent.change(passwordInput, { target: { value: 'validpassword' } });
          fireEvent.click(submitBtn);

          expect(screen.getByText('El email es requerido')).toBeTruthy();
          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rejects submission when password is whitespace-only', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { minLength: 0, maxLength: 10 }),
        (whitespace) => {
          const { unmount } = render(<LoginPage />);
          const emailInput = screen.getByPlaceholderText('tu@email.com');
          const passwordInput = screen.getByPlaceholderText('••••••••');
          const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i });

          fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
          fireEvent.change(passwordInput, { target: { value: whitespace } });
          fireEvent.click(submitBtn);

          expect(screen.getByText('La contraseña es requerida')).toBeTruthy();
          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('Login page unit tests', () => {
  beforeEach(() => { mockPush.mockClear(); });

  it('renders form with email and password fields', () => {
    const { unmount } = render(<LoginPage />);
    expect(screen.getByPlaceholderText('tu@email.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('••••••••')).toBeTruthy();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeTruthy();
    unmount();
  });

  it('disables button during loading', async () => {
    const { unmount } = render(<LoginPage />);
    const emailInput = screen.getByPlaceholderText('tu@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    // Button should be disabled during loading
    expect(submitBtn).toBeDisabled();
    unmount();
  });
});
