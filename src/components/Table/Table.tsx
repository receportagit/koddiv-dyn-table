import * as React from 'react';
import type { TableProps, ColumnDef } from './Table.types';
import { getCellValue, parseWidth } from './utils';
import { applyValueFormat } from './valueFormats';
import { renderCellFormat } from '../TableFormatters';
import './Table.css';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_MIN_WIDTH = 50;
const DEFAULT_FLEX_MIN = 80;

/** Kolon için mutlaka korunacak minimum genişlik (px); flex/resizable olsa da altına inmez */
function getMinWidthForColumn<T>(col: ColumnDef<T>): number {
  return parseWidth(col.minWidth) ?? (col.flex ? DEFAULT_FLEX_MIN : DEFAULT_MIN_WIDTH);
}

interface ResizeHandleProps {
  colId: string;
  minWidth: number;
  maxWidth: number | undefined;
  startWidth: number;
  onResize: (width: number) => void;
}

function ResizeHandle({
  colId,
  minWidth,
  maxWidth,
  startWidth,
  onResize,
}: ResizeHandleProps) {
  const handleRef = React.useRef<HTMLDivElement>(null);
  const onResizeRef = React.useRef(onResize);
  onResizeRef.current = onResize;

  React.useEffect(() => {
    const el = handleRef.current;
    if (!el) return;
    let startX = 0;
    let startW = 0;
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startX = e.clientX;
      startW = startWidth;
      document.body.classList.add('dyn-table-resizing');
      const onMouseMove = (e2: MouseEvent) => {
        const delta = e2.clientX - startX;
        let w = Math.max(minWidth, startW + delta);
        if (maxWidth != null) w = Math.min(maxWidth, w);
        onResizeRef.current(w);
      };
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.classList.remove('dyn-table-resizing');
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
    el.addEventListener('mousedown', onMouseDown);
    return () => el.removeEventListener('mousedown', onMouseDown);
  }, [colId, minWidth, maxWidth, startWidth]);

  return (
    <div
      ref={handleRef}
      className="dyn-table-resize-handle"
      role="separator"
      aria-label={`${colId} kolon genişliğini değiştir`}
    />
  );
}

const SELECTION_COLUMN_WIDTH = 44;

interface SelectionHeaderCheckboxProps<T> {
  displayData: T[];
  getRowKey: (row: T) => string | number;
  selectedSet: Set<string | number>;
  onToggleAll: () => void;
}

function SelectionHeaderCheckbox<T>({
  displayData,
  getRowKey,
  selectedSet,
  onToggleAll,
}: SelectionHeaderCheckboxProps<T>) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const pageKeys = displayData.map((r) => getRowKey(r) as string | number);
  const allChecked = pageKeys.length > 0 && pageKeys.every((k) => selectedSet.has(k));
  const someChecked = pageKeys.some((k) => selectedSet.has(k));
  const indeterminate = someChecked && !allChecked;

  React.useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className="dyn-table-selection-header">
      <input
        ref={inputRef}
        type="checkbox"
        checked={allChecked}
        onChange={onToggleAll}
        aria-label="Tümünü seç"
      />
    </label>
  );
}

function getComputedWidths<T>(
  columns: ColumnDef<T>[],
  tableWidth: number,
  columnWidths: Record<string, number>,
  actionsWidthPx: number,
  selectionWidthPx: number
): number[] {
  const hasFlex = columns.some((c) => (c.flex ?? 0) > 0);
  const flexCols = columns.filter((c) => (c.flex ?? 0) > 0);
  const flexTotal = flexCols.reduce((s, c) => s + (c.flex ?? 0), 0);

  const fixedWidths: number[] = [];
  let fixedSum = 0;
  for (const col of columns) {
    const minPx = parseWidth(col.minWidth) ?? (col.flex ? DEFAULT_FLEX_MIN : DEFAULT_MIN_WIDTH);
    const maxPx = parseWidth(col.maxWidth);
    if (col.flex) {
      const override = columnWidths[col.id];
      if (override != null) {
        fixedWidths.push(Math.max(minPx, maxPx != null ? Math.min(override, maxPx) : override));
        fixedSum += fixedWidths[fixedWidths.length - 1];
      } else {
        fixedWidths.push(-1);
      }
    } else {
      const w =
        columnWidths[col.id] ??
        parseWidth(col.width) ??
        minPx;
      fixedWidths.push(maxPx != null ? Math.min(w, maxPx) : Math.max(minPx, w));
      fixedSum += fixedWidths[fixedWidths.length - 1];
    }
  }

  if (!hasFlex || tableWidth <= 0 || flexTotal <= 0) {
    return fixedWidths.map((w) => (w === -1 ? DEFAULT_FLEX_MIN : w));
  }

  const remaining = tableWidth - fixedSum - actionsWidthPx - selectionWidthPx;
  if (remaining <= 0) {
    return fixedWidths.map((w) => (w === -1 ? DEFAULT_FLEX_MIN : w));
  }

  const result = [...fixedWidths];
  let distributed = 0;
  for (let i = 0; i < columns.length; i++) {
    if (result[i] !== -1) continue;
    const col = columns[i];
    const minPx = parseWidth(col.minWidth) ?? DEFAULT_FLEX_MIN;
    const maxPx = parseWidth(col.maxWidth);
    const flex = col.flex ?? 0;
    const raw = (flex / flexTotal) * remaining;
    const clamped = maxPx != null ? Math.min(raw, maxPx) : raw;
    result[i] = Math.max(minPx, clamped);
    distributed += result[i];
  }
  return result;
}

