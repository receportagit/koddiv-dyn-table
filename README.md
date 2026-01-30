# DynTable

React tabanlı dinamik, tam fonksiyonlu tablo komponenti. AG Grid tarzı kolon özellikleri: sıralama, filtre, sayfalama, sanal listeleme, kolon görünürlük/sıra (sürükle-bırak), sabit kolonlar, yükleme skeleton’ı. İleride npm paketi olarak yayınlanacak şekilde yapılandırıldı.

## Kurulum

**Paketi kullanmak (npm / yarn):**

```bash
npm install dyn-table
# veya
yarn add dyn-table
```

**Geliştirme / demo için (repo klonlandığında):**

```bash
npm install
```

## Geliştirme

Demo uygulamasını çalıştırır (tabloyu test etmek için):

```bash
npm run dev
```

## Paket build (npm yayını için)

```bash
npm run build
```

Çıktı: `dist/` — `dyn-table.js` (ESM), `dyn-table.umd.cjs`, `*.d.ts`, `dyn-table.css`.

**npm / yarn ile yayınlama:** Adımlar için [PUBLISH.md](./PUBLISH.md) dosyasına bakın.

---

## Kullanım

```tsx
import { Table } from 'dyn-table';
import type { ColumnDef } from 'dyn-table';
import 'dyn-table/dist/style.css';

<Table<MyRow>
  data={veri}
  columns={columns}
  keyColumnId="id"
  emptyMessage="Kayıt yok"
  theme="light"
  pagination
  pageSize={25}
  loading={isLoading}
/>
```

Yaygın prop’lar: `theme`, `pagination`, `pageSize`, `filterable`, `rowSelection`, `virtualization`, `loading`, `columnVisibility` / `columnOrder`. Satır anahtarı: `keyColumnId="id"` (DB kolonu) veya `keyExtractor` (özel fonksiyon).

---

## Table props

| Prop | Tip | Açıklama |
|------|-----|----------|
| `data` | `T[]` | Satır verisi |
| `columns` | `ColumnDef<T>[]` | Kolon tanımları |
| `keyExtractor` | `(row: T) => string \| number` | Satır benzersiz anahtarı (fonksiyon); `keyColumnId` verilmezse zorunlu |
| `keyColumnId` | `string` | Satır anahtarının alınacağı kolon id’si (örn. DB’deki `id`); `keyExtractor` verilmezse kullanılır |
| `sortable` | `boolean` | Genel sıralama açık/kapalı (varsayılan: `true`) |
| `defaultSort` | `{ id: string; direction: 'asc' \| 'desc' \| null }` | Varsayılan sıralama |
| `onSort` | `(id, direction) => void` | Sıralama değişince callback |
| `emptyMessage` | `ReactNode` | Veri yokken gösterilecek içerik |
| `className` | `string` | Wrapper class |
| `headerClassName` | `string` | thead class |
| `bodyClassName` | `string` | tbody class |
| `rowClassName` | `string \| (row, index) => string` | Satır class |
| `rowSelection` | `boolean` | Satır seçimi (checkbox kolonu) |
| `selectedRowKeys` | `(string \| number)[]` | Seçili satır anahtarları (kontrollü) |
| `defaultSelectedRowKeys` | `(string \| number)[]` | Başlangıç seçili anahtarlar (kontrollü değilse) |
| `onSelectionChange` | `(selectedKeys, selectedRows: T[]) => void` | Seçim değişince callback |
| `selectionToolbarLabel` | `(row: T) => string` | Toolbar dropdown’da satır etiketi; verilmezse key gösterilir |
| `theme` | `'light' \| 'dark'` | Açık/koyu tema |
| `actions` | `(row: T) => ReactNode` | Satır bazlı aksiyon butonları (son kolon) |
| `actionsHeader` | `ReactNode` | Aksiyon kolonu başlığı |
| `actionsAlign` | `'left' \| 'center' \| 'right'` | Aksiyon kolonu hizalama |
| `actionsWidth` | `string \| number` | Aksiyon kolonu genişliği |
| `pagination` | `boolean` | Sayfalama açık |
| `pageSize` | `number` | Sayfa başına satır (varsayılan: 10) |
| `pageSizeOptions` | `number[]` | Sayfa boyutu seçenekleri |
| `page` | `number` | Kontrollü mevcut sayfa (1 tabanlı) |
| `defaultPage` | `number` | Başlangıç sayfası |
| `onPageChange` | `(page, pageSize) => void` | Sayfa / sayfa boyutu değişince |
| `totalCount` | `number` | Toplam kayıt (server-side) |
| `onBlockNeeded` | `(page: number) => void` | Blok tabanlı sayfalama: kullanıcı bu sayfaya geçti ama data bu sayfayı kapsamıyor; blok yüklemesi yap (page 1 tabanlı) |
| `blockSize` | `number` | Blok boyutu (örn. 100); bilgi/doğrulama için (opsiyonel) |
| `minHeight` | `string \| number` | Tablo alanı min yükseklik |
| `height` | `string \| number` | Tablo alanı sabit yükseklik |
| `mobileBreakpoint` | `number` | Bu genişliğin altında kart görünümü (varsayılan: 768) |
| `filterable` | `boolean` | Filtre paneli (toolbar’da Filtre butonu, sağdan açılan panel) |
| `filterModel` | `Record<string, string \| number \| null>` | Filtre değerleri (kontrollü) |
| `defaultFilterModel` | `Record<string, string \| number \| null>` | Başlangıç filtre değerleri |
| `onFilterChange` | `(filterModel) => void` | Filtre değişince |
| `filterPanelWidth` | `number` | Filtre paneli genişliği (varsayılan: 280) |
| `virtualization` | `boolean` | Sanal listeleme: sadece görünen satırları render (büyük veri için) |
| `rowHeight` | `number` | Sanal listelemede satır yüksekliği px (varsayılan: 44) |
| `virtualizationOverscan` | `number` | Görünüm dışı ekstra render satır sayısı (varsayılan: 5) |
| `columnVisibility` | `Record<string, boolean>` | Kolon görünürlüğü (kontrollü); id → visible |
| `onColumnVisibilityChange` | `(visibility) => void` | Kolon görünürlüğü değişince |
| `columnOrder` | `string[]` | Kolon sırası (kontrollü); id listesi |
| `onColumnOrderChange` | `(order) => void` | Kolon sırası değişince |
| `columnReorder` | `boolean` | Kolon sürükle-bırak (header’da tutamaç ile sıra değiştirme); true iken etkin (varsayılan: true) |
| `loading` | `boolean` | Yükleme durumu; true iken skeleton satırlar (mobilde skeleton kartlar) gösterilir |
| `stickyHeader` | `boolean` | Yapışkan header; true iken dikey scroll’da thead sabit kalır; height veya minHeight verilmeli |

