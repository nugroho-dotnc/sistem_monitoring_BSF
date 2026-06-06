# 🪲 Smart BSF Maggot Farming Monitor

Proyek IoT untuk memantau kondisi lingkungan (suhu, kelembaban, intensitas cahaya) kandang budidaya Black Soldier Fly (BSF) secara *real-time*. Sistem ini membantu peternak BSF untuk menjaga kondisi ideal pertumbuhan larva dengan memberikan konfigurasi *threshold* batas aman dan peringatan (alarm) langsung dari perangkat keras, serta menyediakan dasbor web untuk analisa histori sensor.

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![React](https://img.shields.io/badge/React-19.2.6-61dafb.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Status](https://img.shields.io/badge/Status-Active-success.svg)

---

## 2. Daftar Isi
- [3. Fitur Utama](#3-fitur-utama)
- [4. Arsitektur Sistem](#4-arsitektur-sistem)
- [5. Struktur Proyek](#5-struktur-proyek)
- [6. Tech Stack](#6-tech-stack)
- [7. Prasyarat](#7-prasyarat)
- [8. Instalasi & Menjalankan Proyek](#8-instalasi--menjalankan-proyek)
- [9. Konfigurasi](#9-konfigurasi)
- [10. API Reference](#10-api-reference)
- [11. MQTT Topics](#11-mqtt-topics)
- [12. Database Schema](#12-database-schema)
- [13. Troubleshooting](#13-troubleshooting)
- [14. Kontribusi](#14-kontribusi)
- [15. Lisensi](#15-lisensi)

---

## 3. Fitur Utama

MONITORING REAL-TIME
- Membaca metrik suhu (`temperature`), kelembaban (`humidity`), dan intensitas cahaya (`light_intensity`).
- Dasbor melakukan _polling_ (penarikan data) otomatis setiap 5 detik.
- Alarm lokal pada perangkat (LED Merah & Buzzer aktif) jika terdeteksi suhu melebihi `tempCrit`, kelembaban di bawah `humidCrit`, atau cahaya di bawah `lightCrit`.

KONFIGURASI & KONTROL
- Pembaruan konfigurasi *threshold* batas peringatan (_warning_) dan kritis (_critical_) melalui dasbor web.
- Sinkronisasi nilai *threshold* ke ESP32 menggunakan protokol MQTT, dengan penyimpanan nilai ke memori NVS (`Preferences`) ESP32.

NOTIFIKASI & RIWAYAT
- WhatsApp alert via Fonnte **[VERIFY - Not found in code (file notifications.py tidak ada)]**
- Alert log with transition-based detection **[VERIFY - Not found in code (logika ini tidak ada di mqtt_client.py)]**
- In-app notification panel **[VERIFY - Not found in code (file AlertPanel.tsx tidak ada)]**

---

## 4. Arsitektur Sistem

### 4a. Diagram Topologi

```text
┌─────────────┐     sensor/data      ┌──────────────┐
│   ESP32     │ ──────────────────► │ MQTT Broker  │
│  (Kandang)  │ ◄────────────────── │ (Mosquitto)  │
└─────────────┘  threshold/config/  └──────┬───────┘
                 {unique_code}             │
                                           │ subscribe
                                    ┌──────▼───────┐
                                    │   Backend    │
                                    │  (FastAPI)   │
                                    │  + SQLite    │
                                    └──────┬───────┘
                                           │ REST API
                              ┌────────────┼────────────┐
                              │            │            │
                       ┌──────▼──┐  ┌──────▼──┐  ┌─────▼──────┐
                       │Dashboard│  │Settings │  │  Fonnte    │
                       │(React)  │  │ (React) │  │ WhatsApp   │
                       └─────────┘  └─────────┘  └────────────┘ [VERIFY - Fonnte integration not found]
```
**Legenda:**
- `──►` Publikasi data dari klien ke broker.
- `REST API` Komunikasi HTTP/JSON antara React dan FastAPI.

### 4b. Penjelasan Alur Data

**FLOW 1 — Sensor Data (ESP32 → Dashboard):**
1. **Sensor Read**: `SISTEM_MONITORING_BSF.ino` membaca data dari sensor DHT11 dan analog LDR setiap interval 2000 ms.
2. **JSON Build & MQTT Publish**: Dalam fungsi `loop()`, ESP32 membuat *string* JSON berisi metrik dan mempublikasikannya ke topik `sensor/data` setiap 5000 ms.
3. **Backend Receive & DB Write**: Paho-MQTT di `backend/mqtt_client.py` (`on_message`) menerima JSON, memeriksa `unique_code`, lalu mendaftarkan alat jika baru, serta menyimpan pembacaan sebagai `models.SensorLog` di SQLite (`database.py`).
4. **Alert Check**: [VERIFY - Tidak ada logika pemeriksaan transisi *alert* secara spesifik di `mqtt_client.py`].
5. **API Expose & UI Update**: Endpoint `/api/sensor/{unique_code}` di `backend/main.py` mengembalikan histori log, yang secara rutin ditarik oleh komponen `Dashboard.tsx` pada _frontend_ (polling 5 detik).

**FLOW 2 — Threshold Update (Dashboard → ESP32):**
1. **User Edit**: Pengguna mengisi formulir batas parameter di halaman dasbor.
2. **PUT API Call & DB Update**: Pemanggilan *endpoint* `PUT /api/threshold/{unique_code}` di `backend/main.py` memperbarui _row_ `models.Threshold` di *database*.
3. **MQTT Publish**: *Backend* lalu mempublikasikan *payload* JSON yang berisi 6 nilai ambang batas ke topik `threshold/config/{unique_code}` menggunakan instance `mqtt_client`.
4. **ESP32 Receive & NVS Write**: ESP32 menerima *payload* pada `callback()` di `SISTEM_MONITORING_BSF.ino`. Variabel-variabel in-memory (`tempWarn`, dll.) segera diubah, lalu disimpan secara permanen ke NVS (*Non-Volatile Storage*) menggunakan pustaka `Preferences`.

---

## 5. Struktur Proyek

```text
├── SISTEM_MONITORING_BSF.ino  # Kode sumber firmware utama (Arduino C++)
├── backend/
│   ├── main.py                # Endpoint API FastAPI, startup events, dan rute
│   ├── models.py              # Definisi tabel ORM menggunakan SQLAlchemy
│   ├── database.py            # Konfigurasi koneksi engine SQLite (sensor_logs.db)
│   ├── mqtt_client.py         # Subskripsi Paho MQTT, DB inserts, dan manajemen payload
│   ├── requirements.txt       # Daftar dependensi library Python
│   └── sensor_logs.db         # Berkas fisik database SQLite
├── frontend/
│   ├── package.json           # Dependensi project Node.js dan meta-informasi 
│   └── src/                   # Source code React (Dashboard, Settings, utils, dll.)
└── README.md                  # Dokumentasi proyek (berkas ini)
```

---

## 6. Tech Stack

| Layer | Teknologi | Versi | Kegunaan |
|-------|-----------|-------|----------|
| **Firmware** | Arduino C++, ESP32, DHT11, PubSubClient, ArduinoJson, Preferences, LiquidCrystal_I2C | Latest | Logika perangkat keras, pembacaan sensor, komunikasi broker |
| **Backend** | Python, FastAPI, SQLAlchemy, Paho-MQTT, Uvicorn, SQLite | FastAPI 0.103.2, Uvicorn 0.23.2, SQLAlchemy 2.0.22, Paho-MQTT 1.6.1 | REST API, manajemen data, pemrosesan dan langganan MQTT |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, Recharts, React Router DOM | React 19.2.6, Vite 8.0.12, Tailwind 4.3.0 | Tampilan antarmuka grafis pengguna untuk monitor interaktif |
| **Notifikasi** | Fonnte API | Latest | *WhatsApp alerts* **[VERIFY - Not found in code]** |
| **Broker** | Mosquitto MQTT | Latest | Perantara komunikasi antara ESP32 dan Backend |

---

## 7. Prasyarat

- **Node.js** (versi 18+)
- **Python** (versi 3.8+)
- **Mosquitto MQTT Broker**
  - Ubuntu: `sudo apt install mosquitto mosquitto-clients`
  - Windows: Unduh dari mosquitto.org
- **Arduino IDE** (dengan ESP32 Board Package terinstal)
- **Fonnte Account** (https://fonnte.com) **[VERIFY - Token tidak digunakan di kode]**
- Perangkat Keras: **ESP32 Dev Module**, **DHT11**, **LDR**, **LCD I2C (16x2)**, **LED**, dan **Buzzer**.

---

## 8. Instalasi & Menjalankan Proyek

### 8a. MQTT Broker
Pada Ubuntu:
```bash
sudo apt install mosquitto mosquitto-clients
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
# Verifikasi
systemctl status mosquitto
```

### 8b. Backend (FastAPI)
1. `cd backend/`
2. Buat *virtual environment* dan aktifkan: `python -m venv venv` lalu `source venv/bin/activate` (atau `venv\Scripts\activate` di Windows)
3. Instal dependensi: `pip install -r requirements.txt`
4. Konfigurasi kredensial **[VERIFY - File .env.example tidak ditemukan, parameter MQTT `localhost` masih bersifat hardcode di dalam `mqtt_client.py`]**
5. Jalankan server:
   ```bash
   uvicorn main:app --reload
   ```
6. Terminal akan menampilkan output keberhasilan *startup* dan indikasi koneksi ke MQTT broker.

### 8c. Frontend (React)
1. `cd frontend/`
2. Instal dependensi Node: `npm install`
3. Konfigurasi _environment_ **[VERIFY - Tidak ada `.env` yang digunakan, URL API (kemungkinan localhost:8000) bersifat *hardcode* di `services/api.ts`]**
4. Jalankan *development server*:
   ```bash
   npm run dev
   ```
5. Buka penjelajah web di http://localhost:5173

### 8d. ESP32 Firmware
1. Buka berkas `SISTEM_MONITORING_BSF.ino` dengan Arduino IDE.
2. Instal pustaka yang dibutuhkan: `LiquidCrystal_I2C`, `PubSubClient`, `DHT sensor library`, `ArduinoJson`.
3. Edit variabel konfigurasinya:
   - `const char* ssid = "Adesukma";`
   - `const char* password = "password_anda";`
   - `const char* mqtt_server = "192.168.100.6";`
   - `#define DEVICE_ID "BSF-001"`
4. Pilih **ESP32 Dev Module** dari menu Board.
5. Klik _Upload_.

---

## 9. Konfigurasi

### Menambah Kandang Baru
Perangkat ESP32 yang diset dengan `DEVICE_ID` (unique code) baru akan otomatis didaftarkan ke sistem saat pesan MQTT pertamanya diterima (melalui topik `sensor/data`). Proses ini ditangani langsung oleh fungsi `on_message` pada `backend/mqtt_client.py`, sehingga entri manual ke database sama sekali tidak dibutuhkan.

### Mengubah Threshold Default
Perubahan bisa dilakukan melalui halaman **Settings** di _dashboard_ (sangat direkomendasikan). Mengubah batas lewat _dashboard_ akan memicu pengiriman *payload* MQTT ke ESP32, memastikan batas memori pada alat terus sinkron dengan database. Jika diubah manual dari tabel *database*, alat fisik mungkin tidak ter-sinkronisasi sebelum alatnya *restart*.

### Mengaktifkan Notifikasi WhatsApp
**[VERIFY - Modul atau fitur Notifikasi Fonnte WhatsApp saat ini tidak ditemukan dalam kode (backend/frontend).]**

---

## 10. API Reference

### SENSOR
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/sensor/{unique_code}` | Mendapatkan riwayat log sensor sebuah perangkat kandang |
| `GET` | `/api/sensor/{unique_code}/latest` | Mendapatkan data sensor urutan 1 paling baru |

<details>
<summary>Contoh response `/api/sensor/{unique_code}/latest`</summary>

```json
{
  "id": 1,
  "device_id": 1,
  "timestamp": "2026-06-05T14:32:00.000000",
  "temperature": 30.5,
  "humidity": 72.0,
  "light_intensity": 4095.0
}
```
</details>

### THRESHOLD
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/threshold/{unique_code}` | Membaca setelan batas *threshold* |
| `PUT` | `/api/threshold/{unique_code}` | Memperbarui parameter batas *threshold* |

<details>
<summary>Contoh response `/api/threshold/{unique_code}`</summary>

```json
{
  "temp_warning": 30.0,
  "temp_critical": 32.0,
  "humid_warning": 60.0,
  "humid_critical": 50.0,
  "light_warning": 2500.0,
  "light_critical": 2000.0
}
```
</details>

### DEVICE
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/device/{unique_code}` | Mendapatkan identitas dan lokasi kandang. Berguna untuk _login_ perangkat. |

### ALERT / NOTIFICATION CONFIG
| Method | Endpoint | Deskripsi |
|---|---|---|
| N/A | N/A | **[VERIFY - Tidak ada *endpoint* `alert` atau `notification` di kode `main.py`]** |

---

## 11. MQTT Topics

| Topic | Arah | Publisher | Subscriber | Format Payload |
|---|---|---|---|---|
| `sensor/data` | ESP32 → Backend | ESP32 Firmware | Backend Python (`mqtt_client.py`) | JSON |
| `threshold/config/{unique_code}` | Backend → ESP32 | Backend Python (`main.py`) | ESP32 Firmware | JSON |

**Contoh Payload `sensor/data`:**
```json
{
  "unique_code": "BSF-001",
  "temperature": 30.5,
  "humidity": 72,
  "light_intensity": 4095
}
```

**Contoh Payload `threshold/config/{unique_code}`:**
```json
{
  "temp_warning": 30.0,
  "temp_critical": 32.0,
  "humid_warning": 60.0,
  "humid_critical": 50.0,
  "light_warning": 2500.0,
  "light_critical": 2000.0
}
```

---

## 12. Database Schema

### `devices`
| Kolom | Tipe | Nullable | Default | Keterangan |
|---|---|---|---|---|
| `id` | Integer (PK) | No | AI | ID utama perangkat kandang |
| `unique_code` | String | No | - | Kode unik identifikasi (`DEVICE_ID`) |
| `name` | String | Yes | "Kandang Maggot" | Nama _display_ perangkat |
| `location` | String | Yes | "Belum diatur" | Letak atau keterangan posisi |
| `created_at` | DateTime | Yes | `datetime.utcnow` | Waktu registrasi awal perangkat |
> Digunakan untuk mencatat daftar kandang/perangkat aktif.

### `sensor_logs`
| Kolom | Tipe | Nullable | Default | Keterangan |
|---|---|---|---|---|
| `id` | Integer (PK) | No | AI | ID catatan log data |
| `device_id` | Integer (FK) | Yes | - | ID alat dari tabel `devices` |
| `timestamp` | DateTime | Yes | `datetime.utcnow` | Waktu log dicatat ke DB |
| `temperature` | Float | Yes | - | Rekaman angka suhu |
| `humidity` | Float | Yes | - | Rekaman angka persentase kelembaban |
| `light_intensity` | Float | Yes | - | Rekaman angka LDR/Intensitas Cahaya |
> Digunakan untuk menyajikan tren historis metrik sensor ke *frontend*.

### `thresholds`
| Kolom | Tipe | Nullable | Default | Keterangan |
|---|---|---|---|---|
| `id` | Integer (PK) | No | AI | ID batas |
| `device_id` | Integer (FK) | Yes | - | Relasi konfigurasi ke ID alat (kandang) |
| `temp_warning` | Float | Yes | 30.0 | Batas perhatian suhu |
| `temp_critical` | Float | Yes | 32.0 | Batas fatal suhu |
| `humid_warning` | Float | Yes | 60.0 | Batas perhatian kelembaban |
| `humid_critical` | Float | Yes | 50.0 | Batas fatal kelembaban |
| `light_warning` | Float | Yes | 2500.0 | Batas perhatian cahaya |
| `light_critical` | Float | Yes | 2000.0 | Batas fatal cahaya |
| `updated_at` | DateTime | Yes | `datetime.utcnow` | Penanda waktu modifikasi |
> Berisi angka-angka target keamanan lingkungan kandang per-alat.

### `alert_logs` / `notification_configs`
**[VERIFY - Tabel ini tidak ditemukan dalam deklarasi ORM file `backend/models.py`]**

---

## 13. Troubleshooting

| Masalah | Kemungkinan Penyebab | Solusi |
|---------|----------------------|--------|
| **ESP32 tidak terkoneksi ke MQTT broker** | IP `mqtt_server` salah atau beda segmen jaringan. Broker mati. | Cek *Serial Monitor* Arduino IDE. Pastikan IP di *script* .ino sesuai dengan IP LAN laptop/server `mosquitto`. |
| **Data sensor tidak muncul di dashboard** | FastAPI mati, Mosquito mati, atau `DEVICE_ID` keliru. | Cek apakah terminal backend berjalan. Refresh aplikasi _React_ atau *restart* server backend jika Mosquitto diputar setelah FastAPI. |
| **Notifikasi WhatsApp tidak terkirim** | Konfigurasi atau integrasi token Fonnte belum dilakukan | **[VERIFY - Logika pengiriman WhatsApp belum terimplementasi di source code]** |
| **Backend error saat startup** | Konflik _port_ atau berkas `sensor_logs.db` tidak bisa ditulisi. | Cek hak akses (_permissions_) folder `backend/`, pastikan *port* 8000 tidak dipakai aplikasi lain. |
| **Frontend tidak bisa fetch API (CORS error)** | Frontend diakses di luar `localhost:5173`. | Tambahkan *origin* IP pada `CORSMiddleware` di file `backend/main.py`. |
| **Threshold tidak ter-sync ke perangkat** | Koneksi MQTT FastAPI ke Mosquitto terputus. | Restart server FastAPI (`uvicorn main:app --reload`), alat ESP32 akan mengambil _update_ kembali. |

---

## 14. Kontribusi

Kami sangat mengapresiasi segala kontribusi:
1. *Fork* repositori ini
2. Buat *branch* fitur Anda: `git checkout -b feature/nama-fitur`
3. Komit _code_ Anda dengan pola pesan konvensional (*conventional commits*)
4. Ajukan *Pull Request* baru!

---

## 15. Lisensi

MIT License

Copyright (c) 2026 [NAMA ANDA]

Permission is hereby granted, free of charge, to any person obtaining a copy of this software... (Standard MIT License)