export function Table<T>({
  data,
  columns,
  keyExtractor: keyExtractorProp,
  keyColumnId,
  sortable = true,
  defaultSort = { id: '', direction: null },
  onSort,
  emptyMessage = 'Veri yok',
  theme = 'light',
  className = '',
  headerClassName = '',
  bodyClassName = '',
  rowClassName,
  actions,
  actionsHeader = 'İşlemler',
  actionsAlign = 'center',
  actionsWidth,
  pagination = false,
  pageSize: pageSizeProp = 10,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  totalCount: totalCountProp,
  onBlockNeeded,
  blockSize: _blockSize,
  minHeight,
  height,
  mobileBreakpoint = 768,
  rowSelection = false,
  selectedRowKeys: selectedRowKeysProp,
  defaultSelectedRowKeys = [],
  onSelectionChange,
  selectionToolbarLabel,
  filterable = false,
  filterModel: filterModelProp,
  defaultFilterModel = {},
  onFilterChange,
  filterPanelWidth = 280,
  virtualization = false,
  rowHeight = 44,
  virtualizationOverscan = 5,
  columnVisibility: columnVisibilityProp,
  onColumnVisibilityChange,
  columnOrder: columnOrderProp,
  onColumnOrderChange,
  columnReorder = true,
  loading = false,
  stickyHeader = false,
}: TableProps<T>) {
  const getRowKey = React.useCallback(
    (row: T, index?: number): string | number => {
      if (keyExtractorProp) return keyExtractorProp(row);
      if (keyColumnId) {
        const col = columns.find((c) => c.id === keyColumnId);
        if (col) return getCellValue(row, col) as string | number;
      }
      return String(index ?? 0);
    },
    [keyExtractorProp, keyColumnId, columns]
  );

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [tableWidth, setTableWidth] = React.useState(0);
  const [scrollContainerHeight, setScrollContainerHeight] = React.useState(0);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setTableWidth(el.clientWidth);
      setScrollContainerHeight(el.clientHeight);
    };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, []);

  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${mobileBreakpoint}px)`);
    setIsMobile(mq.matches);
    const fn = () => setIsMobile(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [mobileBreakpoint]);

  const [sortState, setSortState] = React.useState(defaultSort);
  const [internalPage, setInternalPage] = React.useState(defaultPage);
  const [pageSize, setPageSize] = React.useState(pageSizeProp);
  React.useEffect(() => {
    setPageSize(pageSizeProp);
  }, [pageSizeProp]);

  const isVisibilityControlled = columnVisibilityProp != null;
  const [internalVisibility, setInternalVisibility] = React.useState<Record<string, boolean>>(
    () => columns.reduce<Record<string, boolean>>((acc, c) => ({ ...acc, [c.id]: !c.hide }), {})
  );
  React.useEffect(() => {
    if (isVisibilityControlled) return;
    setInternalVisibility((prev) => {
      const next = { ...prev };
      for (const c of columns) {
        if (next[c.id] === undefined) next[c.id] = !c.hide;
      }
      return next;
    });
  }, [columns, isVisibilityControlled]);
  const currentVisibility = isVisibilityControlled ? columnVisibilityProp! : internalVisibility;
  const setVisibility = React.useCallback(
    (next: Record<string, boolean>) => {
      if (!isVisibilityControlled) setInternalVisibility(next);
      onColumnVisibilityChange?.(next);
    },
    [isVisibilityControlled, onColumnVisibilityChange]
  );

  const isOrderControlled = columnOrderProp != null;
  const [internalOrder, setInternalOrder] = React.useState<string[]>(() => columns.map((c) => c.id));
  React.useEffect(() => {
    if (!isOrderControlled) setInternalOrder((prev) => {
      const next = columns.map((c) => c.id);
      const added = next.filter((id) => !prev.includes(id));
      const removed = prev.filter((id) => !next.some((id2) => id2 === id));
      if (added.length === 0 && removed.length === 0) return prev;
      let order = prev.filter((id) => next.includes(id));
      for (const id of added) order.push(id);
      return order;
    });
  }, [columns, isOrderControlled]);
  const currentOrder = isOrderControlled ? columnOrderProp! : internalOrder;
  const setOrder = React.useCallback(
    (next: string[]) => {
      if (!isOrderControlled) setInternalOrder(next);
      onColumnOrderChange?.(next);
    },
    [isOrderControlled, onColumnOrderChange]
  );

  const isPageControlled = pageProp != null;
  const currentPage = isPageControlled ? pageProp : internalPage;

  const handlePageChange = React.useCallback(
    (nextPage: number, nextPageSize: number) => {
      if (!isPageControlled) setInternalPage(nextPage);
      if (nextPageSize !== pageSize) setPageSize(nextPageSize);
      onPageChange?.(nextPage, nextPageSize);
    },
    [isPageControlled, pageSize, onPageChange]
  );

  const lastBlockNeededPageRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (!pagination || !onBlockNeeded) return;
    const needed = currentPage * pageSize;
    if (data.length >= needed) {
      lastBlockNeededPageRef.current = null;
      return;
    }
    if (lastBlockNeededPageRef.current === currentPage) return;
    lastBlockNeededPageRef.current = currentPage;
    onBlockNeeded(currentPage);
  }, [pagination, onBlockNeeded, currentPage, pageSize, data.length]);

  const handleSort = (id: string) => {
    if (!sortable) return;
    const next: typeof sortState =
      sortState.id === id
        ? {
            id,
            direction:
              sortState.direction === 'asc'
                ? 'desc'
                : sortState.direction === 'desc'
                  ? null
                  : 'asc',
          }
        : { id, direction: 'asc' as const };
    setSortState(next);
    onSort?.(next.id, next.direction);
  };

  const visibleColumns = React.useMemo(() => {
    const order = currentOrder.filter((id) => columns.some((c) => c.id === id));
    const baseOrdered = order
      .filter((id) => currentVisibility[id] !== false)
      .map((id) => columns.find((c) => c.id === id)!)
      .filter(Boolean);
    for (const c of columns) {
      if (currentVisibility[c.id] !== false && !baseOrdered.some((x) => x.id === c.id)) {
        baseOrdered.push(c);
      }
    }
    const left = baseOrdered.filter((c) => c.pinned === 'left');
    const center = baseOrdered.filter((c) => c.pinned !== 'left' && c.pinned !== 'right');
    const right = baseOrdered.filter((c) => c.pinned === 'right');
    return [...left, ...center, ...right];
  }, [columns, currentOrder, currentVisibility]);

  const filterableColumns = React.useMemo(
    () => visibleColumns.filter((c) => c.filter != null),
    [visibleColumns]
  );

  const isFilterControlled = filterModelProp != null;
  const [internalFilterModel, setInternalFilterModel] = React.useState<Record<string, string | number | null>>(
    () => defaultFilterModel ?? {}
  );
  const currentFilterModel = isFilterControlled ? filterModelProp! : internalFilterModel;
  const setFilterModel = React.useCallback(
    (next: Record<string, string | number | null>) => {
      if (!isFilterControlled) setInternalFilterModel(next);
      onFilterChange?.(next);
    },
    [isFilterControlled, onFilterChange]
  );

  const filteredData = React.useMemo(() => {
    const active = Object.entries(currentFilterModel).filter(
      ([_, v]) => v !== null && v !== undefined && v !== ''
    );
    if (active.length === 0) return data;
    return data.filter((row) => {
      for (const [colId, filterVal] of active) {
        const col = columns.find((c) => c.id === colId);
        if (!col?.filter) continue;
        const cellVal = getCellValue(row, col);
        if (col.filter === 'text') {
          const s = String(cellVal ?? '').toLowerCase();
          const f = String(filterVal).toLowerCase();
          if (f && !s.includes(f)) return false;
        } else if (col.filter === 'number') {
          const n = typeof cellVal === 'number' ? cellVal : Number(cellVal);
          const fn = typeof filterVal === 'number' ? filterVal : Number(filterVal);
          if (Number.isNaN(fn)) continue;
          if (Number.isNaN(n) || n !== fn) return false;
        } else if (col.filter === 'date') {
          const cv = cellVal != null ? new Date(cellVal as number | string).getTime() : NaN;
          const fv = new Date(filterVal as string).getTime();
          if (Number.isNaN(fv)) continue;
          if (Number.isNaN(cv)) return false;
          const d1 = new Date(cv).toDateString();
          const d2 = new Date(fv).toDateString();
          if (d1 !== d2) return false;
        } else if (col.filter === 'select') {
          const cStr = cellVal != null ? String(cellVal) : '';
          const fStr = String(filterVal);
          if (fStr && cStr !== fStr) return false;
        }
      }
      return true;
    });
  }, [data, columns, currentFilterModel]);

  const totalCount = totalCountProp ?? filteredData.length;
  const isClientSide = totalCountProp == null;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const actionsWidthPx =
    actions == null
      ? 0
      : parseWidth(actionsWidth) ?? 80;

  const selectionWidthPx = rowSelection ? SELECTION_COLUMN_WIDTH : 0;

  const computedWidths = React.useMemo(
    () =>
      getComputedWidths(
        visibleColumns,
        tableWidth,
        columnWidths,
        actionsWidthPx,
        selectionWidthPx
      ),
    [visibleColumns, tableWidth, columnWidths, actionsWidthPx, selectionWidthPx]
  );

  const { pinnedLeftOffsets, pinnedRightOffsets } = React.useMemo(() => {
    const left: (number | undefined)[] = [];
    const right: (number | undefined)[] = [];
    let leftAcc = selectionWidthPx;
    for (let i = 0; i < visibleColumns.length; i++) {
      if (visibleColumns[i].pinned === 'left') {
        left[i] = leftAcc;
        leftAcc += computedWidths[i];
      } else {
        left[i] = undefined;
      }
    }
    let rightAcc = actionsWidthPx;
    for (let i = visibleColumns.length - 1; i >= 0; i--) {
      if (visibleColumns[i].pinned === 'right') {
        right[i] = rightAcc;
        rightAcc += computedWidths[i];
      } else {
        right[i] = undefined;
      }
    }
    return {
      pinnedLeftOffsets: left,
      pinnedRightOffsets: right,
    };
  }, [visibleColumns, computedWidths, selectionWidthPx, actionsWidthPx]);

  const sortedData = React.useMemo(() => {
    if (!sortState.direction || !sortState.id) return filteredData;
    const col = columns.find((c) => c.id === sortState.id);
    if (!col?.sortable || col?.suppressSort) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = getCellValue(a, col);
      const bVal = getCellValue(b, col);
      const cmp = col.comparator
        ? col.comparator(aVal, bVal, a, b)
        : typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal ?? '').localeCompare(String(bVal ?? ''));
      return sortState.direction === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, columns, sortState]);

  const displayData = React.useMemo(() => {
    if (!pagination) return sortedData;
    if (isClientSide || onBlockNeeded) {
      const start = (safePage - 1) * pageSize;
      return sortedData.slice(start, start + pageSize);
    }
    return sortedData;
  }, [pagination, isClientSide, onBlockNeeded, sortedData, safePage, pageSize]);

  const isSelectionControlled = selectedRowKeysProp != null;
  const [internalSelectedKeys, setInternalSelectedKeys] = React.useState<(string | number)[]>(
    () => defaultSelectedRowKeys
  );
  const selectedKeys = isSelectionControlled ? selectedRowKeysProp : internalSelectedKeys;
  const selectedSet = React.useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const setSelectedKeys = React.useCallback(
    (next: (string | number)[]) => {
      if (!isSelectionControlled) setInternalSelectedKeys(next);
      const rows = data.filter((row) => next.includes(getRowKey(row) as string | number));
      onSelectionChange?.(next, rows);
    },
    [isSelectionControlled, data, getRowKey, onSelectionChange]
  );

  const toggleRow = React.useCallback(
    (key: string | number) => {
      const next = selectedSet.has(key)
        ? selectedKeys.filter((k) => k !== key)
        : [...selectedKeys, key];
      setSelectedKeys(next);
    },
    [selectedKeys, selectedSet, setSelectedKeys]
  );

  const toggleAllOnPage = React.useCallback(() => {
    const pageKeys = displayData.map((row) => getRowKey(row) as string | number);
    const allSelected = pageKeys.length > 0 && pageKeys.every((k) => selectedSet.has(k));
    const next = allSelected
      ? selectedKeys.filter((k) => !pageKeys.includes(k))
      : [...new Set([...selectedKeys, ...pageKeys])];
    setSelectedKeys(next);
  }, [displayData, getRowKey, selectedKeys, selectedSet, setSelectedKeys]);

  const selectedRows = React.useMemo(
    () => data.filter((row) => selectedSet.has(getRowKey(row) as string | number)),
    [data, selectedSet, getRowKey]
  );

  const selectAll = React.useCallback(() => {
    setSelectedKeys(data.map((row) => getRowKey(row) as string | number));
  }, [data, getRowKey, setSelectedKeys]);

  const clearSelection = React.useCallback(() => {
    setSelectedKeys([]);
  }, [setSelectedKeys]);

  const [selectionDropdownOpen, setSelectionDropdownOpen] = React.useState(false);
  const selectionDropdownRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!selectionDropdownOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (selectionDropdownRef.current && !selectionDropdownRef.current.contains(e.target as Node))
        setSelectionDropdownOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [selectionDropdownOpen]);

  const [filterPanelOpen, setFilterPanelOpen] = React.useState(false);
  const [columnVisibilityDropdownOpen, setColumnVisibilityDropdownOpen] = React.useState(false);
  const columnVisibilityDropdownRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!columnVisibilityDropdownOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (columnVisibilityDropdownRef.current && !columnVisibilityDropdownRef.current.contains(e.target as Node)) {
        setColumnVisibilityDropdownOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [columnVisibilityDropdownOpen]);

  const toggleColumnVisibility = React.useCallback(
    (colId: string) => {
      setVisibility({ ...currentVisibility, [colId]: !currentVisibility[colId] });
    },
    [currentVisibility, setVisibility]
  );

  const [draggedColId, setDraggedColId] = React.useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number>(-1);

  const handleColumnDragStart = React.useCallback((e: React.DragEvent, colId: string) => {
    e.dataTransfer.setData('text/plain', colId);
    e.dataTransfer.effectAllowed = 'move';
    const th = (e.currentTarget as HTMLElement).closest('th');
    if (th) e.dataTransfer.setDragImage(th, 0, 0);
    setDraggedColId(colId);
  }, []);

  const handleColumnDragOver = React.useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleColumnDragLeave = React.useCallback(() => {
    setDragOverIndex(-1);
  }, []);

  const handleColumnDrop = React.useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      setDragOverIndex(-1);
      const draggedId = e.dataTransfer.getData('text/plain');
      if (!draggedId || draggedId === visibleColumns[dropIndex]?.id) return;
      const fromIdx = currentOrder.indexOf(draggedId);
      const dropTargetId = visibleColumns[dropIndex]?.id;
      const toIdx = currentOrder.indexOf(dropTargetId);
      if (fromIdx === -1 || toIdx === -1) return;
      const newOrder = currentOrder.slice();
      newOrder.splice(fromIdx, 1);
      const newToIdx = newOrder.indexOf(dropTargetId);
      newOrder.splice(newToIdx, 0, draggedId);
      setOrder(newOrder);
    },
    [visibleColumns, currentOrder, setOrder]
  );

  const handleColumnDragEnd = React.useCallback(() => {
    setDraggedColId(null);
    setDragOverIndex(-1);
  }, []);

  const activeFilterCount = Object.values(currentFilterModel).filter(
    (v) => v !== null && v !== undefined && v !== ''
  ).length;

  const clearFilters = React.useCallback(() => {
    setFilterModel({});
  }, [setFilterModel]);

  const useVirtualization = virtualization && !isMobile && displayData.length > 0;
  const useStickyHeader = stickyHeader && !isMobile;
  const { virtualStart, virtualEnd } = React.useMemo(() => {
    if (!useVirtualization || scrollContainerHeight <= 0) {
      return { virtualStart: 0, virtualEnd: displayData.length };
    }
    const visibleCount = Math.ceil(scrollContainerHeight / rowHeight) + virtualizationOverscan * 2;
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - virtualizationOverscan);
    const end = Math.min(displayData.length, start + visibleCount);
    return { virtualStart: start, virtualEnd: end };
  }, [useVirtualization, scrollContainerHeight, scrollTop, rowHeight, virtualizationOverscan, displayData.length]);

  const startRow = (safePage - 1) * pageSize + 1;
  const endRow = Math.min(safePage * pageSize, totalCount);
  const skeletonRowCount = loading ? Math.min(pageSize, 10) : 0;

  function getCellDisplay<T>(
  row: T,
  col: import('./Table.types').ColumnDef<T>,
  value: unknown
): React.ReactNode {
  if (col.cell != null) return col.cell(row);
  if (col.valueFormatter != null) return col.valueFormatter(value, row);
  if (col.valueFormat != null) return applyValueFormat(value, col.valueFormat, col.valueFormatOptions);
  if (col.cellFormat != null) return renderCellFormat(col.cellFormat, value, row, col.cellFormatOptions);
  return value as React.ReactNode;
}

  const themeClass = theme === 'dark' ? 'dyn-table-wrapper--dark' : 'dyn-table-wrapper--light';
  const showToolbar = rowSelection || filterable || columns.length > 1;
  return (
    <div className={`dyn-table-wrapper ${themeClass} ${className}`.trim()}>
      {showToolbar && (
        <div className={`dyn-table-toolbar ${isMobile ? 'dyn-table-toolbar--mobile' : ''}`.trim()}>
          <div className="dyn-table-toolbar__actions">
            {rowSelection && (
              <>
                <button
                  type="button"
                  className="dyn-table-toolbar__btn"
                  onClick={selectAll}
                  aria-label="Tümünü seç"
                >
                  Tümünü seç
                </button>
                <button
                  type="button"
                  className="dyn-table-toolbar__btn"
                  onClick={clearSelection}
                  disabled={selectedKeys.length === 0}
                  aria-label="Seçimi kaldır"
                >
                  Kaldır
                </button>
                <div ref={selectionDropdownRef} className="dyn-table-toolbar__dropdown">
              <button
                type="button"
                className="dyn-table-toolbar__dropdown-trigger"
                onClick={() => setSelectionDropdownOpen((v) => !v)}
                disabled={selectedKeys.length === 0}
                aria-expanded={selectionDropdownOpen}
                aria-haspopup="listbox"
                aria-label="Seçilenleri göster"
              >
                <span>{selectedKeys.length} seçili</span>
                <svg
                  className={`dyn-table-toolbar__dropdown-chevron ${selectionDropdownOpen ? 'dyn-table-toolbar__dropdown-chevron--open' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="14"
                  height="14"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {selectionDropdownOpen && selectedKeys.length > 0 && (
                <div
                  className="dyn-table-toolbar__dropdown-panel"
                  role="listbox"
                  aria-label="Seçilen satırlar"
                >
                  <ul className="dyn-table-toolbar__dropdown-list">
                    {selectedRows.map((row) => {
                      const key = getRowKey(row) as string | number;
                      const label = selectionToolbarLabel?.(row) ?? String(key);
                      return (
                        <li key={String(key)} className="dyn-table-toolbar__dropdown-item">
                          <span className="dyn-table-toolbar__dropdown-item-label">{label}</span>
                          <button
                            type="button"
                            className="dyn-table-toolbar__dropdown-item-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(key);
                            }}
                            aria-label={`${label} seçimini kaldır`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
              </>
            )}
            {filterable && (
              <button
                type="button"
                className={`dyn-table-toolbar__btn dyn-table-toolbar__btn--filter ${filterPanelOpen ? 'dyn-table-toolbar__btn--filter-active' : ''}`}
                onClick={() => setFilterPanelOpen((v) => !v)}
                aria-expanded={filterPanelOpen}
                aria-label="Filtreler"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                </svg>
                <span className="dyn-table-toolbar__btn-label">Filtre</span>
                {activeFilterCount > 0 && (
                  <span className="dyn-table-toolbar__filter-count">{activeFilterCount}</span>
                )}
              </button>
            )}
            {columns.length > 1 && (
              <div ref={columnVisibilityDropdownRef} className="dyn-table-toolbar__dropdown">
                <button
                  type="button"
                  className={`dyn-table-toolbar__dropdown-trigger ${columnVisibilityDropdownOpen ? 'dyn-table-toolbar__dropdown-trigger--open' : ''}`}
                  onClick={() => setColumnVisibilityDropdownOpen((v) => !v)}
                  aria-expanded={columnVisibilityDropdownOpen}
                  aria-haspopup="dialog"
                  aria-label="Kolonları göster/gizle"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M3 6h18M3 12h18M3 18h18M7 6v12M11 12v6M15 6v12M19 12v6" />
                  </svg>
                  <span className="dyn-table-toolbar__btn-label">Kolonlar</span>
                  <svg
                    className={`dyn-table-toolbar__dropdown-chevron ${columnVisibilityDropdownOpen ? 'dyn-table-toolbar__dropdown-chevron--open' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="14"
                    height="14"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {columnVisibilityDropdownOpen && (
                  <div
                    className="dyn-table-toolbar__dropdown-panel dyn-table-toolbar__dropdown-panel--columns"
                    role="dialog"
                    aria-label="Kolon görünürlüğü"
                  >
                    <div className="dyn-table-column-visibility__header">Görünen kolonlar</div>
                    <ul className="dyn-table-toolbar__dropdown-list">
                      {columns.map((col) => {
                        const visible = currentVisibility[col.id] !== false;
                        const headerLabel = typeof col.header === 'string' ? col.header : col.id;
                        return (
                          <li key={col.id} className="dyn-table-toolbar__dropdown-item dyn-table-toolbar__dropdown-item--checkbox">
                            <label className="dyn-table-column-visibility__label">
                              <input
                                type="checkbox"
                                checked={visible}
                                onChange={() => toggleColumnVisibility(col.id)}
                                aria-label={`${headerLabel} ${visible ? 'gizle' : 'göster'}`}
                              />
                              <span className="dyn-table-toolbar__dropdown-item-label">{headerLabel}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {filterable ? (
        <div className="dyn-table-main">
          {filterPanelOpen && (
            <div
              className="dyn-table-filter-overlay"
              role="presentation"
              onClick={() => setFilterPanelOpen(false)}
              aria-hidden
            />
          )}
          <div
            className={`dyn-table-filter-panel ${filterPanelOpen ? 'dyn-table-filter-panel--open' : ''}`}
            style={{ width: filterPanelWidth }}
            aria-label="Filtreler paneli"
          >
              <div className="dyn-table-filter-panel__header">
                <h3 className="dyn-table-filter-panel__title">Filtreler</h3>
                <button
                  type="button"
                  className="dyn-table-filter-panel__close"
                  onClick={() => setFilterPanelOpen(false)}
                  aria-label="Paneli kapat"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="dyn-table-filter-panel__body">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    className="dyn-table-filter-panel__clear"
                    onClick={clearFilters}
                  >
                    Filtreleri temizle
                  </button>
                )}
                {filterableColumns.map((col) => {
                  const headerLabel = typeof col.header === 'string' ? col.header : col.id;
                  const value = currentFilterModel[col.id] ?? '';
                  return (
                    <div key={col.id} className="dyn-table-filter-panel__item">
                      <label className="dyn-table-filter-panel__label">{headerLabel}</label>
                      {col.filter === 'text' && (
                        <input
                          type="text"
                          className="dyn-table-filter-panel__input"
                          value={value as string}
                          onChange={(e) =>
                            setFilterModel({ ...currentFilterModel, [col.id]: e.target.value || null })
                          }
                          placeholder="Ara..."
                        />
                      )}
                      {col.filter === 'number' && (
                        <input
                          type="number"
                          className="dyn-table-filter-panel__input"
                          value={value === '' || value === null ? '' : value}
                          onChange={(e) => {
                            const v = e.target.value;
                            setFilterModel({
                              ...currentFilterModel,
                              [col.id]: v === '' ? null : Number(v),
                            });
                          }}
                          placeholder="—"
                        />
                      )}
                      {col.filter === 'date' && (
                        <input
                          type="date"
                          className="dyn-table-filter-panel__input"
                          value={value === '' || value === null ? '' : String(value)}
                          onChange={(e) =>
                            setFilterModel({
                              ...currentFilterModel,
                              [col.id]: e.target.value || null,
                            })
                          }
                        />
                      )}
                      {col.filter === 'select' && (
                        <select
                          className="dyn-table-filter-panel__select"
                          value={value === '' || value === null ? '' : String(value)}
                          onChange={(e) =>
                            setFilterModel({
                              ...currentFilterModel,
                              [col.id]: e.target.value === '' ? null : e.target.value,
                            })
                          }
                        >
                          <option value="">Tümü</option>
                          {(col.filterSelectOptions ?? []).map((opt) => (
                            <option key={String(opt.value)} value={String(opt.value)}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          <div className="dyn-table-main__content">
      {isMobile ? (
        <div
          className="dyn-table-mobile"
          style={{
            ...(minHeight != null && {
              minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
            }),
            ...(height != null && {
              height: typeof height === 'number' ? `${height}px` : height,
            }),
          }}
        >
          {loading ? (
            <div className="dyn-table-cards" aria-busy>
              {Array.from({ length: Math.min(skeletonRowCount, 5) }, (_, idx) => (
                <div key={`skeleton-card-${idx}`} className="dyn-table-card dyn-table-card--skeleton">
                  {rowSelection && (
                    <div className="dyn-table-card__selection">
                      <span className="dyn-table-skeleton dyn-table-skeleton--checkbox" />
                    </div>
                  )}
                  {visibleColumns.map((col) => (
                    <div key={col.id} className="dyn-table-card__row">
                      <span className="dyn-table-card__label">
                        {typeof col.header === 'string' ? col.header : col.id}
                      </span>
                      <span className="dyn-table-card__value">
                        <span className="dyn-table-skeleton" />
                      </span>
                    </div>
                  ))}
                  {actions != null && <div className="dyn-table-card__actions" />}
                </div>
              ))}
            </div>
          ) : displayData.length === 0 ? (
            <div className="dyn-table-empty dyn-table-empty--card">
              {emptyMessage}
            </div>
          ) : (
            <div className="dyn-table-cards">
              {displayData.map((row, index) => {
                const rowKey = getRowKey(row) as string | number;
                return (
                <div
                  key={rowKey}
                  className={`dyn-table-card ${typeof rowClassName === 'function' ? (rowClassName as (row: T, index: number) => string)(row, index) : rowClassName ?? ''}`.trim()}
                >
                  {rowSelection && (
                    <div className="dyn-table-card__selection">
                      <label className="dyn-table-selection-cell">
                        <input
                          type="checkbox"
                          checked={selectedSet.has(rowKey)}
                          onChange={() => toggleRow(rowKey)}
                          aria-label="Satırı seç"
                        />
                      </label>
                    </div>
                  )}
                  {visibleColumns.map((col) => {
                    const value = getCellValue(row, col);
                    const display = getCellDisplay(row, col, value);
                    return (
                      <div key={col.id} className="dyn-table-card__row">
                        <span className="dyn-table-card__label">
                          {typeof col.header === 'string' ? col.header : col.header}
                        </span>
                        <span className="dyn-table-card__value">{display}</span>
                      </div>
                    );
                  })}
                  {actions != null && (
                    <div className="dyn-table-card__actions">
                      {actions(row)}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
      <div
        ref={scrollRef}
        className={`dyn-table-scroll ${useVirtualization ? 'dyn-table-scroll--virtualized' : ''} ${useStickyHeader ? 'dyn-table-scroll--sticky-header' : ''}`.trim()}
        style={{
          ...(minHeight != null && {
            minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
          }),
          ...(height != null && {
            height: typeof height === 'number' ? `${height}px` : height,
          }),
          ...(useVirtualization && {
            overflowY: 'auto',
            height: height != null
              ? (typeof height === 'number' ? `${height}px` : height)
              : minHeight != null
                ? (typeof minHeight === 'number' ? `${minHeight}px` : minHeight)
                : 400,
          }),
          ...(useStickyHeader && !useVirtualization && {
            overflowY: 'auto',
            height: height != null
              ? (typeof height === 'number' ? `${height}px` : height)
              : minHeight != null
                ? (typeof minHeight === 'number' ? `${minHeight}px` : minHeight)
                : 400,
          }),
        }}
        onScroll={useVirtualization ? (e) => setScrollTop(e.currentTarget.scrollTop) : undefined}
      >
        <table className="dyn-table dyn-table--fixed">
        <colgroup>
          {rowSelection && (
            <col style={{ width: SELECTION_COLUMN_WIDTH }} />
          )}
          {visibleColumns.map((col, i) => (
            <col key={col.id} style={{ width: computedWidths[i], minWidth: getMinWidthForColumn(col) }} />
          ))}
          {actions != null && (
            <col style={{ width: actionsWidthPx }} />
          )}
        </colgroup>
        <thead className={headerClassName}>
          <tr>
            {rowSelection && (
              <th className="dyn-table-th dyn-table-th--selection" style={{ width: SELECTION_COLUMN_WIDTH }}>
                <SelectionHeaderCheckbox
                  displayData={displayData}
                  getRowKey={getRowKey}
                  selectedSet={selectedSet}
                  onToggleAll={toggleAllOnPage}
                />
              </th>
            )}
            {visibleColumns.map((col, i) => {
              const isSortable = sortable && col.sortable !== false && !col.suppressSort;
              const isSorted = sortState.id === col.id;
              const isPinnedLeft = col.pinned === 'left';
              const isPinnedRight = col.pinned === 'right';
              const isDragging = draggedColId === col.id;
              const isDragOver = dragOverIndex === i;
              const thClass = [
                'dyn-table-th',
                isSortable ? 'dyn-table-th--sortable' : '',
                isSorted ? 'dyn-table-th--sorted' : '',
                col.resizable ? 'dyn-table-th--resizable' : '',
                isPinnedLeft ? 'dyn-table-th--pinned-left' : '',
                isPinnedRight ? 'dyn-table-th--pinned-right' : '',
                isDragging ? 'dyn-table-th--dragging' : '',
                isDragOver ? 'dyn-table-th--drag-over' : '',
                col.headerClass ?? '',
              ].filter(Boolean).join(' ');
              return (
                <th
                  key={col.id}
                  className={thClass}
                  style={{
                    width: computedWidths[i],
                    minWidth: getMinWidthForColumn(col),
                    maxWidth: parseWidth(col.maxWidth),
                    textAlign: col.headerAlign ?? col.align ?? 'left',
                    ...(isPinnedLeft && pinnedLeftOffsets[i] != null
                      ? { left: pinnedLeftOffsets[i] }
                      : {}),
                    ...(isPinnedRight && pinnedRightOffsets[i] != null
                      ? { right: pinnedRightOffsets[i] }
                      : {}),
                    ...col.headerStyle,
                  }}
                  title={col.headerTooltip}
                  onClick={() => isSortable && handleSort(col.id)}
                  onDragOver={columnReorder && !isMobile ? (e) => handleColumnDragOver(e, i) : undefined}
                  onDragLeave={columnReorder && !isMobile ? handleColumnDragLeave : undefined}
                  onDrop={columnReorder && !isMobile ? (e) => handleColumnDrop(e, i) : undefined}
                >
                  <span className="dyn-table-th__content">
                    {columnReorder && !isMobile && (
                      <span
                        className="dyn-table-th__drag-handle"
                        draggable
                        onDragStart={(e) => handleColumnDragStart(e, col.id)}
                        onDragEnd={handleColumnDragEnd}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`${col.id} kolonunu taşı`}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M8 6h2V4H8v2zm0 4h2V8H8v2zm0 4h2v-2H8v2zm4-8h2V4h-2v2zm0 4h2V8h-2v2zm0 4h2v-2h-2v2z" />
                        </svg>
                      </span>
                    )}
                    {col.header}
                    {isSortable && (
                      <span className="dyn-table-sort" aria-hidden>
                        {isSorted && sortState.direction === 'asc' && (
                          <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                            <path d="M7 15l5-5 5 5H7z" />
                          </svg>
                        )}
                        {isSorted && sortState.direction === 'desc' && (
                          <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                            <path d="M7 10l5 5 5-5H7z" />
                          </svg>
                        )}
                        {!isSorted && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M7 15l5-5 5 5H7z" />
                          </svg>
                        )}
                      </span>
                    )}
                  </span>
                  {col.resizable && (
                    <ResizeHandle
                      colId={col.id}
                      minWidth={getMinWidthForColumn(col)}
                      maxWidth={parseWidth(col.maxWidth)}
                      startWidth={computedWidths[i]}
                      onResize={(w) =>
                        setColumnWidths((prev) => ({ ...prev, [col.id]: w }))
                      }
                    />
                  )}
                </th>
              );
            })}
            {actions != null && (
              <th
                className="dyn-table-th dyn-table-th--actions"
                style={{
                  width: actionsWidthPx,
                  minWidth: actionsWidthPx,
                  textAlign: actionsAlign,
                }}
              >
                {actionsHeader}
              </th>
            )}
          </tr>
        </thead>
        <tbody className={bodyClassName}>
          {loading ? (
            Array.from({ length: skeletonRowCount }, (_, rowIdx) => (
              <tr key={`skeleton-${rowIdx}`} className="dyn-table-row--skeleton" aria-busy>
                {rowSelection && (
                  <td className="dyn-table-td dyn-table-td--selection" style={{ width: SELECTION_COLUMN_WIDTH }}>
                    <span className="dyn-table-skeleton dyn-table-skeleton--checkbox" />
                  </td>
                )}
                {visibleColumns.map((col, i) => (
                  <td
                    key={col.id}
                    className="dyn-table-td"
                    style={{
                      width: computedWidths[i],
                      minWidth: getMinWidthForColumn(col),
                      textAlign: col.align ?? 'left',
                    }}
                  >
                    <span className="dyn-table-skeleton" />
                  </td>
                ))}
                {actions != null && (
                  <td className="dyn-table-td dyn-table-td--actions" style={{ width: actionsWidthPx }} />
                )}
              </tr>
            ))
          ) : displayData.length === 0 ? (
            <tr>
              <td
                colSpan={
                  visibleColumns.length +
                  (actions != null ? 1 : 0) +
                  (rowSelection ? 1 : 0)
                }
                className="dyn-table-empty"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : useVirtualization ? (
            <>
              {virtualStart > 0 && (
                <tr aria-hidden className="dyn-table-virtual-spacer">
                  <td
                    colSpan={
                      visibleColumns.length +
                      (actions != null ? 1 : 0) +
                      (rowSelection ? 1 : 0)
                    }
                    style={{ height: virtualStart * rowHeight, padding: 0, border: 'none', verticalAlign: 'top', lineHeight: 0 }}
                  />
                </tr>
              )}
              {displayData.slice(virtualStart, virtualEnd).map((row, idx) => {
                const index = virtualStart + idx;
                const rowKey = getRowKey(row) as string | number;
                return (
                  <tr
                    key={rowKey}
                    style={{ height: rowHeight }}
                    className={[
                      typeof rowClassName === 'function'
                        ? (rowClassName as (row: T, index: number) => string)(row, index)
                        : (rowClassName ?? ''),
                      rowSelection && selectedSet.has(rowKey) ? 'dyn-table-row--selected' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    {rowSelection && (
                      <td className="dyn-table-td dyn-table-td--selection" style={{ width: SELECTION_COLUMN_WIDTH }}>
                        <label className="dyn-table-selection-cell">
                          <input
                            type="checkbox"
                            checked={selectedSet.has(rowKey)}
                            onChange={() => toggleRow(rowKey)}
                            aria-label="Satırı seç"
                          />
                        </label>
                      </td>
                    )}
                    {visibleColumns.map((col, i) => {
                      const value = getCellValue(row, col);
                      const display =
                        col.cell != null
                          ? col.cell(row)
                          : col.valueFormatter != null
                            ? col.valueFormatter(value, row)
                            : col.valueFormat != null
                              ? applyValueFormat(value, col.valueFormat, col.valueFormatOptions)
                              : col.cellFormat != null
                                ? renderCellFormat(col.cellFormat, value, row, col.cellFormatOptions)
                                : (value as React.ReactNode);
                      const cellClass =
                        typeof col.cellClass === 'function'
                          ? col.cellClass(row, value)
                          : col.cellClass ?? '';
                      const cellStyle =
                        typeof col.cellStyle === 'function'
                          ? col.cellStyle(row, value)
                          : col.cellStyle ?? {};
                      const tooltip = col.tooltip?.(row, value);
                      const isPinnedLeft = col.pinned === 'left';
                      const isPinnedRight = col.pinned === 'right';
                      const tdClass = [
                        'dyn-table-td',
                        isPinnedLeft ? 'dyn-table-td--pinned-left' : '',
                        isPinnedRight ? 'dyn-table-td--pinned-right' : '',
                        cellClass,
                      ].filter(Boolean).join(' ');
                      return (
                        <td
                          key={col.id}
                          className={tdClass.trim()}
                          style={{
                            width: computedWidths[i],
                            minWidth: getMinWidthForColumn(col),
                            textAlign: col.align ?? 'left',
                            ...(col.wrapText ? { whiteSpace: 'normal' } : {}),
                            ...(isPinnedLeft && pinnedLeftOffsets[i] != null
                              ? { left: pinnedLeftOffsets[i] }
                              : {}),
                            ...(isPinnedRight && pinnedRightOffsets[i] != null
                              ? { right: pinnedRightOffsets[i] }
                              : {}),
                            ...cellStyle,
                          }}
                          title={tooltip}
                        >
                          {display}
                        </td>
                      );
                    })}
                    {actions != null && (
                      <td
                        className="dyn-table-td dyn-table-td--actions"
                        style={{ textAlign: actionsAlign }}
                      >
                        {actions(row)}
                      </td>
                    )}
                  </tr>
                );
              })}
              {virtualEnd < displayData.length && (
                <tr aria-hidden className="dyn-table-virtual-spacer">
                  <td
                    colSpan={
                      visibleColumns.length +
                      (actions != null ? 1 : 0) +
                      (rowSelection ? 1 : 0)
                    }
                    style={{ height: (displayData.length - virtualEnd) * rowHeight, padding: 0, border: 'none', verticalAlign: 'top', lineHeight: 0 }}
                  />
                </tr>
              )}
            </>
          ) : (
            displayData.map((row, index) => {
              const rowKey = getRowKey(row) as string | number;
              return (
              <tr
                key={rowKey}
                className={[
                  typeof rowClassName === 'function'
                    ? (rowClassName as (row: T, index: number) => string)(row, index)
                    : (rowClassName ?? ''),
                  rowSelection && selectedSet.has(rowKey) ? 'dyn-table-row--selected' : '',
                ].filter(Boolean).join(' ')}
              >
                {rowSelection && (
                  <td className="dyn-table-td dyn-table-td--selection" style={{ width: SELECTION_COLUMN_WIDTH }}>
                    <label className="dyn-table-selection-cell">
                      <input
                        type="checkbox"
                        checked={selectedSet.has(rowKey)}
                        onChange={() => toggleRow(rowKey)}
                        aria-label={`Satırı seç`}
                      />
                    </label>
                  </td>
                )}
                {visibleColumns.map((col, i) => {
                  const value = getCellValue(row, col);
                  const display =
                    col.cell != null
                      ? col.cell(row)
                      : col.valueFormatter != null
                        ? col.valueFormatter(value, row)
                        : col.valueFormat != null
                          ? applyValueFormat(value, col.valueFormat, col.valueFormatOptions)
                          : col.cellFormat != null
                            ? renderCellFormat(col.cellFormat, value, row, col.cellFormatOptions)
                            : (value as React.ReactNode);
                  const cellClass =
                    typeof col.cellClass === 'function'
                      ? col.cellClass(row, value)
                      : col.cellClass ?? '';
                  const cellStyle =
                    typeof col.cellStyle === 'function'
                      ? col.cellStyle(row, value)
                      : col.cellStyle ?? {};
                  const tooltip = col.tooltip?.(row, value);
                  const isPinnedLeft = col.pinned === 'left';
                  const isPinnedRight = col.pinned === 'right';
                  const tdClass = [
                    'dyn-table-td',
                    isPinnedLeft ? 'dyn-table-td--pinned-left' : '',
                    isPinnedRight ? 'dyn-table-td--pinned-right' : '',
                    cellClass,
                  ].filter(Boolean).join(' ');
                  return (
                    <td
                      key={col.id}
                      className={tdClass.trim()}
                      style={{
                        width: computedWidths[i],
                        minWidth: getMinWidthForColumn(col),
                        textAlign: col.align ?? 'left',
                        ...(col.wrapText ? { whiteSpace: 'normal' } : {}),
                        ...(isPinnedLeft && pinnedLeftOffsets[i] != null
                          ? { left: pinnedLeftOffsets[i] }
                          : {}),
                        ...(isPinnedRight && pinnedRightOffsets[i] != null
                          ? { right: pinnedRightOffsets[i] }
                          : {}),
                        ...cellStyle,
                      }}
                      title={tooltip}
                    >
                      {display}
                    </td>
                  );
                })}
                {actions != null && (
                  <td
                    className="dyn-table-td dyn-table-td--actions"
                    style={{ textAlign: actionsAlign }}
                  >
                    {actions(row)}
                  </td>
                )}
              </tr>
              );
            })
          )}
        </tbody>
      </table>
      </div>
      )}
          </div>
        </div>
      ) : (
        isMobile ? (
        <div
          className="dyn-table-mobile"
          style={{
            ...(minHeight != null && {
              minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
            }),
            ...(height != null && {
              height: typeof height === 'number' ? `${height}px` : height,
            }),
          }}
        >
          {loading ? (
            <div className="dyn-table-cards" aria-busy>
              {Array.from({ length: Math.min(skeletonRowCount, 5) }, (_, idx) => (
                <div key={`skeleton-card-${idx}`} className="dyn-table-card dyn-table-card--skeleton">
                  {rowSelection && (
                    <div className="dyn-table-card__selection">
                      <span className="dyn-table-skeleton dyn-table-skeleton--checkbox" />
                    </div>
                  )}
                  {visibleColumns.map((col) => (
                    <div key={col.id} className="dyn-table-card__row">
                      <span className="dyn-table-card__label">
                        {typeof col.header === 'string' ? col.header : col.id}
                      </span>
                      <span className="dyn-table-card__value">
                        <span className="dyn-table-skeleton" />
                      </span>
                    </div>
                  ))}
                  {actions != null && <div className="dyn-table-card__actions" />}
                </div>
              ))}
            </div>
          ) : displayData.length === 0 ? (
            <div className="dyn-table-empty dyn-table-empty--card">
              {emptyMessage}
            </div>
          ) : (
            <div className="dyn-table-cards">
              {displayData.map((row) => {
                const rowKey = getRowKey(row) as string | number;
                return (
                  <div
                    key={rowKey}
                    className={`dyn-table-card ${typeof rowClassName === 'function' ? (rowClassName as (row: T, index: number) => string)(row, 0) : rowClassName ?? ''}`.trim()}
                  >
                    {rowSelection && (
                      <div className="dyn-table-card__selection">
                        <label className="dyn-table-selection-cell">
                          <input
                            type="checkbox"
                            checked={selectedSet.has(rowKey)}
                            onChange={() => toggleRow(rowKey)}
                            aria-label="Satırı seç"
                          />
                        </label>
                      </div>
                    )}
                    {visibleColumns.map((col) => {
                      const value = getCellValue(row, col);
                      const display = getCellDisplay(row, col, value);
                      return (
                        <div key={col.id} className="dyn-table-card__row">
                          <span className="dyn-table-card__label">
                            {typeof col.header === 'string' ? col.header : col.header}
                          </span>
                          <span className="dyn-table-card__value">{display}</span>
                        </div>
                      );
                    })}
                    {actions != null && (
                      <div className="dyn-table-card__actions">
                        {actions(row)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className={`dyn-table-scroll ${useVirtualization ? 'dyn-table-scroll--virtualized' : ''} ${useStickyHeader ? 'dyn-table-scroll--sticky-header' : ''}`.trim()}
          style={{
            ...(minHeight != null && {
              minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
            }),
            ...(height != null && {
              height: typeof height === 'number' ? `${height}px` : height,
            }),
            ...(useVirtualization && {
              overflowY: 'auto',
              height: height != null
                ? (typeof height === 'number' ? `${height}px` : height)
                : minHeight != null
                  ? (typeof minHeight === 'number' ? `${minHeight}px` : minHeight)
                  : 400,
            }),
            ...(useStickyHeader && !useVirtualization && {
              overflowY: 'auto',
              height: height != null
                ? (typeof height === 'number' ? `${height}px` : height)
                : minHeight != null
                  ? (typeof minHeight === 'number' ? `${minHeight}px` : minHeight)
                  : 400,
            }),
          }}
          onScroll={useVirtualization ? (e) => setScrollTop(e.currentTarget.scrollTop) : undefined}
        >
          <table className="dyn-table dyn-table--fixed">
            <colgroup>
              {rowSelection && <col style={{ width: SELECTION_COLUMN_WIDTH }} />}
              {visibleColumns.map((col, i) => (
                <col key={col.id} style={{ width: computedWidths[i], minWidth: getMinWidthForColumn(col) }} />
              ))}
              {actions != null && <col style={{ width: actionsWidthPx }} />}
            </colgroup>
            <thead className={headerClassName}>
              <tr>
                {rowSelection && (
                  <th className="dyn-table-th dyn-table-th--selection" style={{ width: SELECTION_COLUMN_WIDTH }}>
                    <SelectionHeaderCheckbox
                      displayData={displayData}
                      getRowKey={getRowKey}
                      selectedSet={selectedSet}
                      onToggleAll={toggleAllOnPage}
                    />
                  </th>
                )}
                {visibleColumns.map((col, i) => {
                  const isSortable = sortable && col.sortable !== false && !col.suppressSort;
                  const isSorted = sortState.id === col.id;
                  const isDragging = draggedColId === col.id;
                  const isDragOver = dragOverIndex === i;
                  const thClass = [
                    'dyn-table-th',
                    isSortable ? 'dyn-table-th--sortable' : '',
                    isSorted ? 'dyn-table-th--sorted' : '',
                    col.resizable ? 'dyn-table-th--resizable' : '',
                    isDragging ? 'dyn-table-th--dragging' : '',
                    isDragOver ? 'dyn-table-th--drag-over' : '',
                    col.headerClass ?? '',
                  ].filter(Boolean).join(' ');
                  return (
                    <th
                      key={col.id}
                      className={thClass}
                      style={{
                        width: computedWidths[i],
                        minWidth: getMinWidthForColumn(col),
                        maxWidth: parseWidth(col.maxWidth),
                        textAlign: col.headerAlign ?? col.align ?? 'left',
                        ...col.headerStyle,
                      }}
                      title={col.headerTooltip}
                      onClick={() => isSortable && handleSort(col.id)}
                      onDragOver={columnReorder && !isMobile ? (e) => handleColumnDragOver(e, i) : undefined}
                      onDragLeave={columnReorder && !isMobile ? handleColumnDragLeave : undefined}
                      onDrop={columnReorder && !isMobile ? (e) => handleColumnDrop(e, i) : undefined}
                    >
                      <span className="dyn-table-th__content">
                        {columnReorder && !isMobile && (
                          <span
                            className="dyn-table-th__drag-handle"
                            draggable
                            onDragStart={(e) => handleColumnDragStart(e, col.id)}
                            onDragEnd={handleColumnDragEnd}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`${col.id} kolonunu taşı`}
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                              <path d="M8 6h2V4H8v2zm0 4h2V8H8v2zm0 4h2v-2H8v2zm4-8h2V4h-2v2zm0 4h2V8h-2v2zm0 4h2v-2h-2v2z" />
                            </svg>
                          </span>
                        )}
                        {col.header}
                        {isSortable && (
                          <span className="dyn-table-sort" aria-hidden>
                            {isSorted && sortState.direction === 'asc' && (
                              <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                                <path d="M7 15l5-5 5 5H7z" />
                              </svg>
                            )}
                            {isSorted && sortState.direction === 'desc' && (
                              <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                                <path d="M7 10l5 5 5-5H7z" />
                              </svg>
                            )}
                            {!isSorted && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M7 15l5-5 5 5H7z" />
                              </svg>
                            )}
                          </span>
                        )}
                      </span>
                      {col.resizable && (
                        <ResizeHandle
                          colId={col.id}
                          minWidth={getMinWidthForColumn(col)}
                          maxWidth={parseWidth(col.maxWidth)}
                          startWidth={computedWidths[i]}
                          onResize={(w) =>
                            setColumnWidths((prev) => ({ ...prev, [col.id]: w }))
                          }
                        />
                      )}
                    </th>
                  );
                })}
                {actions != null && (
                  <th
                    className="dyn-table-th dyn-table-th--actions"
                    style={{
                      width: actionsWidthPx,
                      minWidth: actionsWidthPx,
                      textAlign: actionsAlign,
                    }}
                  >
                    {actionsHeader}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className={bodyClassName}>
              {loading ? (
                Array.from({ length: skeletonRowCount }, (_, rowIdx) => (
                  <tr key={`skeleton-${rowIdx}`} className="dyn-table-row--skeleton" aria-busy>
                    {rowSelection && (
                      <td className="dyn-table-td dyn-table-td--selection" style={{ width: SELECTION_COLUMN_WIDTH }}>
                        <span className="dyn-table-skeleton dyn-table-skeleton--checkbox" />
                      </td>
                    )}
                    {visibleColumns.map((col, i) => (
                      <td
                        key={col.id}
                        className="dyn-table-td"
                        style={{ width: computedWidths[i], minWidth: getMinWidthForColumn(col), textAlign: col.align ?? 'left' }}
                      >
                        <span className="dyn-table-skeleton" />
                      </td>
                    ))}
                    {actions != null && (
                      <td className="dyn-table-td dyn-table-td--actions" style={{ width: actionsWidthPx }} />
                    )}
                  </tr>
                ))
              ) : displayData.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      visibleColumns.length +
                      (actions != null ? 1 : 0) +
                      (rowSelection ? 1 : 0)
                    }
                    className="dyn-table-empty"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                displayData.map((row, index) => {
                  const rowKey = getRowKey(row) as string | number;
                  return (
                    <tr
                      key={rowKey}
                      className={[
                        typeof rowClassName === 'function'
                          ? (rowClassName as (row: T, index: number) => string)(row, index)
                          : (rowClassName ?? ''),
                        rowSelection && selectedSet.has(rowKey) ? 'dyn-table-row--selected' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      {rowSelection && (
                        <td className="dyn-table-td dyn-table-td--selection" style={{ width: SELECTION_COLUMN_WIDTH }}>
                          <label className="dyn-table-selection-cell">
                            <input
                              type="checkbox"
                              checked={selectedSet.has(rowKey)}
                              onChange={() => toggleRow(rowKey)}
                              aria-label={`Satırı seç`}
                            />
                          </label>
                        </td>
                      )}
                      {visibleColumns.map((col, i) => {
                        const value = getCellValue(row, col);
                        const display =
                          col.cell != null
                            ? col.cell(row)
                            : col.valueFormatter != null
                              ? col.valueFormatter(value, row)
                              : col.valueFormat != null
                                ? applyValueFormat(value, col.valueFormat, col.valueFormatOptions)
                                : col.cellFormat != null
                                  ? renderCellFormat(col.cellFormat, value, row, col.cellFormatOptions)
                                  : (value as React.ReactNode);
                        const cellClass =
                          typeof col.cellClass === 'function'
                            ? col.cellClass(row, value)
                            : col.cellClass ?? '';
                        const cellStyle =
                          typeof col.cellStyle === 'function'
                            ? col.cellStyle(row, value)
                            : col.cellStyle ?? {};
                        const tooltip = col.tooltip?.(row, value);
                        const isPinnedLeft = col.pinned === 'left';
                        const isPinnedRight = col.pinned === 'right';
                        const tdClass = [
                          'dyn-table-td',
                          isPinnedLeft ? 'dyn-table-td--pinned-left' : '',
                          isPinnedRight ? 'dyn-table-td--pinned-right' : '',
                          cellClass,
                        ].filter(Boolean).join(' ');
                        return (
                          <td
                            key={col.id}
                            className={tdClass.trim()}
                            style={{
                              width: computedWidths[i],
                              minWidth: getMinWidthForColumn(col),
                              textAlign: col.align ?? 'left',
                              ...(col.wrapText ? { whiteSpace: 'normal' } : {}),
                              ...(isPinnedLeft && pinnedLeftOffsets[i] != null
                                ? { left: pinnedLeftOffsets[i] }
                                : {}),
                              ...(isPinnedRight && pinnedRightOffsets[i] != null
                                ? { right: pinnedRightOffsets[i] }
                                : {}),
                              ...cellStyle,
                            }}
                            title={tooltip}
                          >
                            {display}
                          </td>
                        );
                      })}
                      {actions != null && (
                        <td
                          className="dyn-table-td dyn-table-td--actions"
                          style={{ textAlign: actionsAlign }}
                        >
                          {actions(row)}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )
      )}
      {pagination && totalCount > 0 && (
        <div className="dyn-table-pagination">
          <div className="dyn-table-pagination__info">
            {startRow}-{endRow} / {totalCount} kayıt
          </div>
          <div className="dyn-table-pagination__controls">
            <select
              className="dyn-table-pagination__pagesize"
              value={pageSize}
              onChange={(e) => {
                const next = Number(e.target.value);
                setPageSize(next);
                handlePageChange(1, next);
              }}
              aria-label="Sayfa başına kayıt"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="dyn-table-pagination__btn"
              disabled={safePage <= 1}
              onClick={() => handlePageChange(safePage - 1, pageSize)}
              aria-label="Önceki sayfa"
            >
              Önceki
            </button>
            <span className="dyn-table-pagination__page">
              Sayfa {safePage} / {totalPages}
            </span>
            <button
              type="button"
              className="dyn-table-pagination__btn"
              disabled={safePage >= totalPages}
              onClick={() => handlePageChange(safePage + 1, pageSize)}
              aria-label="Sonraki sayfa"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