---

## Yapılanlar

- **Kolon:** Sıralama, `valueGetter` / `valueFormatter` / `valueFormat`, `cellFormat` (status, yesNo, badge vb.), `cell` / `cellClass` / `cellStyle`, tooltip, `comparator`, `wrapText`, `hide`, `align` / `headerAlign`
- **Kolon genişlik:** `width` / `minWidth` / `maxWidth`, **resize** (`resizable: true` ile sürükleyerek genişlik), 
- **flex** (kalan alanı orantılı paylaşma), **pinned** (`pinned: 'left' | 'right'` ile yatay scroll’da sol/sağ sabit), `table-layout: fixed` + colgroup
- **Tema:** `theme: 'light' | 'dark'`, tüm bileşenlerde CSS değişkenleri ile uyumlu
- **Aksiyon kolonu:** `actions`, `actionsHeader`, `actionsAlign`, `actionsWidth`, sağda sticky
- **Sayfalama:** `pagination`, `pageSize`, `pageSizeOptions`, client/server-side, sayfa bilgisi + önceki/sonraki
- **Yükseklik:** `minHeight`, `height`, scroll alanı
- **Mobil:** `mobileBreakpoint` altında kart görünümü (etiket–değer), seçim checkbox’ı kartta
- **Satır seçimi:** Checkbox kolonu, header’da “tümünü seç” (sayfa), `selectedRowKeys` / `onSelectionChange`, kontrollü veya `defaultSelectedRowKeys`
- **Toolbar:** `rowSelection`, `filterable` veya birden fazla kolon olduğunda: Tümünü seç, Kaldır, seçilenler dropdown, 
- **Filtre** butonu, 
- **Kolonlar** dropdown (görünürlük); mobilde kompakt
- **Kolon görünürlük:** Toolbar’da «Kolonlar» dropdown ile kolon aç/kapa; `columnVisibility` / `onColumnVisibilityChange` ile kontrollü
- **Kolon sıralama (drag):** Başlıktaki tutamaç ile sürükleyerek kolon sırası değiştirme; `columnOrder` / `onColumnOrderChange` ile kontrollü; mobilde devre dışı
- **Filtre paneli:** `filterable`, sağdan açılan panel (AG Grid tarzı), overlay ile kapatma; kolonlarda `filter: 'text' | 'number' | 'date' | 'select'`, `filterSelectOptions`; client-side filtreleme, «Filtreleri temizle»
- **Sanal listeleme (virtualization):** `virtualization`, `rowHeight`, `virtualizationOverscan`; çok büyük veride sadece görünen satırlar render edilir, mobilde devre dışı
- **Yükleme durumu (loading):** `loading={true}` iken masaüstünde skeleton satırlar, mobilde skeleton kartlar; shimmer animasyonu
- **Yapışkan header (stickyHeader):** `stickyHeader={true}` iken dikey scroll’da thead sabit kalır; `height` veya `minHeight` verilmeli; mobilde devre dışı
- **Blok tabanlı sayfalama:** `onBlockNeeded(page)` — kullanıcı sayfaya geçtiğinde `currentPage * pageSize > data.length` ise bir kez tetiklenir; siz API’den blok yükleyip `data` güncellersiniz. İsteğe bağlı `blockSize`.

