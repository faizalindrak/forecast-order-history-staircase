# Stair Forecast Dashboard

Aplikasi web untuk memvisualisasikan dan mengelola forecast MRP dengan pola stair (tangga), dukungan versioning per bulan, serta workflow upload yang terintegrasi.

## Fitur Utama

- **Stair Pattern** – Tabel forecast dalam pola diagonal berbasis snapshot `ORDER DATE`.
- **Delta Mode** – Toggle untuk membandingkan nilai antar snapshot order.
- **Versioning Forecast** – Setiap bulan forecast memiliki version number (mis. v10, v20) dengan selector versi dan fallback otomatis.
- **Ship-To Granularity** – Satu SKU dapat memiliki beberapa tujuan pengiriman (ship-to) untuk analisis per lokasi.
- **Searchable SKU Selector** – Dropdown dengan pencarian instan berdasarkan nomor part atau nama part.
- **Halaman Upload Khusus** – `/upload` menyediakan form, ringkasan hasil proses, dan tombol unduh template.
- **Template CSV Relatif** – Kolom `N` hingga `N+6` merepresentasikan bulan relatif terhadap `ORDER DATE`, ditambah kolom `ORDER VERSION` opsional.
- **Export Excel** – Menghasilkan sheet forecast dan delta dalam satu file.
- **Tema Adaptif** – Toggle dark/light, sidebar responsif, serta navigasi mobile.

## Quick Start

1. Instal dependensi:
   ```bash
   npm install
   ```

2. Siapkan database & seed contoh:
   ```bash
   npm run db:push
   npm run db:seed
   ```

3. Jalankan development server:
   ```bash
   npm run dev
   ```

4. Akses aplikasi di [http://localhost:3000](http://localhost:3000).

## Stair Pattern & Versioning

- Setiap baris mewakili snapshot `ORDER DATE`.
- Kolom merepresentasikan bulan forecast, disusun kronologis.
- Nilai kosong menandakan ketiadaan data untuk rentang tersebut.
- Delta mode menghitung Δ terhadap snapshot sebelumnya untuk bulan yang sama.
- Selector versi per bulan otomatis menggunakan versi terbesar bila versi diminta tidak tersedia (fallback). 

## Database Commands

- `npm run db:push` – Sinkronisasi schema Prisma ke database SQLite.
- `npm run db:seed` – Seed contoh dengan berbagai versi forecast.
- `npm run db:reset` – Menghapus seluruh data.
- `npm run db:reset-seed` – Reset dan seed ulang.

## Seed Data

Seed bawaan memuat beberapa SKU, setiap SKU memiliki beberapa `ORDER DATE` dengan versi forecast (mis. v10 & v20) untuk rentang Jul-24 s.d. Mei-25, serta ship-to sampel (`ST-JKT`, `ST-SMG`, `ST-SBY`). Data ini menunjang uji coba selector versi, filter ship-to, delta, dan ekspor.

## Struktur Database

### SKU
- `id`
- `partNumber` (unique)
- `partName`
- `order`

### ForecastVersion
- `id`
- `month` (DateTime UTC, hari pertama bulan)
- `version`
- Relasi: memiliki banyak `ForecastEntry`

### ForecastEntry
- `id`
- `forecastVersionId` → `ForecastVersion`
- `skuId` → `SKU`
- `shipToId` → `ShipTo`
- `orderMonth` (DateTime UTC)
- `value`
- Unique constraint: (`forecastVersionId`, `skuId`, `shipToId`, `orderMonth`)

### ShipTo
- `id`
- `skuId` → `SKU`
- `code` (unique per SKU)
- `name` (opsional)

## API Ringkas

### GET `/api/skus`
Mengambil daftar SKU (tanpa forecast) untuk dropdown dan halaman upload.

### POST `/api/skus`
Membuat SKU baru.

### GET `/api/forecast?skuId={id}&version={latest|angka}`
Mengambil entry forecast untuk SKU dan versi tertentu. Response mencantumkan `fallbackMonths` saat versi diminta tidak tersedia dan otomatis memakai versi terbaru.

### POST `/api/forecast`
Upsert entry forecast spesifik versi.
```json
{
  "skuId": "sku_id",
  "orderDate": "Jul-24",
  "month": "Sep-24",
  "version": 20,
  "value": 4100
}
```

### PUT `/api/forecast`
Bulk upsert forecast (masing-masing baris menyertakan `version`).

### POST `/api/upload`
Memproses file CSV pada halaman upload.

-Format header:
```
PART NUMBER,PART NAME,ORDER,SHIP TO,SHIP TO NAME,ORDER DATE,ORDER VERSION,N,N+1,N+2,N+3,N+4,N+5,N+6
```
- `SHIP TO` wajib diisi untuk mengidentifikasi tujuan pengiriman per SKU (gunakan kode unik per SKU, contoh: `ST-JKT`).
- `SHIP TO NAME` opsional; bila diisi akan memperbarui deskripsi tujuan pengiriman.
- `ORDER VERSION` opsional (default 10 bila kosong).
- Kolom `N` mewakili bulan order, `N+1` bulan berikutnya, dst.
- Sistem mengonversi label relatif ke bulan kalender aktual.
- Response mengembalikan ringkasan baris berhasil, SKU baru, dan versi yang digunakan.

## Delta Mode

- Δ ditampilkan (opsional) di bawah nilai utama.
- Warna hijau (kenaikan) / merah (penurunan) sesuai tanda Δ.
- Perhitungan: `current value` − `value snapshot sebelumnya` pada kolom yang sama.

## UI Highlights

- Sidebar dengan navigasi dashboard & upload.
- Dropdown SKU searchable dengan highlight hasil.
- Halaman upload khusus + tombol unduh template CSV.
- Tabel dengan header/kolom pertama sticky.
- Toggle tema light/dark.

## Teknologi

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui.
- **Backend**: Next.js Route Handlers.
- **Database**: SQLite + Prisma ORM.
- **Utilities**: `xlsx-js-style` untuk ekspor, cmdk untuk pencarian dropdown.

## Development Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run db:reset-seed`

## Catatan

- Sistem tidak melakukan prediksi otomatis; semua nilai berasal dari upload/manual.
- Δ hanya dihitung bila snapshot sebelumnya tersedia.
- Template CSV dapat diunduh langsung dari halaman upload.