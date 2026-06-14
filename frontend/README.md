# Frontend Web Dashboard (React + Vite)

Ini adalah antarmuka pengguna (UI) cerdas untuk Sistem Monitoring Maggot Farming (BSF). Dasbor ini dirancang secara ekstensif menggunakan React, Tailwind CSS, dan Recharts, mengadopsi prinsip desain yang dinamis, bersih, dan memprioritaskan wawasan data (*data-driven insights*).

## Fitur Unggulan

1. **Dashboard 5 Zona Cerdas:**
   - **Zone 1 (Alert Banner):** Spanduk peringatan otomatis jika kondisi kandang melampaui batas kritis.
   - **Zone 2 (Live Sensor):** Kartu metrik Suhu, Kelembaban, dan Cahaya dengan *sparkline* (grafik mini) 60 menit terakhir dan indikator warna latar yang berubah merah/kuning jika terdeteksi bahaya.
   - **Zone 3 (Weekly KPI):** Kalkulasi otomatis indikator kinerja utama seperti **FCR (Feed Conversion Ratio)** dan rata-rata kenaikan berat harian (Gain).
   - **Zone 4 (Analytics Charts):** 
     - **Grafik Pakan vs Berat:** Memadukan diagram batang (pakan) dan garis (berat).
     - **Grafik Sensor Terpadu:** Menerapkan algoritma **Normalisasi** di mana garis batas kritis (100%) selalu sejajar untuk semua sensor yang berbeda satuan, dipisah menjadi panel Suhu-Kelembaban dan Intensitas Cahaya (tipe anak tangga).
     - **Grafik Efisiensi & Suhu:** *Scatter plot* korelasi pintar yang menghitung tren pertumbuhan linear (**R-Squared**) yang diwarnai secara spesifik berdasarkan rata-rata suhu harian.
   - **Zone 5 (Auto-Insight):** Mesin analitik mini yang merangkum rekomendasi operasional kandang dalam bentuk teks yang mudah dicerna (contoh: "Pakan efisien", "Suhu terlalu panas").
2. **Manajemen Multi-Kandang (Tab Navigasi):** Mendukung pemantauan banyak rak/kandang dalam satu layar dengan mekanisme tab dinamis (*Session Storage* aktif).
3. **Pencatatan Pakan & Penimbangan (CRUD):** Formulir lengkap untuk mencatat sejarah pemberian makan dan hasil panen parsial maggot.
4. **Dynamic Threshold Settings:** Halaman khusus untuk mengkalibrasi nilai *Warning* dan *Critical* untuk setiap kandang, langsung sinkron secara *real-time* dengan Dashboard.
5. **Autentikasi (JWT):** Registrasi dan Login akun aman yang dipertahankan menggunakan State Management berbasis `Zustand`.

## Struktur Folder (Clean Architecture)
```text
src/
├── assets/      # File statis (gambar, dll)
├── components/  # UI Reusable (MetricCard, AlertBanner, dll)
├── features/    # Layar utama
│   ├── auth/         # Halaman Login & Register
│   └── dashboard/    # Pusat operasi (Dashboard, Settings, Charts)
├── store/       # State Management (Zustand untuk auth)
├── services/    # Pemanggilan API (Axios Interceptors dengan Smart Timezone fix)
├── types/       # Antarmuka TypeScript (Interface)
└── index.css    # Variabel CSS dan styling global Tailwind
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
Pastikan layanan Backend (FastAPI) sudah berjalan di `http://localhost:8000`.