---

## Satır seçimi

`rowSelection={true}` ile tabloya sol tarafta **checkbox kolonu** eklenir. Header’daki checkbox **sayfadaki tüm satırları** seçer/kaldırır (indeterminate: kısmi seçim). Kontrollü kullanım için `selectedRowKeys` + `onSelectionChange`, kontrollü olmayan için `defaultSelectedRowKeys` kullanılır.

**Toolbar** `rowSelection` veya `filterable` verildiğinde görünür: «Tümünü seç», «Kaldır», seçilenler **dropdown** («N seçili»), **Filtre** butonu. Dropdown etiketleri için `selectionToolbarLabel={(row) => ...}` kullanılır.

```tsx
const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>([]);

<Table<MyRow>
  rowSelection
  selectedRowKeys={selectedKeys}
  onSelectionChange={(keys, rows) => setSelectedKeys(keys)}
  data={data}
  columns={columns}
  keyExtractor={(r) => r.id}
/>
```

Mobil kart görünümünde her kartın üstünde de checkbox gösterilir.

---

## Yükleme durumu (loading)

`loading={true}` iken tablo gövdesi yerine **skeleton** satırlar (masaüstü) veya **skeleton kartlar** (mobil) gösterilir. Shimmer animasyonu ile veri yüklenirken boş alan yerine placeholder görünür.

```tsx
const [loading, setLoading] = useState(true);
// fetch sonrası setLoading(false)

<Table<MyRow>
  loading={loading}
  data={data}
  columns={columns}
  keyExtractor={(r) => r.id}
/>
```

---

## Kolon görünürlük ve sıra

Birden fazla kolon olduğunda toolbar’da **Kolonlar** dropdown’ı çıkar; kolonları checkbox ile göster/gizle. `columnReorder={true}` (varsayılan) iken başlıktaki **sürükleme tutamacı** (grip ikonu) ile kolon sırası değiştirilir; `columnReorder={false}` ile kapatılır (mobilde zaten devre dışı). Kontrollü kullanım için `columnVisibility` + `onColumnVisibilityChange` ve `columnOrder` + `onColumnOrderChange`.

---

## Kolon tanımı (ColumnDef) — AG Grid tarzı

### Kimlik & veri

| Özellik | Tip | Açıklama |
|---------|-----|----------|
| `id` | `string` | Benzersiz kolon id (AG Grid: colId) |
| `header` | `string \| ReactNode` | Başlık (AG Grid: headerName) |
| `accessorKey` | `keyof T \| string` | Veri alanı (AG Grid: field) |
| `valueGetter` | `(row: T) => unknown` | Ham değeri custom getter ile al |
| `valueFormat` | `'date' \| 'datetime' \| 'time' \| 'number' \| 'currency' \| 'percent'` | Yerleşik format — valueFormatter yazmaya gerek yok |
| `valueFormatOptions` | `ValueFormatOptions` | valueFormat seçenekleri (locale, dateStyle, currency vb.) |
| `valueFormatter` | `(value, row: T) => ReactNode` | Görüntülenen değeri formatla (valueFormat’tan öncelikli) |
| `cell` | `(row: T) => ReactNode` | Hücre içeriği tam kontrol (valueFormatter’dan öncelikli) |

