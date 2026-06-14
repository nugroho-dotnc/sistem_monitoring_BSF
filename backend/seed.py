import random
from datetime import datetime, timedelta

from database import engine, Base, SessionLocal
from models import User, Device, SensorLog, Threshold, FeedingLog, MaggotWeightLog
from auth import get_password_hash

def seed_database():
    print("Mereset database (Drop & Recreate Tables)...")
    # Drop semua tabel
    Base.metadata.drop_all(bind=engine)
    # Buat ulang tabel
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        print("Menambahkan User...")
        # 1. Buat User
        admin = User(
            farm_name="Peternakan BSF Mandiri",
            email="admin@example.com",
            hashed_password=get_password_hash("admin123")
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("Menambahkan Device Rak A & Rak B...")
        # 2. Buat Devices
        rak_a = Device(
            unique_code="ESP32_RAK_A",
            name="Rak A (Utama)",
            location="Gudang Utara",
            user_id=admin.id
        )
        rak_b = Device(
            unique_code="ESP32_RAK_B",
            name="Rak B (Cadangan)",
            location="Gudang Selatan",
            user_id=admin.id
        )
        db.add(rak_a)
        db.add(rak_b)
        db.commit()
        db.refresh(rak_a)
        db.refresh(rak_b)
        
        print("Mereset Threshold...")
        # 3. Buat Thresholds
        db.add(Threshold(device_id=rak_a.id, temp_warning=30.0, temp_critical=35.0, humid_warning=50.0, humid_critical=40.0))
        db.add(Threshold(device_id=rak_b.id, temp_warning=30.0, temp_critical=35.0, humid_warning=50.0, humid_critical=40.0))
        
        print("Mengumpulkan data log 7 hari ke belakang...")
        # 4. Generate Data Harian (7 Hari terakhir)
        now = datetime.utcnow()
        
        for device in [rak_a, rak_b]:
            current_weight = 100.0 # Mulai dari 100 gram
            
            for day in range(7, -1, -1):
                target_date = now - timedelta(days=day)
                
                # --- Sensor Logs (24 jam, per jam) ---
                for hour in range(24):
                    log_time = target_date.replace(hour=hour, minute=0, second=0)
                    if log_time > now:
                        break # Jangan lewati jam sekarang
                    
                    # Buat fluktuasi suhu (Siang panas, malam dingin)
                    is_daytime = 7 <= hour <= 17
                    base_temp = random.uniform(28.0, 34.0) if is_daytime else random.uniform(24.0, 27.0)
                    base_humid = random.uniform(50.0, 70.0)
                    base_light = random.uniform(1000.0, 3000.0) if is_daytime else random.uniform(0.0, 100.0)
                    
                    db.add(SensorLog(
                        device_id=device.id,
                        timestamp=log_time,
                        temperature=round(base_temp, 2),
                        humidity=round(base_humid, 2),
                        light_intensity=round(base_light, 2)
                    ))
                
                # --- Feeding Logs (Diberi makan 2x sehari) ---
                if target_date.date() < now.date() or now.hour > 8:
                    db.add(FeedingLog(
                        device_id=device.id,
                        fed_at=target_date.replace(hour=8, minute=30, second=0),
                        feed_type="Limbah Buah",
                        weight_gram=random.uniform(400.0, 500.0),
                        notes="Makan pagi"
                    ))
                if target_date.date() < now.date() or now.hour > 16:
                    db.add(FeedingLog(
                        device_id=device.id,
                        fed_at=target_date.replace(hour=16, minute=0, second=0),
                        feed_type="Ampas Tahu",
                        weight_gram=random.uniform(300.0, 400.0),
                        notes="Makan sore"
                    ))
                
                # --- Weight Logs (Ditimbang sekali sehari setiap sore) ---
                if target_date.date() < now.date() or now.hour > 17:
                    # Gain harian antara 30g - 80g
                    daily_gain = random.uniform(30.0, 80.0)
                    current_weight += daily_gain
                    
                    db.add(MaggotWeightLog(
                        device_id=device.id,
                        weighed_at=target_date.replace(hour=17, minute=30, second=0),
                        weight_gram=round(current_weight, 2),
                        notes="Penimbangan rutin harian"
                    ))

        db.commit()
        print("\n✅ SEEDING BERHASIL!")
        print("Database telah di-refresh dengan data dummy yang relevan (Rak A & Rak B, data 7 hari).")
        print("\nCredential Login:")
        print("Email: admin@example.com")
        print("Password: admin123")
        
    except Exception as e:
        print("❌ Terjadi kesalahan saat seeding:", str(e))
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
