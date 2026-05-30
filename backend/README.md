# Backend API & MQTT Subscriber (FastAPI)

Ini adalah layanan backend untuk Sistem Monitoring Maggot Farming. Layanan ini bertugas untuk:
1. Mendengarkan (*subscribe*) pesan MQTT dari ESP32 (topik: `sensor/data`).
2. Menyimpan data historis sensor ke database lokal (SQLite).
3. Menyediakan antarmuka REST API bagi frontend (React) untuk mengambil data.

## Kebutuhan Sistem
- Python 3.8+
- Broker MQTT (seperti Eclipse Mosquitto) yang berjalan di lokal atau server.

## Cara Instalasi dan Menjalankan

1. Buka terminal dan masuk ke folder `backend`:
   ```bash
   cd backend
   ```
2. Instal semua dependensi yang diperlukan:
   ```bash
   pip install -r requirements.txt
   ```
3. Jalankan server FastAPI menggunakan uvicorn:
   ```bash
   uvicorn main:app --reload
   ```

Server akan berjalan pada `http://localhost:8000`.

## Dokumentasi API
FastAPI secara otomatis menghasilkan dokumentasi interaktif. Setelah server berjalan, buka browser dan akses:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
