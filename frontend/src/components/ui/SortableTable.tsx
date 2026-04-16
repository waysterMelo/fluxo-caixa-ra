import { ReactNode, useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import styles from './Table.module.css';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  align?: 'left' | 'center' | 'right';
  cellStyle?: React.CSSProperties | ((row: T) => React.CSSProperties);
}

interface SortableTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onDataChange: (newData: T[]) => void;
  keyExtractor: (row: T) => string | number;
  emptyMessage?: string;
  compact?: boolean;
}

function SortableRow<T>({ 
  row, 
  columns, 
  id
}: { 
  row: T, 
  columns: Column<T>[], 
  id: string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.8 : 1,
    background: isDragging ? 'var(--bg-hover)' : undefined,
    position: isDragging ? 'relative' as const : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style} className={styles.tr}>
      <td className={`${styles.td} ${styles.center}`} style={{ width: 40, cursor: 'grab', color: 'var(--text-tertiary)' }} {...attributes} {...listeners}>
        <GripVertical size={16} style={{ display: 'block', margin: '0 auto', opacity: 0.5 }} />
      </td>
      {columns.map((col, index) => {
        const customStyle = typeof col.cellStyle === 'function' ? col.cellStyle(row) : col.cellStyle;
        return (
          <td
            key={index}
            className={`${styles.td} ${col.align === 'right' ? styles.right : ''} ${col.align === 'center' ? styles.center : ''}`}
            style={customStyle}
          >
            {typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor] as ReactNode)}
          </td>
        );
      })}
    </tr>
  );
}

export function SortableTable<T>({ 
  columns, 
  data, 
  onDataChange,
  keyExtractor, 
  emptyMessage = 'Nenhum registro encontrado.',
  compact = false
}: SortableTableProps<T>) {
  
  const [items, setItems] = useState(data);

  useEffect(() => {
    setItems(data);
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // Needs a small drag to avoid blocking clicks inside table
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => String(keyExtractor(item)) === active.id);
      const newIndex = items.findIndex((item) => String(keyExtractor(item)) === over?.id);
      
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      onDataChange(newItems);
    }
  };

  const containerClass = `${styles.container} ${compact ? styles.compact : ''} ${styles.stripe}`.trim();

  return (
    <div className={containerClass}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tr}>
              <th className={`${styles.th} ${styles.center}`} style={{ width: 40 }}></th>
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
            <SortableContext items={items.map(item => String(keyExtractor(item)))} strategy={verticalListSortingStrategy}>
              {items.length > 0 ? (
                items.map((row) => (
                  <SortableRow
                    key={String(keyExtractor(row))}
                    id={String(keyExtractor(row))}
                    row={row}
                    columns={columns}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + 1} className={styles.emptyState}>
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    </div>
  );
}
