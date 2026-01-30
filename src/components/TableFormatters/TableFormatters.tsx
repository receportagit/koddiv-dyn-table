import type { ReactNode } from 'react';
import type { CellFormatType, CellFormatOptions } from '../Table/Table.types';
import './TableFormatters.css';

/**
 * Varsayılan etiketler — cellFormat tipine göre true/false metinleri.
 * cellFormatOptions ile activeLabel / inactiveLabel verilerek override edilebilir.
 */
const DEFAULT_LABELS: Record<CellFormatType, { active: string; inactive: string }> = {
  status: { active: 'Aktif', inactive: 'Pasif' },
  yesNo: { active: 'Evet', inactive: 'Hayır' },
  onOff: { active: 'Açık', inactive: 'Kapalı' },
  published: { active: 'Yayında', inactive: 'Taslak' },
  approved: { active: 'Onaylı', inactive: 'Beklemede' },
  badge: { active: 'Evet', inactive: 'Hayır' }, // özel için cellFormatOptions zorunlu önerilir
};

export interface StatusBadgeProps {
  value: unknown;
  activeLabel?: string;
  inactiveLabel?: string;
  activeClass?: string;
  inactiveClass?: string;
}

const defaultActiveClass = 'table-formatter-status table-formatter-status--active';
const defaultInactiveClass = 'table-formatter-status table-formatter-status--inactive';

export function StatusBadge({
  value,
  activeLabel = 'Aktif',
  inactiveLabel = 'Pasif',
  activeClass = defaultActiveClass,
  inactiveClass = defaultInactiveClass,
}: StatusBadgeProps) {
  const isActive = value === true || value === 'true' || value === 1;
  const label = isActive ? activeLabel : inactiveLabel;
  const className = isActive ? activeClass : inactiveClass;
  return <span className={className}>{label}</span>;
}

function getLabelsForFormat(formatType: CellFormatType, options: CellFormatOptions) {
  const defaults = DEFAULT_LABELS[formatType];
  return {
    activeLabel: options.activeLabel ?? defaults.active,
    inactiveLabel: options.inactiveLabel ?? defaults.inactive,
  };
}

export function renderCellFormat(
  formatType: CellFormatType,
  value: unknown,
  _row: unknown,
  options: CellFormatOptions = {}
): ReactNode {
  const { activeLabel, inactiveLabel } = getLabelsForFormat(formatType, options);
  return (
    <StatusBadge
      value={value}
      activeLabel={activeLabel}
      inactiveLabel={inactiveLabel}
      activeClass={options.activeClass}
      inactiveClass={options.inactiveClass}
    />
  );
}
