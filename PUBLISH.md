# DynTable — npm / yarn paketi yayınlama yol haritası

Bu dosya paketi **npm** ve **yarn** ile yayınlamak için adım adım rehberdir.

---

## 1. Paket yapısı (mevcut)

- **Yayınlanan:** Sadece `dist/` klasörü (`files: ["dist"]`). Kaynak kod (`src/`) ve demo (`App.tsx`, `main.tsx`, `index.html`) pakete **dahil değil**.
- **Giriş:** `src/index.ts` → Table + tipler export edilir.
- **Build:** `npm run build` → `dist/dyn-table.js` (ESM), `dist/dyn-table.umd.cjs` (UMD), `dist/*.d.ts`, `dist/dyn-table.css`.

---

## 2. npm / yarn ile yayınlama adımları

### 2.1 Hesap ve giriş

**npm:**

```bash
# https://www.npmjs.com adresinden hesap oluşturun (yoksa)
npm login
# Username, Password, Email, OTP girin
```

**yarn (Classic):**

```bash
npm login
# yarn publish aynı npm registry kullanır; npm login yeterli
```

**yarn (Berry v2+):**

```bash
npm login
# veya yarn npm login
```

### 2.2 Paket adı ve sürüm

- **Paket adı:** `package.json` içindeki `"name"` (örn. `dyn-table`). npm’de **benzersiz** olmalı; alınmışsa `@kullaniciadi/dyn-table` gibi scope kullanın.
- **Sürüm:** `"version"` (örn. `0.1.0`). Her yayında artırın: `0.1.1`, `0.2.0`, `1.0.0` (semver).

### 2.3 Son kontroller

```bash
# Bağımlılıklar kurulu olsun
npm install

# Paketi build edin
npm run build

# dist/ içinde şunlar olmalı:
# - dyn-table.js (ESM)
# - dyn-table.umd.cjs (UMD)
# - index.d.ts (ve diğer .d.ts)
# - dyn-table.css (stil)
```

### 2.4 Yayınlama

**npm:**

```bash
# İlk kez veya güncelleme
npm publish

# Scope’lu paket (örn. @kullaniciadi/dyn-table) ise:
npm publish --access public
```

**yarn (Classic):**

```bash
yarn publish
# Sürüm ve tag sorulur; onaylayın
```

**yarn (Berry):**

```bash
yarn npm publish
```

### 2.5 Yayından sonra

- **npm:** https://www.npmjs.com/package/dyn-table
- **Kurulum (npm):** `npm install dyn-table`
- **Kurulum (yarn):** `yarn add dyn-table`

---

## 3. Kullanıcı tarafında kullanım

```bash
npm install dyn-table
# veya
yarn add dyn-table
```

```tsx
import { Table } from 'dyn-table';
import type { ColumnDef } from 'dyn-table';
import 'dyn-table/dist/dyn-table.css';  // veya package.json "exports" ile tanımlı yol

<Table data={data} columns={columns} keyExtractor={(r) => r.id} />
```

---

## 4. Yayın öncesi (opsiyonel)

- **Block test:** `App.tsx` içinde `onBlockNeeded` + JSONPlaceholder testi varsa, yayından önce `App.tsx`'i minimal hâline döndür (boş `data`, tek kolon). Paket sadece `dist/` yayınlar; `App.tsx` pakete dahil değildir, ama repo temiz kalır.

## 5. Özet kontrol listesi

- [ ] `package.json`: `name`, `version`, `main`, `module`, `types`, `exports`, `files`, `peerDependencies`
- [ ] `npm run build` hatasız çalışıyor
- [ ] `dist/` içinde ESM, UMD, `.d.ts`, CSS var
- [ ] `npm login` yapıldı
- [ ] Paket adı npm’de müsait (veya scope kullanıldı)
- [ ] `npm publish` veya `yarn publish` çalıştırıldı

---

## 6. Güncelleme yayını

Sürüm artırıp tekrar yayınlayın:

```bash
# package.json içinde "version"ı değiştirin (örn. 0.1.0 → 0.1.1)
npm run build
npm publish
```
