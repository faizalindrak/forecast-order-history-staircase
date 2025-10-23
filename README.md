# Stair Forecast Dashboard

Aplikasi web untuk menampilkan dan mengelola data forecast dengan pola stair (tangga) sesuai contoh yang diberikan.

## Fitur

- **Stair Pattern**: Data forecast ditampilkan dalam pola diagonal seperti tangga
- **Order-based Rows**: Baris berdasarkan Order Date (Jul-24, Agu-24, dll)
- **Delta Mode**: Toggle untuk menampilkan perubahan vs order sebelumnya
- **Dark Theme**: UI gelap sesuai contoh dengan warna emerald/red untuk delta
- **Data Upload**: Upload data CSV dengan format stair pattern
- **Database**: Penyimpanan data menggunakan SQLite dengan Prisma ORM
- **Export**: Export data ke format CSV
- **Responsive Design**: Tampilan yang optimal di desktop dan mobile

## Quick Start

1. Install dependencies:
   
   ```bash
   npm install
   ```

2. Setup database dan seed data:
   
   ```bash
   npm run db:push
   npm run db:seed
   ```

3. Jalankan development server:
   
   ```bash
   npm run dev
   ```

4. Buka http://localhost:3000

## Stair Pattern

Aplikasi menampilkan data dalam pola stair (tangga) di mana:

- Setiap baris mewakili satu Order Date
- Data diagonal membentuk pola tangga
- Empty cells menunjukkan data tidak tersedia
- Delta mode membandingkan dengan order sebelumnya

### Contoh Tampilan:

```
Order    | Jul-24 | Agu-24 | Sep-24 | Okt-24 | Nov-24 | Des-24
Jul-24   |  3800  |  4600  |  4100  |  3900  |  3561  |  3391
Agu-24   |        |  2700  |  4300  |  4500  |  4200  |  4000
Sep-24   |        |        |  3900  |  3500  |  4000  |  4800
Okt-24   |        |        |        |  2900  |  4500  |  5800
```

## Database Commands

- `npm run db:push` - Push schema changes ke database
- `npm run db:seed` - Tambahkan sample data ke database
- `npm run db:reset-seed` - Reset database dan seed ulang
- `npm run db:reset` - Reset database (hapus semua data)

## Seed Data

Aplikasi sudah include seed data dengan stair pattern:

### Order Dates per SKU:

Setiap SKU memiliki multiple order dates:

- **Jul-24**: 6 bulan forecast
- **Agu-24**: 6 bulan forecast  
- **Sep-24**: 6 bulan forecast
- **Okt-24**: 6 bulan forecast
- **Nov-24**: 6 bulan forecast
- **Des-24**: 6 bulan forecast

### Data Coverage:

- 12 bulan data forecast (Jul-24 hingga Jun-25)
- Total 54 records forecast data
- Stair pattern yang realistis dengan fluktuasi

## Struktur Database

### SKU

- `id`: Primary key
- `partNumber`: Nomor part (unique)
- `partName`: Nama part
- `order`: Nomor order

### ForecastData

- `id`: Primary key
- `skuId`: Foreign key ke SKU
- `orderDate`: Tanggal order (format: MMM-YY)
- `month`: Bulan forecast (format: MMM-YY)
- `value`: Nilai forecast

## API Endpoints

### GET /api/skus

Mendapatkan semua SKU dengan data forecast-nya

### POST /api/skus

Membuat SKU baru

```json
{
  "partNumber": "001234",
  "partName": "FINISH GOOD NO 1",
  "order": "ORDER001"
}
```

### GET /api/forecast?skuId={id}

Mendapatkan data forecast untuk SKU tertentu

### POST /api/forecast

Membuat/memperbarui data forecast

```json
{
  "skuId": "sku_id",
  "orderDate": "Jul-24",
  "month": "Jul-24",
  "value": 3800
}
```

### PUT /api/forecast

Bulk update data forecast

```json
{
  "data": [
    {
      "skuId": "sku_id",
      "orderDate": "Jul-24",
      "month": "Jul-24",
      "value": 3800
    }
  ]
}
```

### POST /api/upload

Upload file CSV dengan stair pattern
Format CSV yang diharapkan:

```
PART NUMBER,PART NAME,ORDER,ORDER DATE,Jul-24,Agu-24,Sep-24,Okt-24,Nov-24,Des-24,...
001234,FINISH GOOD 1,ORDER001,Jul-24,3800,4600,4100,3900,3561,3391,...## Cara Upload Data

```

1. Siapkan file CSV dengan format:
   
   - Kolom 1: PART NUMBER
   - Kolom 2: PART NAME  
   - Kolom 3: ORDER
   - Kolom 4: ORDER DATE (Jul-24, Agu-24, dll)
   - Kolom 5+: Data per bulan (Jul-24, Agu-24, dll)

2. Setiap SKU bisa memiliki multiple baris (satu untuk setiap order date)

3. Empty cells untuk data yang tidak tersedia

4. Gunakan fitur upload di dashboard

5. Pilih file CSV dan klik Upload

6. Data akan otomatis diproses dan disimpan ke database

## Delta Mode

Delta mode menampilkan perubahan nilai dari order sebelumnya:

- **Hijau (Emerald)**: Penambahan nilai (+delta)
- **Merah (Red)**: Pengurangan nilai (-delta)
- **Normal**: Menampilkan nilai absolut
- **Perhitungan**: Current Value - Previous Order Value

## UI Features

### Dark Theme

- Background: `neutral-950`
- Text: `neutral-100`
- Cards: `neutral-900` dengan border `neutral-800`
- Table: Sticky header dan first column

### Delta Toggle Button

- Warna emerald saat ON
- Warna neutral saat OFF
- Animasi smooth transition

### Table Styling

- Background cells: `#202020` untuk data yang ada
- Empty cells: Transparent
- Hover effects dan proper spacing

## Sample CSV Files

- `sample_data.csv` - Contoh data dengan stair pattern
- Gunakan file ini sebagai template untuk upload data baru

## Teknologi

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: SQLite dengan Prisma ORM
- **UI Components**: shadcn/ui dengan Lucide icons
- **Styling**: Dark theme dengan neutral colors

## Development

- Development server: `npm run dev`
- Build untuk production: `npm run build`
- Lint code: `npm run lint`
- Reset & seed database: `npm run db:reset-seed`

## Notes

- Semua nilai diambil langsung dari data yang di-upload
- Tidak ada forecast otomatis atau perhitungan matematika
- Saat Delta ON, setiap sel menunjukkan perubahan (Δ) terhadap snapshot order sebelumnya
- Empty cells tetap kosong dan tidak diisi dengan forecast otomatis