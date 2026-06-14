import json
import time
import random
import paho.mqtt.client as mqtt

# Konfigurasi MQTT Broker
MQTT_BROKER = "localhost" # Sesuaikan jika menggunakan IP lain (misal: "10.101.17.43")
MQTT_PORT = 1883
MQTT_TOPIC = "sensor/data"

# Konfigurasi Device
DEVICE_ID = "ESP32_RAK_A"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"✅ Berhasil terhubung ke MQTT Broker di {MQTT_BROKER}:{MQTT_PORT}")
    else:
        print(f"❌ Gagal terhubung, kode error: {rc}")

def send_dummy_data():
    client = mqtt.Client()
    client.on_connect = on_connect
    
    print("Mencoba terhubung ke broker...")
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
    except Exception as e:
        print(f"Error koneksi ke MQTT: {e}")
        return

    time.sleep(1) # Tunggu sebentar agar koneksi stabil

    print("Mulai mengirim data dummy. Tekan Ctrl+C untuk berhenti.\n")
    try:
        while True:
            # Generate dummy data
            # Suhu ruangan antara 25.0 - 35.0 C
            temperature = round(random.uniform(25.0, 35.0), 1)
            # Kelembapan antara 40 - 80 %
            humidity = round(random.uniform(40.0, 80.0), 0)
            # Intensitas cahaya antara 500 - 3000
            light_intensity = int(random.uniform(500, 3000))

            payload = {
                "unique_code": DEVICE_ID,
                "temperature": temperature,
                "humidity": humidity,
                "light_intensity": light_intensity
            }

            payload_json = json.dumps(payload)
            
            # Publish ke MQTT Broker
            result = client.publish(MQTT_TOPIC, payload_json)
            status = result[0]
            
            if status == 0:
                print(f"⬆️ Sent: {payload_json}")
            else:
                print(f"⚠️ Failed to send data to topic {MQTT_TOPIC}")

            # Kirim data setiap 5 detik (Sesuai settingan asli ESP32)
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("\nPengiriman data dihentikan.")
    finally:
        client.loop_stop()
        client.disconnect()
        print("Terputus dari MQTT Broker.")

if __name__ == "__main__":
    send_dummy_data()
