# Frontend Web Dashboard (React + Vite)

Ini adalah antarmuka pengguna (UI) untuk Sistem Monitoring Maggot Farming. Dasbor ini dirancang dengan arsitektur *Clean Code* berbasis fitur dan mengadopsi gaya desain editorial (seperti Anthropic Claude) dengan palet warna bernuansa *warm cream* dan tipografi yang elegan.

## Fitur
- **Login Kandang:** Verifikasi menggunakan *Unique Code* (contoh: `BSF-001`) yang dikirimkan oleh ESP32.
- **Metrik Real-time:** Menampilkan Suhu, Kelembaban, dan LDR secara langsung dengan auto-refresh (polling) setiap 5 detik. Dilengkapi indikator peringatan visual jika kondisi abnormal.
- **Grafik Historis:** Visualisasi tren data sensor menggunakan `recharts` yang dapat di-filter berdasarkan rentang waktu (tanggal dan jam).

## Struktur Folder (Clean Architecture)
```text
src/
├── assets/      # File statis (gambar, dll)
├── components/  # UI Reusable (MetricCard, ChartCard)
├── features/    # Layar utama
│   ├── auth/         # Halaman Login
│   └── dashboard/    # Halaman Dashboard & Logika Bisnis
├── services/    # Pemanggilan API ke Backend FastAPI (api.ts)
├── types/       # Antarmuka TypeScript (Interface)
└── index.css    # Variabel CSS dan styling global
```

## Cara Instalasi dan Menjalankan

1. Buka terminal dan masuk ke folder `frontend`:
   ```bash
   cd frontend
   ```
2. Instal dependensi NPM:
   ```bash
   npm install
   ```
3. Jalankan development server:
   ```bash
   npm run dev
   ```

Aplikasi web dapat diakses pada `http://localhost:5173`.
Pastikan layanan Backend (FastAPI) dan MQTT Broker sudah menyala agar frontend dapat menampilkan data secara *real-time*.
