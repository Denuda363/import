/**
 * Preset Scenarios for Common Excel Image 1 -> Image 2 Transformations
 */
import { PresetScenario } from '../types/transformer';

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'unpivot-sales',
    title: 'Kasus 1: Tabel Matrix Bulanan ke Baris (Unpivot / Wide to Long)',
    subtitle: 'Kolom Bulan (Jan, Feb, Mar...) diubah menjadi 1 kolom Bulan & 1 kolom Jumlah',
    category: 'Rekap & Penjualan',
    image1Description: 'Tabel berbentuk horizontal (Wide): Kolom nama barang diikuti kolom bulan per bulan (Januari, Februari, Maret, dst.)',
    image2Description: 'Tabel vertikal (Flat/Long): Setiap baris berisi Nama Produk, Bulan, dan Jumlah. Cocok untuk Pivot Table & Database.',
    sampleInput: {
      headers: ['No', 'Kode_Produk', 'Nama_Produk', 'Kategori', 'Januari', 'Februari', 'Maret', 'April'],
      rows: [
        { No: 1, Kode_Produk: 'PRD-001', Nama_Produk: 'Laptop ASUS Vivobook', Kategori: 'Elektronik', Januari: 15, Februari: 18, Maret: 22, April: 20 },
        { No: 2, Kode_Produk: 'PRD-002', Nama_Produk: 'Mouse Wireless Logitech', Kategori: 'Aksesoris', Januari: 85, Februari: 92, Maret: 110, April: 95 },
        { No: 3, Kode_Produk: 'PRD-003', Nama_Produk: 'Keyboard Mechanical RGB', Kategori: 'Aksesoris', Januari: 42, Februari: 38, Maret: 50, April: 62 },
        { No: 4, Kode_Produk: 'PRD-004', Nama_Produk: 'Monitor LG 24 Inch', Kategori: 'Elektronik', Januari: 12, Februari: 16, Maret: 19, April: 25 },
        { No: 5, Kode_Produk: 'PRD-005', Nama_Produk: 'Headset Gaming Razer', Kategori: 'Audio', Januari: 30, Februari: 28, Maret: 35, April: 40 },
        { No: 'TOTAL', Kode_Produk: '', Nama_Produk: 'Total Penjualan Q1', Kategori: '', Januari: 184, Februari: 192, Maret: 236, April: 242 },
      ],
    },
    pipelineConfig: {
      filterClean: {
        removeEmptyRows: true,
        removeTotalRows: true,
        totalRowKeywords: ['total', 'grand total', 'subtotal', 'jumlah'],
        trimAllWhitespace: true,
        skipHeaderRowsCount: 0,
      },
      unpivot: {
        enabled: true,
        config: {
          idColumns: ['Kode_Produk', 'Nama_Produk', 'Kategori'],
          valueColumns: ['Januari', 'Februari', 'Maret', 'April'],
          attributeHeader: 'Periode_Bulan',
          valueHeader: 'Jumlah_Terjual',
          removeEmptyValues: true,
        },
      },
      columnMappings: [
        { id: '1', sourceColumn: 'Kode_Produk', targetColumn: 'Kode_Produk', action: 'keep' },
        { id: '2', sourceColumn: 'Nama_Produk', targetColumn: 'Nama_Produk', action: 'keep' },
        { id: '3', sourceColumn: 'Kategori', targetColumn: 'Kategori', action: 'uppercase' },
        { id: '4', sourceColumn: 'Periode_Bulan', targetColumn: 'Bulan', action: 'rename' },
        { id: '5', sourceColumn: 'Jumlah_Terjual', targetColumn: 'Kuantitas_Unit', action: 'rename' },
      ],
    },
  },
  {
    id: 'merged-invoice',
    title: 'Kasus 2: Faktur Berulang dengan Sel Merge (Fill Down)',
    subtitle: 'Mengisi sel kosong No Faktur, Tanggal, dan Customer akibat merge cell',
    category: 'Faktur & Invoice',
    image1Description: 'Laporan Invoice di mana No Faktur, Tanggal, dan Customer hanya ditulis di baris pertama tiap transaksi, baris item lainnya kosong.',
    image2Description: 'Setiap baris data lengkap terisi No Faktur, Tanggal, Pelanggan, Nama Item, Qty, Harga. Siap impor ke ERP / Software Akuntansi.',
    sampleInput: {
      headers: ['No_Faktur', 'Tanggal', 'Nama_Pelanggan', 'Nama_Barang', 'Qty', 'Harga_Satuan', 'Subtotal'],
      rows: [
        { No_Faktur: 'INV-2024-001', Tanggal: '2024-03-01', Nama_Pelanggan: 'PT Maju Bersama', Nama_Barang: 'Kertas A4 70gr PaperOne', Qty: 10, Harga_Satuan: 48000, Subtotal: 480000 },
        { No_Faktur: '', Tanggal: '', Nama_Pelanggan: '', Nama_Barang: 'Tinta Printer Epson 003', Qty: 4, Harga_Satuan: 85000, Subtotal: 340000 },
        { No_Faktur: '', Tanggal: '', Nama_Pelanggan: '', Nama_Barang: 'Pulpen Standard AE7 Box', Qty: 5, Harga_Satuan: 22000, Subtotal: 110000 },
        { No_Faktur: 'INV-2024-002', Tanggal: '2024-03-02', Nama_Pelanggan: 'CV Cahaya Abadi', Nama_Barang: 'Flashdisk Sandisk 64GB', Qty: 6, Harga_Satuan: 95000, Subtotal: 570000 },
        { No_Faktur: '', Tanggal: '', Nama_Pelanggan: '', Nama_Barang: 'Kabel HDMI 3 Meter', Qty: 3, Harga_Satuan: 45000, Subtotal: 135000 },
        { No_Faktur: 'INV-2024-003', Tanggal: '2024-03-03', Nama_Pelanggan: 'Toko Surya Makmur', Nama_Barang: 'Buku Tulis Sidu 38 Lembar', Qty: 20, Harga_Satuan: 38000, Subtotal: 760000 },
        { No_Faktur: '', Tanggal: '', Nama_Pelanggan: '', Nama_Barang: 'Map Dokumen Bantex', Qty: 12, Harga_Satuan: 28000, Subtotal: 336000 },
      ],
    },
    pipelineConfig: {
      fillDown: {
        targetColumns: ['No_Faktur', 'Tanggal', 'Nama_Pelanggan'],
      },
      filterClean: {
        removeEmptyRows: true,
        removeTotalRows: true,
        totalRowKeywords: ['total', 'grand total', 'subtotal'],
        trimAllWhitespace: true,
        skipHeaderRowsCount: 0,
      },
      columnMappings: [
        { id: '1', sourceColumn: 'No_Faktur', targetColumn: 'Nomor_Invoice', action: 'rename' },
        { id: '2', sourceColumn: 'Tanggal', targetColumn: 'Tanggal_Transaksi', action: 'date_format' },
        { id: '3', sourceColumn: 'Nama_Pelanggan', targetColumn: 'Customer', action: 'uppercase' },
        { id: '4', sourceColumn: 'Nama_Barang', targetColumn: 'Item_Deskripsi', action: 'rename' },
        { id: '5', sourceColumn: 'Qty', targetColumn: 'Jumlah_Item', action: 'number_format' },
        { id: '6', sourceColumn: 'Harga_Satuan', targetColumn: 'Harga_Satuan_Rp', action: 'currency_format' },
        { id: '7', sourceColumn: 'Subtotal', targetColumn: 'Total_Rp', action: 'currency_format' },
      ],
    },
  },
  {
    id: 'split-combine-data',
    title: 'Kasus 3: Pemisahan & Penggabungan Kolom (Split & Merge)',
    subtitle: 'Memisahkan Nama - Divisi, Kota Lahir, dan Tanggal Lahir menjadi kolom tersendiri',
    category: 'HR & Kepegawaian',
    image1Description: 'Satu kolom berisi data gabungan seperti "Budi Santoso - IT Support" atau "Surabaya, 15-08-1992".',
    image2Description: 'Kolom terpisah rapi: Kolom Nama Pegawai, Kolom Divisi, Kolom Kota Asal, dan format standar.',
    sampleInput: {
      headers: ['NIK', 'Nama_dan_Jabatan', 'Tempat_dan_Tanggal_Lahir', 'Status_Karyawan', 'Gaji_Pokok'],
      rows: [
        { NIK: 'EMP-101', Nama_dan_Jabatan: 'Andi Pratama - Software Engineer', Tempat_dan_Tanggal_Lahir: 'Jakarta, 1993-04-12', Status_Karyawan: 'Tetap', Gaji_Pokok: 12500000 },
        { NIK: 'EMP-102', Nama_dan_Jabatan: 'Siti Rahmawati - Product Manager', Tempat_dan_Tanggal_Lahir: 'Bandung, 1991-11-20', Status_Karyawan: 'Tetap', Gaji_Pokok: 16000000 },
        { NIK: 'EMP-103', Nama_dan_Jabatan: 'Rudi Hermawan - Quality Assurance', Tempat_dan_Tanggal_Lahir: 'Surabaya, 1995-07-05', Status_Karyawan: 'Kontrak', Gaji_Pokok: 9000000 },
        { NIK: 'EMP-104', Nama_dan_Jabatan: 'Dewi Anggraeni - UI/UX Designer', Tempat_dan_Tanggal_Lahir: 'Yogyakarta, 1994-02-18', Status_Karyawan: 'Tetap', Gaji_Pokok: 11000000 },
        { NIK: 'EMP-105', Nama_dan_Jabatan: 'Fajar Nugroho - DevOps Engineer', Tempat_dan_Tanggal_Lahir: 'Semarang, 1992-09-30', Status_Karyawan: 'Tetap', Gaji_Pokok: 14500000 },
      ],
    },
    pipelineConfig: {
      filterClean: {
        removeEmptyRows: true,
        removeTotalRows: false,
        totalRowKeywords: [],
        trimAllWhitespace: true,
        skipHeaderRowsCount: 0,
      },
      columnMappings: [
        { id: '1', sourceColumn: 'NIK', targetColumn: 'ID_Karyawan', action: 'rename' },
        { id: '2', sourceColumn: 'Nama_dan_Jabatan', targetColumn: 'Nama_Lengkap', action: 'split', splitDelimiter: ' - ', splitIndex: 0 },
        { id: '3', sourceColumn: 'Nama_dan_Jabatan', targetColumn: 'Jabatan_Posisi', action: 'split', splitDelimiter: ' - ', splitIndex: 1 },
        { id: '4', sourceColumn: 'Tempat_dan_Tanggal_Lahir', targetColumn: 'Kota_Kelahiran', action: 'split', splitDelimiter: ', ', splitIndex: 0 },
        { id: '5', sourceColumn: 'Tempat_dan_Tanggal_Lahir', targetColumn: 'Tgl_Lahir', action: 'split', splitDelimiter: ', ', splitIndex: 1 },
        { id: '6', sourceColumn: 'Status_Karyawan', targetColumn: 'Status_Kerja', action: 'uppercase' },
        { id: '7', sourceColumn: 'Gaji_Pokok', targetColumn: 'Gaji_Bersih_Rp', action: 'currency_format' },
      ],
    },
  },
  {
    id: 'marketplace-accounting',
    title: 'Kasus 4: Ekspor Pesanan Toko Online ke Rekap Jurnal',
    subtitle: 'Merestrukturisasi pesanan e-commerce ke ringkasan transaksi akuntansi',
    category: 'E-Commerce & Keuangan',
    image1Description: 'File raw dari Shopee/Tokopedia dengan banyak kolom teknis yang acak.',
    image2Description: 'Format siap cetak/laporan keuangan dengan nama kolom baku dan format rupiah rapi.',
    sampleInput: {
      headers: ['Nomor_Pesanan', 'Waktu_Checkout', 'Username_Buyer', 'SKU_Induk', 'Nama_Variasi', 'Harga_Jual', 'Ongkir_Ditanggung_Penjual', 'Potongan_Voucher', 'Total_Diterima_Rekening'],
      rows: [
        { Nomor_Pesanan: 'ORD-20240901-001', Waktu_Checkout: '2024-09-01 10:15', Username_Buyer: 'dina_wati88', SKU_Induk: 'BLZ-SLK-BLK', Nama_Variasi: 'Blazer Sutra - Hitam M', Harga_Jual: 249000, Ongkir_Ditanggung_Penjual: 10000, Potongan_Voucher: 25000, Total_Diterima_Rekening: 214000 },
        { Nomor_Pesanan: 'ORD-20240901-002', Waktu_Checkout: '2024-09-01 11:42', Username_Buyer: 'budi_jaya99', SKU_Induk: 'KMG-LIN-WHT', Nama_Variasi: 'Kemeja Linen - Putih L', Harga_Jual: 189000, Ongkir_Ditanggung_Penjual: 0, Potongan_Voucher: 15000, Total_Diterima_Rekening: 174000 },
        { Nomor_Pesanan: 'ORD-20240902-003', Waktu_Checkout: '2024-09-02 14:05', Username_Buyer: 'ratna_sari12', SKU_Induk: 'CEL-CHIN-BEI', Nama_Variasi: 'Celana Chino - Beige 32', Harga_Jual: 215000, Ongkir_Ditanggung_Penjual: 12000, Potongan_Voucher: 20000, Total_Diterima_Rekening: 183000 },
        { Nomor_Pesanan: 'ORD-20240902-004', Waktu_Checkout: '2024-09-02 19:22', Username_Buyer: 'hendra_k', SKU_Induk: 'JAK-DEN-BLU', Nama_Variasi: 'Jaket Denim - Navy XL', Harga_Jual: 320000, Ongkir_Ditanggung_Penjual: 15000, Potongan_Voucher: 30000, Total_Diterima_Rekening: 275000 },
      ],
    },
    pipelineConfig: {
      filterClean: {
        removeEmptyRows: true,
        removeTotalRows: true,
        totalRowKeywords: ['total'],
        trimAllWhitespace: true,
        skipHeaderRowsCount: 0,
      },
      columnMappings: [
        { id: '1', sourceColumn: 'Nomor_Pesanan', targetColumn: 'No_Referensi', action: 'rename' },
        { id: '2', sourceColumn: 'Waktu_Checkout', targetColumn: 'Tanggal_Waktu', action: 'keep' },
        { id: '3', sourceColumn: 'Username_Buyer', targetColumn: 'Akun_Pelanggan', action: 'lowercase' },
        { id: '4', sourceColumn: 'Nama_Variasi', targetColumn: 'Deskripsi_Produk', action: 'rename' },
        { id: '5', sourceColumn: 'Harga_Jual', targetColumn: 'Harga_Kotor_Rp', action: 'currency_format' },
        { id: '6', sourceColumn: 'Total_Diterima_Rekening', targetColumn: 'Pendapatan_Bersih_Rp', action: 'currency_format' },
      ],
    },
  },
];
