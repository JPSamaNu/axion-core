/**
 * Feature: frontend-ui-design
 * Property 4: DataTable renderiza filas y columnas correctamente
 * **Valida: Requisitos 10.1, 5.1, 6.1, 7.1**
 */
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import { DataTable } from '../DataTable';

const columnArb = fc.record({
  key: fc.stringMatching(/^[a-z][a-zA-Z0-9]{0,9}$/),
  header: fc.string({ minLength: 1, maxLength: 20 }),
});

const uniqueColumnsArb = fc.array(columnArb, { minLength: 1, maxLength: 5 })
  .map((cols) => {
    const seen = new Set<string>();
    return cols.filter((c) => { if (seen.has(c.key)) return false; seen.add(c.key); return true; });
  })
  .filter((cols) => cols.length > 0);

describe('Property 4: DataTable renderiza filas y columnas correctamente', () => {
  it('renders exactly one row per data item and one cell per column', () => {
    fc.assert(
      fc.property(
        uniqueColumnsArb,
        fc.integer({ min: 1, max: 10 }),
        (columns, rowCount) => {
          const data = Array.from({ length: rowCount }, (_, i) => {
            const row: Record<string, any> = { id: String(i) };
            columns.forEach((c) => { row[c.key] = `val-${i}-${c.key}`; });
            return row;
          });

          const { container, unmount } = render(
            <DataTable columns={columns} data={data} />,
          );

          const rows = container.querySelectorAll('tbody tr');
          expect(rows.length).toBe(rowCount);

          rows.forEach((row) => {
            const cells = row.querySelectorAll('td');
            expect(cells.length).toBe(columns.length);
          });

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('shows empty message when data array is empty', () => {
    fc.assert(
      fc.property(
        uniqueColumnsArb,
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        (columns, emptyMsg) => {
          const { container, unmount } = render(
            <DataTable columns={columns} data={[]} emptyMessage={emptyMsg} />,
          );
          const emptyDiv = container.querySelector('[class*="empty"]');
          expect(emptyDiv).toBeTruthy();
          expect(emptyDiv!.textContent).toBe(emptyMsg);
          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });
});
