import styles from './DataTable.module.css';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  actions?: (item: T) => React.ReactNode;
  emptyMessage?: string;
  keyExtractor?: (item: T) => string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  actions,
  emptyMessage = 'No hay datos disponibles',
  keyExtractor,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.empty}>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => <th key={col.key}>{col.header}</th>)}
            {actions && <th style={{ textAlign: 'right' }}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={keyExtractor ? keyExtractor(item) : (item.id ?? i)}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(item) : String(item[col.key] ?? '')}
                </td>
              ))}
              {actions && <td><div className={styles.actions}>{actions(item)}</div></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
