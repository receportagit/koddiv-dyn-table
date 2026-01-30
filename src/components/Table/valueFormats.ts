import type { ValueFormatType, ValueFormatOptions } from './Table.types';

const defaultLocale = 'tr-TR';

function toDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isNaN(n)) return new Date(n);
  const s = String(value).trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function applyValueFormat(
  value: unknown,
  format: ValueFormatType,
  options: ValueFormatOptions = {}
): string {
  const locale = options.locale ?? defaultLocale;

  switch (format) {
    case 'date': {
      const d = toDate(value);
      if (!d) return value != null ? String(value) : '—';
      if (options.dateStyle != null) {
        return d.toLocaleDateString(locale, { dateStyle: options.dateStyle });
      }
      return d.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
    case 'datetime': {
      const d = toDate(value);
      if (!d) return value != null ? String(value) : '—';
      return d.toLocaleString(locale, {
        dateStyle: options.dateStyle ?? 'short',
        timeStyle: options.timeStyle ?? 'short',
      });
    }
    case 'time': {
      const d = toDate(value);
      if (!d) return value != null ? String(value) : '—';
      return d.toLocaleTimeString(locale, {
        timeStyle: options.timeStyle ?? 'short',
      });
    }
    case 'number': {
      const n = typeof value === 'number' ? value : Number(value);
      if (Number.isNaN(n)) return value != null ? String(value) : '—';
      return n.toLocaleString(locale, {
        minimumFractionDigits: options.minimumFractionDigits,
        maximumFractionDigits: options.maximumFractionDigits ?? 2,
      });
    }
    case 'currency': {
      const n = typeof value === 'number' ? value : Number(value);
      if (Number.isNaN(n)) return value != null ? String(value) : '—';
      return n.toLocaleString(locale, {
        style: 'currency',
        currency: options.currency ?? 'TRY',
        minimumFractionDigits: options.minimumFractionDigits,
        maximumFractionDigits: options.maximumFractionDigits ?? 2,
      });
    }
    case 'percent': {
      const n = typeof value === 'number' ? value : Number(value);
      if (Number.isNaN(n)) return value != null ? String(value) : '—';
      return n.toLocaleString(locale, {
        style: 'percent',
        minimumFractionDigits: options.minimumFractionDigits,
        maximumFractionDigits: options.maximumFractionDigits ?? 2,
      });
    }
    default:
      return value != null ? String(value) : '—';
  }
}