### Sıralama

| Özellik | Tip | Açıklama |
|---------|-----|----------|
| `sortable` | `boolean` | Sıralanabilir |
| `comparator` | `(valueA, valueB, rowA, rowB) => number` | Özel karşılaştırıcı |
| `suppressSort` | `boolean` | Bu kolonda sıralama kapalı |

### Boyut & hizalama

| Özellik | Tip | Açıklama |
|---------|-----|----------|
| `width` | `string \| number` | Genişlik (px veya string) |
| `minWidth` | `string \| number` | Min genişlik |
| `maxWidth` | `string \| number` | Max genişlik |
| `flex` | `number` | Kalan alanı orantılı paylaş (oran) |
| `align` | `'left' \| 'center' \| 'right'` | Hücre hizalama |
| `headerAlign` | `'left' \| 'center' \| 'right'` | Başlık hizalama |

### Görünürlük & sabitleme

| Özellik | Tip | Açıklama |
|---------|-----|----------|
| `hide` | `boolean` | Başlangıçta gizli |
| `pinned` | `'left' \| 'right'` | Yatay scroll’da sol/sağ sabit (sticky) |
| `resizable` | `boolean` | Sürükleyerek kolon genişliği değiştirilebilir |
| `filter` | `'text' \| 'number' \| 'date' \| 'select'` | Filtre panelinde bu kolon için filtre alanı |
| `filterSelectOptions` | `{ value; label }[]` | select filtresi seçenekleri |

### Stil

| Özellik | Tip | Açıklama |
|---------|-----|----------|
| `cellClass` | `string \| (row, value) => string` | Hücre CSS class |
| `headerClass` | `string` | Başlık CSS class |
| `cellStyle` | `CSSProperties \| (row, value) => CSSProperties` | Hücre inline style |
| `headerStyle` | `CSSProperties` | Başlık inline style |

### Tooltip

| Özellik | Tip | Açıklama |
|---------|-----|----------|
| `headerTooltip` | `string` | Başlık tooltip |
| `tooltip` | `(row, value) => string` | Hücre tooltip |

### Hücre formatörü (cellFormat)

Boolean değerler için hazır badge formatörleri — `cell` yazmaya gerek yok.

| cellFormat | Varsayılan true | Varsayılan false |
|------------|-----------------|------------------|
| `status` | Aktif | Pasif |
| `yesNo` | Evet | Hayır |
| `onOff` | Açık | Kapalı |
| `published` | Yayında | Taslak |
| `approved` | Onaylı | Beklemede |
| `badge` | (cellFormatOptions ile özel etiket) | |

`cellFormatOptions`: `activeLabel`, `inactiveLabel`, `activeClass`, `inactiveClass` ile override.

### Diğer

| Özellik | Tip | Açıklama |
|---------|-----|----------|
| `editable` | `boolean` | Düzenlenebilir — tip tanımlı, UI sonra |
| `wrapText` | `boolean` | Metin satır içinde kırılsın |

---

## Örnek kolon tanımları

```tsx
const columns: ColumnDef<DemoRow>[] = [
  { id: 'ad', header: 'Ad', accessorKey: 'ad', sortable: true },
  {
    id: 'yas',
    header: 'Yaş',
    accessorKey: 'yas',
    valueFormat: 'number',
    align: 'center',
  },
  {
    id: 'tarih',
    header: 'Tarih',
    accessorKey: 'createdAt',
    valueFormat: 'date',
    valueFormatOptions: { locale: 'tr-TR', dateStyle: 'medium' },
  },
  {
    id: 'maas',
    header: 'Maaş',
    accessorKey: 'maas',
    valueFormat: 'currency',
    valueFormatOptions: { currency: 'TRY', maximumFractionDigits: 0 },
    align: 'right',
  },
  {
    id: 'departman',
    header: 'Departman',
    accessorKey: 'departman',
    headerTooltip: 'Çalışan departmanı',
    tooltip: (row, value) => `${row.ad} — ${value}`,
  },
  {
    id: 'durum',
    header: 'Durum',
    cell: (row) => (row.aktif ? <Badge>Aktif</Badge> : <Badge>Pasif</Badge>),
    cellClass: (row) => (row.aktif ? 'text-green-600' : 'text-gray-500'),
  },
];
```

