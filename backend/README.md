# Backend API & MQTT Subscriber (FastAPI)

Ini adalah layanan *backend* utama untuk Sistem Monitoring Maggot Farming (BSF). Sistem ini dirancang menggunakan arsitektur modern Python dan bertugas menjadi otak utama pemrosesan data, manajemen perangkat keras, dan keamanan.

## Fitur Utama

1. **Autentikasi Aman (JWT):** Registrasi dan Login menggunakan enkripsi password `bcrypt` dan token JWT yang memiliki masa berlaku 7 hari.
2. **Multi-Perangkat (Multi-Device):** Mendukung manajemen banyak kandang/rak (misal: Rak A, Rak B) secara bersamaan dalam satu akun (*Claim/Unclaim Device*).
3. **Database Relasional:** Menggunakan SQLite dengan SQLAlchemy ORM untuk menyimpan relasi tabel yang terstruktur secara rapi (Users, Devices, SensorLogs, FeedingLogs, WeightLogs, Thresholds).
4. **MQTT Auto-Provisioning:** Script *background* `mqtt_client.py` akan otomatis menyadap data dari broker MQTT (topik `sensor/data`). Jika ada alat *hardware* baru dengan kode unik tak dikenal, *backend* akan mendaftarkannya otomatis ke sistem!
5. **Dynamic Threshold:** Menyimpan batas krisis peringatan suhu, kelembaban, dan cahaya yang bisa diubah-ubah oleh peternak via aplikasi *frontend*.
6. **Smart Timezone (UTC):** Seluruh data sensor, penimbangan, dan pakan secara ketat disimpan menggunakan format UTC ISO 8601 standar (*Timezone-Aware*) untuk menjamin agar grafik di aplikasi akurat meski dilihat di zona waktu yang berbeda.
7. **Database Seeder:** Dilengkapi dengan fitur cerdas `seed.py` untuk mereset dan mengisi simulasi data komprehensif selama 7 hari ke belakang (*Sensor, FCR, Gain*).

## Struktur Folder & File Utama
- `main.py`: Entri poin aplikasi FastAPI, registrasi router, dan menyalakan *thread* MQTT.
- `database.py` & `models.py`: Skema ORM Database SQLAlchemy.
- `auth.py`: Modul JWT dan pengamanan password.
- `mqtt_client.py`: *Daemon* pekerja yang setia mendengarkan pesan dari ESP32.
- `routers/`: Kumpulan *controller* spesifik per modul (Autentikasi, Perangkat, Pakan, Penimbangan).
- `seed.py`: *Script utility* untuk mereset *database* menjadi data *dummy*.

## Cara Instalasi dan Menjalankan

1. Buka terminal dan masuk ke folder `backend`:
   ```bash
   cd backend
   ```
2. Buat Virtual Environment dan instal seluruh dependensinya:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```
3. (Opsional) Jalankan Seeder untuk mereset & mengisi data awal (Sangat Direkomendasikan):
   ```bash
   python seed.py
   ```
4. Jalankan server FastAPI menggunakan uvicorn:
   ```bash
   uvicorn main:app --reload
   ```

Server akan berjalan pada `http://localhost:8000`.

## Dokumentasi API Otomatis
FastAPI menghasilkan dokumentasi API interaktif secara ajaib (Swagger UI). 
Akses setelah *server* berjalan di:
- **Swagger UI:** `http://localhost:8000/docs`
