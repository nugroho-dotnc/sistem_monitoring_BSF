import json
import paho.mqtt.client as mqtt
from database import SessionLocal
import models

MQTT_BROKER = "localhost" # Ganti jika broker ada di IP lain
MQTT_PORT = 1883
MQTT_TOPIC = "sensor/data"

def on_connect(client, userdata, flags, rc):
    print(f"MQTT Connected with result code {rc}")
    client.subscribe(MQTT_TOPIC)

def on_message(client, userdata, msg):
    print(f"Message received on topic {msg.topic}: {msg.payload.decode()}")
    try:
        payload = json.loads(msg.payload.decode())
        unique_code = payload.get("unique_code")
        
        if not unique_code:
            print("Pesan tidak memiliki unique_code, diabaikan.")
            return

        db = SessionLocal()
        try:
            # Cari device, jika tidak ada otomatis daftarkan baru
            device = db.query(models.Device).filter(models.Device.unique_code == unique_code).first()
            if not device:
                print(f"Device baru terdeteksi: {unique_code}. Mendaftarkan...")
                device = models.Device(unique_code=unique_code, name=f"Device {unique_code}")
                db.add(device)
                db.commit()
                db.refresh(device)

            # Simpan log sensor ke database
            new_log = models.SensorLog(
                device_id=device.id,
                temperature=payload.get("temperature"),
                humidity=payload.get("humidity"),
                light_intensity=payload.get("light_intensity")
            )
            db.add(new_log)
            db.commit()
            print(f"Data sensor disimpan untuk {unique_code}")
        except Exception as e:
            print(f"Database error: {e}")
            db.rollback()
        finally:
            db.close()
            
    except json.JSONDecodeError:
        print("Failed to decode JSON payload")
    except Exception as e:
        print(f"Error handling message: {e}")

def start_mqtt():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message

    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start() # Jalankan di background thread
        print(f"Mulai mendengarkan MQTT Broker di {MQTT_BROKER}:{MQTT_PORT}")
    except Exception as e:
        print(f"Gagal koneksi ke MQTT broker: {e}")