---

## Filtre paneli

`filterable={true}` ile toolbar’da **Filtre** butonu çıkar. Tıklanınca tablonun **sağından** panel açılır (AG Grid tarzı). Kolonlarda `filter: 'text' | 'number' | 'date' | 'select'` ve gerekirse `filterSelectOptions` tanımlanır. Filtreler client-side uygulanır; «Filtreleri temizle» ile sıfırlanır. Kontrollü kullanım için `filterModel` + `onFilterChange`.

```tsx
<Table<MyRow>
  filterable
  filterModel={filterModel}
  onFilterChange={setFilterModel}
  columns={[
    { id: 'ad', header: 'Ad', accessorKey: 'ad', filter: 'text' },
    { id: 'departman', header: 'Departman', accessorKey: 'departman', filter: 'select', filterSelectOptions: [{ value: 'Yazılım', label: 'Yazılım' }, ...] },
  ]}
  ...
/>
```

---

## Mobil görünüm (kart)

`mobileBreakpoint` (varsayılan **768px**) altında tablo yerine **satır başına kart** gösterilir: her satır bir kart, her kolon kartta «Etiket: Değer» satırı. Aksiyon butonları kartın altında.

| Prop | Tip | Açıklama |
|------|-----|----------|
| `mobileBreakpoint` | `number` | Bu genişliğin (px) altında kart görünümü (varsayılan: 768) |

Kullanım: `<Table mobileBreakpoint={768} ... />`. Pencereyi daraltınca veya gerçek cihazda kartlar görünür. `loading` iken mobilde skeleton kartlar gösterilir.

---

## Sanal listeleme (virtualization)

Çok satırlı veride performans için `virtualization={true}` kullanın. Sadece görünen satırlar render edilir. `minHeight` veya `height` verin; isteğe göre `rowHeight` (varsayılan 44) ve `virtualizationOverscan` (varsayılan 5) ayarlanabilir. Mobilde otomatik devre dışıdır.

```tsx
<Table<MyRow>
  virtualization
  minHeight={400}
  rowHeight={44}
  data={cokBuyukListe}
  columns={columns}
  keyExtractor={(r) => r.id}
/>
```

---

## Yapışkan header (stickyHeader)

Dikey scroll sırasında tablo başlığının sabit kalması için `stickyHeader={true}` kullanın. Tablo gövdesi scroll edilirken thead üstte kalır. `height` veya `minHeight` verilmeli (verilmezse varsayılan 400px kullanılır). Mobilde devre dışıdır.

```tsx
<Table<MyRow>
  stickyHeader
  minHeight={400}
  data={data}
  columns={columns}
  keyExtractor={(r) => r.id}
/>
```

---

## Sabit kolonlar (pinned)

Kolonlarda `pinned: 'left'` veya `pinned: 'right'` verildiğinde yatay scroll sırasında bu kolonlar sabit kalır (sticky). Sol sabit kolonlar en başta, sağ sabit kolonlar en sonda (aksiyon kolonundan önce) render edilir.

```tsx
{ id: 'ad', header: 'Ad', accessorKey: 'ad', pinned: 'left' },
{ id: 'maas', header: 'Maaş', accessorKey: 'maas', pinned: 'right' },
```

---

## Blok tabanlı sayfalama

API’den veri **bloklar halinde** (örn. 100’lük) yüklenir; kullanıcı sayfa değiştirdiğinde gerekli blok henüz yoksa tablo `onBlockNeeded(page)` ile haber verir, siz isteği atıp veriyi ekler/güncellersiniz.

### Akış

1. **blockSize** (örn. 100): API’den her istekte kaç kayıt geleceği.
2. **pageSize** (örn. 25): Tabloda sayfa başına satır; 100 kayıt = 4 sayfa.
3. İlk yükleme: `data = ilk 100 kayıt`, `totalCount = 500` (veya bilinmiyorsa verilmez).
4. Kullanıcı sayfa 1–4 arası gezer → mevcut `data` yeterli.
5. Kullanıcı **sayfa 5**’e geçer (kayıt 101–125) → `data.length` (100) &lt; `currentPage * pageSize` (125) → tablo **callback’i bir kez tetikler**.
6. Callback’te siz: “Sayfa 5 istendi, henüz 101–200 yok” deyip API’den 2. blok (101–200) çekersiniz; `data`’yı birleştirir veya güncellersiniz (örn. 200 kayıt). `totalCount` varsa güncellersiniz.
7. Sayfa 9’a geçince aynı mantıkla 3. blok (201–300) için callback tekrar tetiklenir; siz isteği atıp veriyi ekler/güncellersiniz.

