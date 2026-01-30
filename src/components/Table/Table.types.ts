import type { ReactNode, CSSProperties } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

/** Yerleşik hücre formatı — valueFormatter yazmadan kullan */
export type ValueFormatType =
  | 'date'
  | 'datetime'
  | 'time'
  | 'number'
  | 'currency'
  | 'percent';

/** Yerleşik hücre formatörü tipi (TableFormatters ile kullanılır) */
export type CellFormatType =
  | 'status'    // Aktif / Pasif
  | 'yesNo'     // Evet / Hayır
  | 'onOff'     // Açık / Kapalı
  | 'published' // Yayında / Taslak
  | 'approved'  // Onaylı / Beklemede
  | 'badge';    // Özel etiketler (cellFormatOptions ile activeLabel / inactiveLabel zorunlu)

/** cellFormat seçenekleri — tüm boolean/badge formatörleri için (etiketler varsayılanı override eder) */
export interface CellFormatStatusOptions {
  /** true iken gösterilecek metin */
  activeLabel?: string;
  /** false iken gösterilecek metin */
  inactiveLabel?: string;
  /** true iken badge CSS class */
  activeClass?: string;
  /** false iken badge CSS class */
  inactiveClass?: string;
}

export type CellFormatOptions = CellFormatStatusOptions;

/** valueFormat için seçenekler (Intl / toLocaleString uyumlu) */
export interface ValueFormatOptions {
  /** Locale (varsayılan: tr-TR) */
  locale?: string;
  /** Tarih formatı (date / datetime için) */
  dateStyle?: 'short' | 'medium' | 'long' | 'full';
  /** Saat formatı (time / datetime için) */
  timeStyle?: 'short' | 'medium' | 'long' | 'full';
  /** Para birimi kodu (currency için: TRY, USD vb.) */
  currency?: string;
  /** Ondalık min basamak (number / currency / percent) */
  minimumFractionDigits?: number;
  /** Ondalık max basamak (number / currency / percent) */
  maximumFractionDigits?: number;
}

/** AG Grid tarzı kolon tanımı */
export interface ColumnDef<T = unknown> {
  /** Benzersiz kolon id (AG Grid: colId) */
  id: string;
  /** Başlık veya özel React node (AG Grid: headerName) */
  header: string | ReactNode;
  /** Veri alanı (AG Grid: field) */
  accessorKey?: keyof T | string;
  /** Ham değeri almak için custom getter (AG Grid: valueGetter) */
  valueGetter?: (row: T) => unknown;
  /** Yerleşik format: date, datetime, time, number, currency, percent — valueFormatter yazmaya gerek yok */
  valueFormat?: ValueFormatType;
  /** valueFormat için seçenekler (locale, dateStyle, currency vb.) */
  valueFormatOptions?: ValueFormatOptions;
  /** Görüntülenen değeri formatlamak için (valueFormat’tan öncelikli) (AG Grid: valueFormatter) */
  valueFormatter?: (value: unknown, row: T) => ReactNode;
  /** Hücre içeriği tam kontrol (valueFormatter’dan öncelikli) (AG Grid: cellRenderer) */
  cell?: (row: T) => ReactNode;

  /** Yerleşik hücre formatörü: cell yazmadan badge/status göster (TableFormatters) */
  cellFormat?: CellFormatType;
  /** cellFormat için seçenekler */
  cellFormatOptions?: CellFormatOptions;

  /** Sıralanabilir */
  sortable?: boolean;
  /** Özel karşılaştırıcı (AG Grid: comparator) */
  comparator?: (valueA: unknown, valueB: unknown, rowA: T, rowB: T) => number;

  /** Genişlik (px veya string) */
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  /** Kalan alanı paylaş (AG Grid: flex) — number = oran */
  flex?: number;

  /** Hücre hizalama */
  align?: 'left' | 'center' | 'right';
  headerAlign?: 'left' | 'center' | 'right';

  /** Başlangıçta gizli (AG Grid: hide) */
  hide?: boolean;
  /** Sabit sol/sağ (AG Grid: pinned) */
  pinned?: 'left' | 'right';
  /** Kullanıcı genişlik değiştirebilir (AG Grid: resizable) */
  resizable?: boolean;

  /** Hücre CSS class — string veya (row) => string */
  cellClass?: string | ((row: T, value: unknown) => string);
  /** Başlık CSS class */
  headerClass?: string;
  /** Hücre inline style — object veya (row, value) => object */
  cellStyle?: CSSProperties | ((row: T, value: unknown) => CSSProperties);
  /** Başlık inline style */
  headerStyle?: CSSProperties;

  /** Başlık tooltip */
  headerTooltip?: string;
  /** Hücre tooltip (row, value) => string */
  tooltip?: (row: T, value: unknown) => string;

  /** Düzenlenebilir (AG Grid: editable) */
  editable?: boolean;
  /** Metin satır içinde kırılsın (AG Grid: wrapText) */
  wrapText?: boolean;
  /** Sıralamayı kapat (kolon bazlı) */
  suppressSort?: boolean;

  /** Filtre tipi — toolbar filtre panelinde gösterilir */
  filter?: 'text' | 'number' | 'date' | 'select';
  /** select filtresi için seçenekler */
  filterSelectOptions?: { value: string | number; label: string }[];
}

