import './TableRowActions.css';

/** Tek bir aksiyon butonunun genişliği (px) — CSS .table-row-actions__btn ile uyumlu */
export const ACTION_BUTTON_WIDTH = 32;
/** Butonlar arası boşluk (px) — CSS .table-row-actions gap ile uyumlu */
export const ACTION_BUTTON_GAP = 8;
/** Hücre yatay padding (px) — tablo td padding * 2 */
const ACTION_CELL_PADDING = 32;

/** Aksiyon kolonu genişliği: buton sayısına göre hesaplar. actionsWidth={getActionsColumnWidth(2)} */
export function getActionsColumnWidth(buttonCount: number): number {
  if (buttonCount <= 0) return 0;
  return (
    buttonCount * ACTION_BUTTON_WIDTH +
    (buttonCount - 1) * ACTION_BUTTON_GAP +
    ACTION_CELL_PADDING
  );
}

export interface TableRowActionsProps<T> {
  row: T;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  editLabel?: string;
  deleteLabel?: string;
}

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export function TableRowActions<T>({
  row,
  onEdit,
  onDelete,
  editLabel = 'Düzenle',
  deleteLabel = 'Sil',
}: TableRowActionsProps<T>) {
  return (
    <div className="table-row-actions">
      <button
        type="button"
        className="table-row-actions__btn table-row-actions__btn--edit"
        onClick={() => onEdit(row)}
        title={editLabel}
        aria-label={editLabel}
      >
        <EditIcon />
      </button>
      <button
        type="button"
        className="table-row-actions__btn table-row-actions__btn--delete"
        onClick={() => onDelete(row)}
        title={deleteLabel}
        aria-label={deleteLabel}
      >
        <DeleteIcon />
      </button>
    </div>
  );
}
