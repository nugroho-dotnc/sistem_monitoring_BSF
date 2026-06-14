# 🪲 Smart BSF Maggot Farming Monitor

Proyek IoT ini dirancang khusus untuk memantau kondisi lingkungan kandang budidaya Black Soldier Fly (BSF) secara *real-time*. Sistem ini membantu peternak BSF menjaga kondisi ideal pertumbuhan larva dengan memberikan fitur pemantauan berkelanjutan, alarm perangkat keras lokal, serta dasbor interaktif untuk penyesuaian konfigurasi *threshold* (batas peringatan dan batas kritis) secara dinamis.

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![React](https://img.shields.io/badge/React-19.2.6-61dafb.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Status](https://img.shields.io/badge/Status-Active-success.svg)

---

## 2. Daftar Isi

Berikut adalah daftar isi untuk memudahkan navigasi dokumentasi proyek ini.
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

Proyek ini menyediakan kapabilitas monitoring dan konfigurasi parameter lingkungan yang penting untuk budidaya larva lalat tentara hitam.

MONITORING REAL-TIME
- Pemantauan metrik `temperature`, `humidity`, dan `light_intensity` yang dibaca secara berkesinambungan dari *firmware* ESP32.
- Mekanisme _polling_ interval setiap 5000 milidetik (5 detik) untuk memperbarui data dasbor.
- Perilaku alarm lokal di mana `LED_MERAH` dan `BUZZER` akan menyala (berstatus `HIGH`) jika suhu lebih dari `tempCrit`, kelembaban kurang dari `humidCrit`, atau intensitas cahaya kurang dari `lightCrit`.
- In-app alert log with transition-based detection **[VERIFY - Fitur log notifikasi ini tidak ditemukan di dalam `mqtt_client.py`]**
- In-app notification panel **[VERIFY - File `AlertPanel.tsx` tidak ditemukan di dalam direktori proyek]**

KONFIGURASI THRESHOLD
- Konfigurasi nilai *threshold* per metrik (_warning_ dan _critical_) menggunakan formulir pada halaman Settings (`ThresholdForm.tsx`).
- Penyimpanan persisten untuk semua konfigurasi parameter kandang di tabel _database_ menggunakan SQLAlchemy (`models.py`).
- Sinkronisasi _real-time_ protokol MQTT ke alat (ESP32) yang dipicu seketika setiap kali pengguna menyimpan perubahan formulir di *dashboard*.
- Pratinjau dampak perubahan *threshold* (status kalkulasi *worst-case*) sebelum data disimpan (terbaca pada `ThresholdForm.tsx`).

---

## 4. Arsitektur Sistem

Bagian ini memaparkan gambaran umum komunikasi data dari alat (ujung perangkat keras) ke dasbor klien, beserta alur logika teknis.

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
                                ┌──────────┴──────────┐
                                │                     │
                         ┌──────▼──┐           ┌──────▼──┐
                         │Dashboard│           │Settings │
                         │(React)  │           │ (React) │
                         └─────────┘           └─────────┘
```
**Legenda:**
- `──►` Publikasi MQTT.
- `REST API` Transmisi _stateless_ HTTP berupa objek JSON.

### 4b. Penjelasan Alur Data

**FLOW 1 — Sensor Data (ESP32 → Dashboard):**
1. **Sensor read**: *Firmware* `SISTEM_MONITORING_BSF.ino` membaca nilai `DHT11` dan LDR.
2. **JSON build**: Logika dalam loop() menyatukan nilai *sensor* ke format objek *string* JSON secara manual.
3. **MQTT publish**: Klien menggunakan fungsi `client.publish` untuk mengirim JSON ke topik `sensor/data`.
4. **Backend receive**: Skrip `backend/mqtt_client.py` bereaksi melalui `on_message`, memecah (_decode_) *payload* yang diterima.
5. **DB write**: *Backend* menggunakan SQLAlchemy (`models.py`) untuk menambah baris (`models.SensorLog`) pada database SQLite.
6. **Alert check**: Tidak ada validasi peringatan di *backend* **[VERIFY - Pengecekan status tidak ada di `mqtt_client.py`]**.
7. **API expose**: FastAPI mendeklarasikan rute `GET /api/sensor/{unique_code}/latest` di `main.py` untuk membuka data ke _frontend_.
8. **React poll**: Komponen `Dashboard.tsx` memicu *fetch* berulang menggunakan `setInterval` (5 detik).
9. **UI update**: *State* lokal milik React terperbarui; DOM HTML dirender ulang untuk merespon _state_ `latestData`.

**FLOW 2 — Threshold Update (Dashboard → ESP32):**
1. **User edits form**: Pengguna mengetik parameter baru pada `ThresholdForm.tsx`.
2. **Save button**: Tombol *submit* ditekan di dalam antarmuka _Settings_.
3. **PUT API call**: Komponen memanggil layanan HTTP (`api.ts`) untuk mengirim data parameter lewat _method_ PUT ke *backend*.
4. **DB update**: Endpoint `PUT /api/threshold/{unique_code}` di `main.py` melakukan *query*, lalu *update* _row_ `models.Threshold` di *database*.
5. **MQTT publish**: *Backend* segera menggunakan *method* `mqtt_client.publish` untuk mengirim struktur _warning_ dan _critical_ menuju `threshold/config/{unique_code}`.
6. **ESP32 receive**: Method `callback()` di `SISTEM_MONITORING_BSF.ino` menangkap aliran *byte* JSON dan memproses isinya.
7. **NVS write**: Sistem perangkat keras menulis ke memori `preferences.putFloat` (NVS ESP32).
8. **In-memory update**: Variabel global _firmware_ (`tempWarn`, `humidCrit`, dll) ditimpa nilai baru.

---

## 5. Struktur Proyek

Kumpulan *source code* dipisah menjadi dua subdirektori (basis API dan basis rekayasa antarmuka).

```text
├── SISTEM_MONITORING_BSF.ino  # Berkas sumber kode perangkat keras (firmware C++)
├── backend/
│   ├── main.py                # Definisi instansiasi FastAPI, rute kontroler API
│   ├── models.py              # Definisi dan skema basis data ORM SQLAlchemy
│   ├── database.py            # Mesin konfigurasi letak sesi dan tautan SQLite
│   ├── mqtt_client.py         # Konfigurasi pendengar rute MQTT (Paho) dan injeksi DB
│   ├── requirements.txt       # Daftar kunci paket lingkungan Python 
│   └── sensor_logs.db         # Modul basis data fisik SQLite lokal
├── frontend/
│   ├── package.json           # Manajemen konfigurasi proyek Node.js (Vite)
│   └── src/                   # Kode rekayasa antarmuka (UI Components & Fitur React)
└── README.md                  # Dokumentasi root (berkas repositori ini)
```

---

## 6. Tech Stack

Berikut tumpukan teknologi perangkat lunak yang dioperasikan pada proyek.

| Layer | Teknologi | Versi | Kegunaan |
|---|---|---|---|
| **Firmware** | Arduino C++, ESP32 board, DHT11 lib, PubSubClient, ArduinoJson, Preferences, LiquidCrystal_I2C | latest | Mengumpulkan sensor lingkungan dan komunikasi IoT ke broker |
| **Backend** | Python, FastAPI, SQLAlchemy, Paho-MQTT, Uvicorn, SQLite | FastAPI 0.103.2, Uvicorn 0.23.2, SQLAlchemy 2.0.22, Paho-MQTT 1.6.1 | Penyedia *endpoint* interaksi GUI dan rekapitulasi *database* ORM |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, Recharts, React Router DOM | React 19.2.6, Vite 8.0.12, Tailwind 4.3.0, Recharts 3.8.1, React Router DOM 7.16.0 | Rekayasa dasbor kontrol dan representasi visual pemantauan interaktif |
| **Broker** | Mosquitto MQTT | latest | Pengelolaan aliran pipa lalu lintas perpesanan M2M |

---

## 7. Prasyarat

Sejumlah komponen atau _environment_ wajib dipersiapkan terlebih dahulu.
- Node.js (versi 18+)
- Python (versi 3.8+)
- Mosquitto MQTT Broker
  - Ubuntu: `sudo apt install mosquitto mosquitto-clients`
  - Windows: Unduh *installer* .exe melalui `https://mosquitto.org/download/`
- Arduino IDE (URL package `https://dl.espressif.com/dl/package_esp32_index.json`)
- Fisik mikrokontroler ESP32 Dev Module, Sensor Suhu/Kelembaban DHT11, Sensor Cahaya LDR, modul *display* LCD I2C 16x2, LED, dan Komponen Buzzer pasif/aktif.

---

## 8. Instalasi & Menjalankan Proyek

Langkah demi langkah di bawah ini menjabarkan instruksi pengerjaan dari instalasi broker hingga peluncuran.

### 8a. MQTT Broker
Untuk menyiapkan saluran komunikasi IoT di OS Ubuntu:
```bash
sudo apt install mosquitto mosquitto-clients
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
systemctl status mosquitto
```

### 8b. Backend (FastAPI)
Langkah konfigurasi penyedia data server:
1. Pindah ke direktori utama: `cd backend/`
2. Eksekusi `python -m venv venv`, kemudian jalankan `source venv/bin/activate` untuk membuat dan memasuki *virtual environment* (jika di Windows gunakan `.\venv\Scripts\activate`).
3. Pasang kepustakaan: `pip install -r requirements.txt`
4. **Migrasi Database (Alembic):** Proyek ini menggunakan Alembic untuk mengatur versi struktur database.
   - Eksekusi pembuatan tabel awal: `alembic upgrade head`
   - Jika Anda mengubah struktur `models.py`, generate migrasi baru dengan: `alembic revision --autogenerate -m "Deskripsi"` lalu jalankan lagi `alembic upgrade head`.
5. Konfigurasikan lingkungan variabel: **[VERIFY - Berkas `.env.example` maupun mekanisme baca `os.environ` tidak ditemukan dalam kode `backend/`. IP dan MQTT Port menggunakan deklarasi statis (*hardcode*) `localhost` dan `1883` di dalam file `mqtt_client.py`.]**
6. Eksekusi server: `uvicorn main:app --reload`
7. Ekspektasi CLI Terminal: Server melaporkan "Application startup complete" beserta informasi status "MQTT Connected with result code 0".

### 8c. Frontend (React)
Langkah konfigurasi klien monitor antarmuka:
1. Pindah direktori: `cd frontend/`
2. Pasang paket npm: `npm install`
3. Konfigurasi kredensial: **[VERIFY - *Environment variables* pada aplikasi `frontend` melalui mode `.env` tidak diterapkan. Akses rute API backend terkonstruksi langsung lewat alamat statis di dalam kode TS (Vite).]**
4. Mainkan prapeluncuran lokal: `npm run dev`
5. Buka tautan rute lokal (contoh: http://localhost:5173).

### 8d. ESP32 Firmware
Panduan meluncurkan perangkat keras (_edge device_):
1. Buka berkas `SISTEM_MONITORING_BSF.ino` menggunakan IDE Arduino.
2. Melalui manajer *library*, pasang dependensi berikut: `Wire`, `LiquidCrystal_I2C`, `WiFi`, `PubSubClient`, `DHT`, `Preferences`, dan `ArduinoJson`.
3. Sesuaikan konstanta di *firmware* milik Anda (baris 12-32):
   - `const char* ssid = "Adesukma";`
   - `const char* password = "password_wifi";`
   - `const char* mqtt_server = "192.168.100.6";`
   - `#define DEVICE_ID "BSF-001"`
4. Pilih "ESP32 Dev Module" pada *Boards Manager*.
5. Tekan tombol _Upload_ untuk _flashing_ program.

---

## 9. Konfigurasi

Sistem ini didesain sesederhana mungkin untuk konfigurasi perangkat kandang di masa mendatangi.

### Menambah Kandang Baru
Setiap perangkat keras ESP32 secara otomatis meregistrasikan dirinya sendiri. Sistem ini dipicu pertama kali saat mikrokontroler melempar (mendistribusikan) *message payload* melalui topik utama `sensor/data`. Proses inspeksi `models.Device` di *function* `on_message` pada berkas `backend/mqtt_client.py` akan segera menyimpan identifikasi, jadi manipulasi masukan baris DB tidak perlu Anda lakukan secara manual.

### Mengubah Threshold
Manajemen batasan keamanan per perangkat memiliki 2 cara pendekatan: konfigurasi melewati menu **Settings** pada UI Dasbor (pendekatan yang paling direkomendasikan), atau eksekusi *query* modifikasi mandiri lewat tabel `thresholds` SQLite. Apabila konfigurasi menggunakan panel Dasbor, API PUT akan memicu penerusan otomatis (*publish* pesan MQTT) sehingga modul kandang langsung menyerap _value_ ambang batas terkini secara _real-time_ tanpa hambatan (sinkronisasi ESP32 memori NVS).

---

## 10. API Reference

Daftar spesifikasi antarmuka terprogram (*Application Programming Interface*) peladen RESTful.

### SENSOR
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/sensor/{unique_code}` | Menarik daftar koleksi riwayat pemantauan berbasis kerangka waktu dan *limit*. |
| `GET` | `/api/sensor/{unique_code}/latest` | Merengkuh rekam jejak sensorik kandang yang terbaru (urutan 1). |

<details>
<summary>Contoh response</summary>

```json
{
  "id": 105,
  "device_id": 1,
  "timestamp": "2026-06-05T09:21:00",
  "temperature": 29.8,
  "humidity": 78.0,
  "light_intensity": 3472.0
}
```
</details>

### THRESHOLD
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/threshold/{unique_code}` | Mendapatkan struktur nilai konfigurasi batas perangkat saat ini. |
| `PUT` | `/api/threshold/{unique_code}` | Mengunggah pergeseran *range* (peringatan dan fatal) terbaru ke sebuah alat. |

<details>
<summary>Contoh response</summary>

```json
{
  "id": 1,
  "device_id": 1,
  "temp_warning": 30.0,
  "temp_critical": 32.0,
  "humid_warning": 60.0,
  "humid_critical": 50.0,
  "light_warning": 2500.0,
  "light_critical": 2000.0,
  "updated_at": "2026-06-05T09:21:00"
}
```
</details>

### ALERT
| Method | Endpoint | Deskripsi |
|---|---|---|
| N/A | N/A | **[VERIFY - Endpoints untuk fitur 'Alert' belum terdeklarasikan pada `main.py`]** |

---

## 11. MQTT Topics

Struktur rute sistem terdistribusi perpesanan *Machine-to-Machine*.

| Topic | Arah | Publisher | Subscriber | Format Payload |
|---|---|---|---|---|
| `sensor/data` | Sistem → Database | ESP32 | Paho-MQTT (Backend Python) | Object JSON (suhu, ldr, rh, `unique_code`) |
| `threshold/config/{unique_code}` | Pengaturan → Sistem | Backend FastAPI | ESP32 (Firmware kandang) | Object JSON (_Warning/Critical Thresholds_) |

**Contoh Payload `sensor/data`**
```json
{
  "unique_code": "BSF-001",
  "temperature": 30.5,
  "humidity": 72,
  "light_intensity": 4095
}
```

**Contoh Payload `threshold/config/{unique_code}`**
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

Arsitektur entitas *database* untuk relasi penyimpan persisten lokal.

### `devices`
| Kolom | Tipe | Nullable | Default | Keterangan |
|---|---|---|---|---|
| `id` | Integer (PK) | No | AI | Baris identifikasi absolut |
| `unique_code` | String (Unique) | No | - | Kode unik (`DEVICE_ID`) penamaan tiap kontroler BSF |
| `name` | String | Yes | "Kandang Maggot" | Identitas ramah guna untuk representasi tampilan kandang |
| `location` | String | Yes | "Belum diatur" | Deskripsi tekstual letak kandang BSF beroperasi |
| `created_at` | DateTime | Yes | `datetime.utcnow` | Label pencatatan kalender pendaftaran *device* pertama kali |
> Berfungsi untuk inventarisasi profil informasi perangkat yang sudah pernah merapat kepada *broker*.

### `sensor_logs`
| Kolom | Tipe | Nullable | Default | Keterangan |
|---|---|---|---|---|
| `id` | Integer (PK) | No | AI | Numerik absolut entri riwayat |
| `device_id` | Integer (FK) | Yes | - | Referensi kait kepada kepemilikan tabel alat `devices` |
| `timestamp` | DateTime | Yes | `datetime.utcnow` | Bukti kronologis jam metrik itu tercatatkan |
| `temperature` | Float | Yes | - | Pencatat angka numerik nilai suhu (`C`) |
| `humidity` | Float | Yes | - | Pencatat angka numerik RH kelembaban udara (`%`) |
| `light_intensity` | Float | Yes | - | Nilai tingkat iluminasi cahaya sensor LDR (`ADC`) |
> Tabel agregasi utama untuk menyajikan titik kurva dan rekapitulasi performa iklim kandang BSF.

### `thresholds`
| Kolom | Tipe | Nullable | Default | Keterangan |
|---|---|---|---|---|
| `id` | Integer (PK) | No | AI | Nilai unik entri konfigurasi |
| `device_id` | Integer (FK) | Yes | - | Referensi ke profil kepemilikan (`devices.id`) |
| `temp_warning` | Float | Yes | 30.0 | Patokan aman suhu teratas sebelum masa kritis |
| `temp_critical` | Float | Yes | 32.0 | Batasan batas kritis mutlak suhu udara |
| `humid_warning` | Float | Yes | 60.0 | Patokan aman RH udara terbawah sebelum transisi bahaya |
| `humid_critical` | Float | Yes | 50.0 | Garis limit fatal RH kelembaban udara minimum |
| `light_warning` | Float | Yes | 2500.0 | Tingkat limit aman indikator ADC radiasi cahaya bawah |
| `light_critical` | Float | Yes | 2000.0 | Celah tingkat ADC terbawah indikator malnutrisi sinar |
| `updated_at` | DateTime | Yes | `datetime.utcnow` | Riwayat terakhir parameter alat terdistribusi dan tertimpa |
> Tabel persisten tempat penyimpanan kriteria ideal lingkungan agar proses otomatisasi peringatan tetap mengikat.

### `alert_logs`
| Kolom | Tipe | Nullable | Default | Keterangan |
|---|---|---|---|---|
| N/A | N/A | N/A | N/A | **[VERIFY - Model database bernama `alert_logs` masih belum terdefinisikan secara fungsional di `models.py`]** |
> Tabel ini direncanakan akan berfungsi sebagai pencatatan rekam status notifikasi sistem BSF Maggot Monitor.

---

## 13. Troubleshooting

Bagian ini mengakomodir penyelesaian beberapa isu operasional pada *environment*.

| Masalah | Kemungkinan Penyebab | Solusi |
|---|---|---|
| **ESP32 tidak terkoneksi ke MQTT broker** | Parameter konektivitas WiFi lemah, variabel konstanta IP *broker* berbeda dengan OS Linux Host/Mosquitto Server. | Konfirmasi IP komputer server *broker* (`ipconfig` atau `ifconfig`) dan verifikasikan `mqtt_server` pada IDE C++. |
| **Data sensor tidak muncul di dashboard** | Interupsi siklus layanan perpesanan FastAPI, Mosquitto Daemon sedang tidur, atau koneksi basis data macet (file IO read/write Lock). | Perhatikan CLI _FastAPI Uvicorn_. Usahakan untuk meluncurkan `uvicorn` SETELAH layanan Mosquitto menyala (Service `mosquitto.exe` aktif). |
| **Backend error saat startup** | Terdapat _software_ lain yang mencuri alokasi jaringan (port bentrok/8000) atau korupsi relasi `sqlite`. | Konfirmasi eksekusi *port* dengan `netstat`, atau matikan _background thread_ Python yang tertinggal mati gaya menggunakan `Task Manager`. |
| **Frontend tidak bisa fetch API (CORS error)** | Tautan asal (_Origin URL_) situs web berbeda dari izin `allow_origins`. | Edit parameter perizinan `CORSMiddleware` `app.add_middleware` pada berkas `backend/main.py`. |
| **Threshold tidak ter-sync ke perangkat** | _Network latency_ yang putus (_socket broken_) akibat jeda MQTT atau _reconnection timeout_ Paho. | Muat ulang skrip server (`uvicorn main:app --reload`). Simpan kembali konfigurasi dasbor supaya PUT API kembali ditembakkan. |

---

## 14. Kontribusi

Anda dapat menyumbangkan fitur dengan pedoman sebagai berikut:
- *Fork* repositori utama proyek ini.
- Buka cabang turunan (*branch*) profil pekerjaan baru: `git checkout -b feature/nama-fitur`
- Kirim rekam (_commit_) kode pembaruan (*dengan standar semantic/conventional commits*)
- Usulkan sebuah _Pull Request_ terhadap repositori asal ini.

---

## 15. Lisensi

MIT License

Copyright (c) 2026 [NAMA ANDA]

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