### Prop’lar

| Prop | Tip | Açıklama |
|------|-----|----------|
| `onBlockNeeded` | `(page: number) => void` | Kullanıcı `page` numaralı sayfaya geçti ama `data` o sayfayı kapsamıyor; bu sayfa için blok yüklemesi yapılmalı. `page` 1 tabanlı. |
| `blockSize` (opsiyonel) | `number` | Blok boyutu (örn. 100). Sadece bilgi/doğrulama için; tetikleme `data.length` ve `currentPage * pageSize` ile yapılır. |

### Ne zaman tetiklenir?

- Sayfa değiştiğinde (kullanıcı pagination’da ileri/geri veya sayfa numarasına tıkladığında).
- Koşul: `currentPage * pageSize > data.length` → “Bu sayfayı göstermek için daha fazla kayıt lazım” → `onBlockNeeded(currentPage)` çağrılır.
- Aynı sayfa için tekrar tekrar tetiklemeyi önlemek için: sadece **sayfa değişiminde** ve yukarıdaki koşul sağlanıyorsa çağrı yapılır (isteğe bağlı: son tetiklenen sayfa tutulup aynı sayfa için tekrar çağrı yapılmaz).

### Kullanıcı (geliştirici) tarafı örnek

```tsx
const [data, setData] = useState<Row[]>([]);
const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
const BLOCK_SIZE = 100;
const PAGE_SIZE = 25;

// İlk blok
useEffect(() => {
  fetchPage(1).then(({ items, total }) => {
    setData(items);
    setTotalCount(total);
  });
}, []);

const handleBlockNeeded = useCallback((page: number) => {
  // page 5 → 101-125 arası lazım → 2. blok (101-200)
  const blockIndex = Math.ceil((page * PAGE_SIZE) / BLOCK_SIZE);
  const alreadyLoaded = data.length;
  if (blockIndex * BLOCK_SIZE <= alreadyLoaded) return; // zaten var
  fetchPage(blockIndex).then(({ items }) => {
    setData(prev => [...prev, ...items]); // veya replace, API’ye göre
  });
}, [data.length]);

<Table<Row>
  data={data}
  totalCount={totalCount}
  pageSize={PAGE_SIZE}
  onBlockNeeded={handleBlockNeeded}
  ...
/>
```

### Özet

- **void dönen callback:** `onBlockNeeded(page: number) => void` — “Bu sayfa için blok yükle” sinyali.
- **blockSize:** İsterseniz prop olarak verilir (API’nin blok boyutu); tetikleme mantığı `data.length` ve `currentPage * pageSize` ile yapılır.
- Geliştirici callback’te `page` ve `pageSize` ile hangi blok gerektiğini hesaplar, API’yi çağırır, `data` (ve gerekiyorsa `totalCount`) günceller; tablo birikmiş veriyi sayfaya göre dilimleyip gösterir. `onBlockNeeded` verildiğinde displayData her zaman `data`’dan sayfa dilimi olarak hesaplanır.

---

## Eksikler / eklenebilecekler

**Tiplerde var, UI yok**

- **Hücre düzenleme (editable)** — `editable: true` ile inline edit

**Yeni eklenebilecekler**

- **Genişletilebilir satır** — Satır tıklanınca altında detay/child satır
- **Çoklu sıralama** — Birden fazla kolona göre sıralama
- **Dışa aktarma** — CSV / Excel export butonu
- **Yoğunluk** — `density: 'compact' | 'comfortable'` ile satır yüksekliği
- **Özet satırı** — Tablo altında toplam / ortalama vb. (footer row)
- **Klavye navigasyonu** — Ok tuşları, Enter ile satır odaklama
- **Erişilebilirlik** — ARIA, focus yönetimi, ekran okuyucu uyumu

**Öncelik önerisi**

1. Genişletilebilir satır / Çoklu sıralama  

---

## Proje yapısı

- `src/index.ts` — Paket giriş noktası (sadece Table export)
- `src/components/Table/` — Tablo komponenti, tipler, stiller
- `src/main.tsx`, `src/App.tsx` — Sadece geliştirme demo’su (paket build’e dahil değil)
