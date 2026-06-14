import json
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, model_validator

import models
from database import SessionLocal, engine
from mqtt_client import start_mqtt, mqtt_client

# Buat tabel jika belum ada
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Maggot Farming API")

# Setup CORS agar bisa diakses oleh Frontend (React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import auth_router, device_router, feeding_router, weight_router
app.include_router(auth_router.router)
app.include_router(device_router.router)
app.include_router(feeding_router.router)
app.include_router(weight_router.router)


# Dependency untuk mendapatkan koneksi Database
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Start MQTT Client saat FastAPI mulai
@app.on_event("startup")
def startup_event():
    start_mqtt()

class ThresholdUpdate(BaseModel):
    temp_warning: float
    temp_critical: float
    humid_warning: float
    humid_critical: float
    light_warning: float
    light_critical: float

    @model_validator(mode='after')
    def check_thresholds(self):
        if self.temp_warning is not None and self.temp_critical is not None and self.temp_warning >= self.temp_critical:
            raise ValueError('temp_warning must be less than temp_critical')
        
        if self.humid_warning is not None and self.humid_critical is not None and self.humid_warning <= self.humid_critical:
            raise ValueError('humid_warning must be greater than humid_critical')

        if self.light_warning is not None and self.light_critical is not None and self.light_warning >= self.light_critical:
            raise ValueError('light_warning must be less than light_critical')

        if self.temp_warning is not None and self.temp_warning < 0: raise ValueError('temp_warning must be positive')
        if self.temp_critical is not None and self.temp_critical < 0: raise ValueError('temp_critical must be positive')
        if self.humid_warning is not None and self.humid_warning < 0: raise ValueError('humid_warning must be positive')
        if self.humid_critical is not None and self.humid_critical < 0: raise ValueError('humid_critical must be positive')
        if self.light_warning is not None and self.light_warning < 0: raise ValueError('light_warning must be positive')
        if self.light_critical is not None and self.light_critical < 0: raise ValueError('light_critical must be positive')

        return self

@app.get("/")
def read_root():
    return {"message": "API Smart Maggot Farming Berjalan!"}

@app.get("/api/device/{unique_code}")
def get_device(unique_code: str, db: Session = Depends(get_db)):
    """Mendapatkan data device (kandang) berdasarkan unique_code. Berguna untuk login."""
    device = db.query(models.Device).filter(models.Device.unique_code == unique_code).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device tidak ditemukan")
    return {
        "id": device.id,
        "unique_code": device.unique_code,
        "name": device.name,
        "location": device.location
    }

@app.get("/api/threshold/{unique_code}")
def get_threshold(unique_code: str, db: Session = Depends(get_db)):
    device = db.query(models.Device).filter(models.Device.unique_code == unique_code).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device tidak ditemukan")
    
    threshold = db.query(models.Threshold).filter(models.Threshold.device_id == device.id).first()
    if not threshold:
        # Create default if not exist (fallback)
        threshold = models.Threshold(device_id=device.id)
        db.add(threshold)
        db.commit()
        db.refresh(threshold)
        
    return threshold

@app.put("/api/threshold/{unique_code}")
def update_threshold(unique_code: str, data: ThresholdUpdate, db: Session = Depends(get_db)):
    device = db.query(models.Device).filter(models.Device.unique_code == unique_code).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device tidak ditemukan")

    threshold = db.query(models.Threshold).filter(models.Threshold.device_id == device.id).first()
    if not threshold:
        threshold = models.Threshold(device_id=device.id)
        db.add(threshold)
    
    threshold.temp_warning = data.temp_warning
    threshold.temp_critical = data.temp_critical
    threshold.humid_warning = data.humid_warning
    threshold.humid_critical = data.humid_critical
    threshold.light_warning = data.light_warning
    threshold.light_critical = data.light_critical
    threshold.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(threshold)
    
    payload = {
        "temp_warning": threshold.temp_warning,
        "temp_critical": threshold.temp_critical,
        "humid_warning": threshold.humid_warning,
        "humid_critical": threshold.humid_critical,
        "light_warning": threshold.light_warning,
        "light_critical": threshold.light_critical
    }
    
    topic = f"threshold/config/{unique_code}"
    mqtt_client.publish(topic, json.dumps(payload))
    
    return threshold

@app.get("/api/sensor/{unique_code}")
def get_historical_sensor_data(
    unique_code: str, 
    start_time: Optional[datetime] = Query(None, description="Format: YYYY-MM-DDTHH:MM:SS"),
    end_time: Optional[datetime] = Query(None, description="Format: YYYY-MM-DDTHH:MM:SS"),
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Mendapatkan riwayat data sensor untuk sebuah device, bisa di filter by rentang waktu."""
    # Cek device
    device = db.query(models.Device).filter(models.Device.unique_code == unique_code).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device tidak ditemukan")

    query = db.query(models.SensorLog).filter(models.SensorLog.device_id == device.id)

    # Filter Waktu
    if start_time:
        query = query.filter(models.SensorLog.timestamp >= start_time)
    if end_time:
        query = query.filter(models.SensorLog.timestamp <= end_time)

    # Urutkan dari terbaru, tapi batasi sesuai limit
    logs = query.order_by(models.SensorLog.timestamp.desc()).limit(limit).all()
    
    # Balik agar urutannya dari terlama ke terbaru untuk grafik (kiri ke kanan)
    logs.reverse()
    
    return logs

@app.get("/api/sensor/{unique_code}/latest")
def get_latest_sensor_data(unique_code: str, db: Session = Depends(get_db)):
    """Mendapatkan 1 data sensor paling baru (untuk metrik realtime)."""
    # Cek device
    device = db.query(models.Device).filter(models.Device.unique_code == unique_code).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device tidak ditemukan")

    log = db.query(models.SensorLog).filter(models.SensorLog.device_id == device.id).order_by(models.SensorLog.timestamp.desc()).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="Belum ada data sensor untuk device ini")
        
    return log
