from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

import models
from database import SessionLocal, engine
from mqtt_client import start_mqtt

# Buat tabel jika belum ada
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Maggot Farming API")

# Setup CORS agar bisa diakses oleh Frontend (React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Ganti dengan domain React saat production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
