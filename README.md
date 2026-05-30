# Sistem Monitoring Smart Maggot Farming Berbasis IoT

Proyek ini adalah implementasi end-to-end sistem pemantauan cerdas untuk budidaya larva *Black Soldier Fly* (Maggot/BSF) menggunakan arsitektur Internet of Things (IoT).

Sistem ini dirancang untuk memonitor suhu, kelembaban, dan intensitas cahaya secara otomatis untuk memastikan kondisi optimal pertumbuhan maggot, sehingga mengurangi risiko gagal panen dan meminimalisir human error.

## Arsitektur Sistem (Four-Tier)
Proyek ini terdiri dari 3 komponen utama yang saling terhubung:
1. **Layer Hardware / Firmware (Folder ini):** Menggunakan ESP32 untuk membaca sensor (DHT11 & LDR) dan mengontrol aktuator (LCD, LED, Buzzer). Data dikirim via protokol MQTT (Wi-Fi).
2. **[Backend API & MQTT Subscriber](./backend):** Dibangun dengan Python (FastAPI & Paho-MQTT) dan SQLite untuk menangkap data sensor dari MQTT dan menyediakannya lewat REST API.
3. **[Frontend Dashboard](./frontend):** Dibangun dengan React + Vite (TypeScript) berdesain editorial premium untuk memvisualisasikan metrik real-time dan grafik historis.

## Konfigurasi Hardware (ESP32)

### Pinout
- **DHT11 (Suhu & Kelembaban):** Pin 4
- **LDR (Intensitas Cahaya):** Pin 34 (Analog)
- **LCD I2C (16x2):** SDA (Pin 21), SCL (Pin 22)
- **LED RGB (Merah):** Pin 25
- **LED RGB (Hijau):** Pin 26
- **Buzzer Aktif:** Pin 27

### Cara Penggunaan (Firmware)
1. Buka file `SISTEM_MONITORING_BSF.ino` di Arduino IDE.
2. Pastikan Anda telah menginstal *library* `PubSubClient`, `DHT sensor library`, dan `LiquidCrystal_I2C`.
3. Ubah konfigurasi WiFi dan MQTT Broker (IP Address) pada bagian atas kode:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   const char* mqtt_server = "192.168.1.XXX";
   ```
4. *Compile* dan *Upload* ke board ESP32.