export type TableTheme = 'light' | 'dark';

export interface TableProps<T = unknown> {
  data: T[];
  columns: ColumnDef<T>[];
  /** Satır benzersiz anahtarı (fonksiyon) — keyColumnId verilmezse zorunlu */
  keyExtractor?: (row: T) => string | number;
  /** Satır anahtarının alınacağı kolon id’si (örn. DB’deki id alanı); keyExtractor verilmezse kullanılır */
  keyColumnId?: string;
  sortable?: boolean;
  defaultSort?: { id: string; direction: SortDirection };
  onSort?: (id: string, direction: SortDirection) => void;
  emptyMessage?: ReactNode;
  /** Tema: light (açık) veya dark (koyu) */
  theme?: TableTheme;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  /** Satır bazlı aksiyon butonları — son kolon olarak eklenir */
  actions?: (row: T) => ReactNode;
  /** Aksiyon kolonu başlığı */
  actionsHeader?: ReactNode;
  /** Aksiyon kolonu hizalama */
  actionsAlign?: 'left' | 'center' | 'right';
  /** Aksiyon kolonu genişliği; verilmezse içeriğe (buton sayısına) göre otomatik hesaplanır */
  actionsWidth?: string | number;

  /** Sayfalama açık */
  pagination?: boolean;
  /** Sayfa başına satır (varsayılan: 10) */
  pageSize?: number;
  /** Sayfa boyutu seçenekleri (dropdown) */
  pageSizeOptions?: number[];
  /** Kontrollü mevcut sayfa (1 tabanlı); verilmezse defaultPage + iç state */
  page?: number;
  /** Başlangıç sayfası (pagination açık, page verilmediğinde) */
  defaultPage?: number;
  /** Sayfa veya sayfa boyutu değişince; server-side için kullan */
  onPageChange?: (page: number, pageSize: number) => void;
  /** Toplam kayıt (server-side); verilmezse client-side: data.length, veri dilimlenir */
  totalCount?: number;
  /** Blok tabanlı sayfalama: kullanıcı bu sayfaya geçti ama data bu sayfayı kapsamıyor; blok yüklemesi yap (page 1 tabanlı) */
  onBlockNeeded?: (page: number) => void;
  /** Blok boyutu (örn. 100); API’den her istekte kaç kayıt geldiği — bilgi/doğrulama için (opsiyonel) */
  blockSize?: number;

  /** Tablo alanı min yükseklik (px veya string); sayfa değişince kısalmasın */
  minHeight?: string | number;
  /** Tablo alanı sabit yükseklik (px veya string); verilirse scroll alanı bu yükseklikte kalır */
  height?: string | number;

  /** Mobil kart görünümü: bu genişliğin (px) altında satırlar kart olarak aşağı doğru listelenir */
  mobileBreakpoint?: number;

  /** Satır seçimi (checkbox kolonu) */
  rowSelection?: boolean;
  /** Seçili satır anahtarları (kontrollü) */
  selectedRowKeys?: (string | number)[];
  /** Başlangıç seçili anahtarlar (kontrollü değilse) */
  defaultSelectedRowKeys?: (string | number)[];
  /** Seçim değişince: (selectedKeys, selectedRows) */
  onSelectionChange?: (selectedKeys: (string | number)[], selectedRows: T[]) => void;
  /** Seçim toolbar'da badge metni (satır başına); verilmezse key gösterilir */
  selectionToolbarLabel?: (row: T) => string;

  /** Filtre paneli (toolbar’da Filtre butonu, sağdan açılan panel) */
  filterable?: boolean;
  /** Filtre değerleri (kontrollü); kolon id → değer */
  filterModel?: Record<string, string | number | null>;
  /** Başlangıç filtre değerleri (kontrollü değilse) */
  defaultFilterModel?: Record<string, string | number | null>;
  /** Filtre değişince */
  onFilterChange?: (filterModel: Record<string, string | number | null>) => void;
  /** Filtre paneli genişliği (px; varsayılan 280) */
  filterPanelWidth?: number;

  /** Sanal listeleme: sadece görünen satırları render eder (çok büyük veri için); height veya minHeight gerekir */
  virtualization?: boolean;
  /** Satır yüksekliği (px; varsayılan 44); virtualization açıkken kullanılır */
  rowHeight?: number;
  /** Görünür alanın dışında kaç satır daha render edilsin (varsayılan 5) */
  virtualizationOverscan?: number;

  /** Kolon görünürlüğü (kontrollü); id -> visible */
  columnVisibility?: Record<string, boolean>;
  /** Kolon görünürlüğü değişince */
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  /** Kolon sırası (kontrollü); id listesi */
  columnOrder?: string[];
  /** Kolon sırası değişince */
  onColumnOrderChange?: (order: string[]) => void;
  /** Kolon sürükle-bırak (header’da tutamaç ile sıra değiştirme); true iken etkin (varsayılan: true) */
  columnReorder?: boolean;

  /** Yükleme durumu; true iken skeleton satırlar (veya mobilde skeleton kartlar) gösterilir */
  loading?: boolean;

  /** Yapışkan header; true iken dikey scroll’da thead sabit kalır; height veya minHeight verilmeli */
  stickyHeader?: boolean;
}
