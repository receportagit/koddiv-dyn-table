import type { ColumnDef } from './Table.types';

/** Genişlik değerini px sayısına çevirir (number veya "100px" / "100") */
export function parseWidth(w: string | number | undefined): number | undefined {
  if (w == null) return undefined;
  if (typeof w === 'number') return w;
  const n = parseFloat(w);
  return Number.isNaN(n) ? undefined : n;
}

export function getCellValue<T>(row: T, column: ColumnDef<T>): unknown {
  if (column.valueGetter) return column.valueGetter(row);
  if (column.accessorKey === undefined) return undefined;
  const key = column.accessorKey as keyof T;
  return row[key];
}
