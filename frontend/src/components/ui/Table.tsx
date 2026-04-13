import { ReactNode } from 'react';
import styles from './Table.module.css';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  emptyMessage?: string;
  compact?: boolean;
  striped?: boolean;
  bordered?: boolean;
  noHover?: boolean;
  selectedKey?: string | number | null;
}

export function Table<T>({ 
  columns, 
  data, 
  keyExtractor, 
  emptyMessage = 'Nenhum registro encontrado.',
  compact = false,
  striped = true,
  bordered = false,
  noHover = false,
  selectedKey = null,
}: TableProps<T>) {
  const containerClass = `
    ${styles.container}
    ${compact ? styles.compact : ''}
    ${striped ? styles.stripe : ''}
    ${bordered ? styles.bordered : ''}
    ${noHover ? styles.noHover : ''}
  `.trim();

  return (
    <div className={containerClass}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tr}>
            {columns.map((col, index) => (
              <th
                key={index}
                className={`${styles.th} ${col.align === 'right' ? styles.right : ''} ${col.align === 'center' ? styles.center : ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row) => {
              const key = keyExtractor(row);
              const isSelected = selectedKey !== null && key === selectedKey;
              
              return (
                <tr key={key} className={`${styles.tr} ${isSelected ? styles.selected : ''}`}>
                  {columns.map((col, index) => (
                    <td
                      key={index}
                      className={`${styles.td} ${col.align === 'right' ? styles.right : ''} ${col.align === 'center' ? styles.center : ''}`}
                    >
                      {typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : (row[col.accessor] as ReactNode)}
                    </td>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={columns.length} className={styles.emptyState}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
