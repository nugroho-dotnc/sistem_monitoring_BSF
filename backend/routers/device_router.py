from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

import models
from database import SessionLocal
from auth import get_db, get_current_user

router = APIRouter(
    prefix="/api/devices",
    tags=["Devices"]
)

class DeviceClaim(BaseModel):
    unique_code: str
    location: str

class DeviceResponse(BaseModel):
    id: int
    unique_code: str
    name: str
    location: str
    user_id: int

    class Config:
        from_attributes = True

@router.get("", response_model=List[DeviceResponse])
def get_user_devices(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    devices = db.query(models.Device).filter(models.Device.user_id == current_user.id).all()
    return devices

@router.post("", response_model=DeviceResponse)
def claim_device(claim: DeviceClaim, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    device = db.query(models.Device).filter(models.Device.unique_code == claim.unique_code).first()
    
    if not device:
        raise HTTPException(status_code=404, detail="Kode perangkat tidak ditemukan")
        
    if device.user_id is not None:
        if device.user_id == current_user.id:
            raise HTTPException(status_code=400, detail="Perangkat ini sudah Anda klaim")
        raise HTTPException(status_code=400, detail="Perangkat ini sudah diklaim oleh pengguna lain")
        
    device.user_id = current_user.id
    device.location = claim.location
    db.commit()
    db.refresh(device)
    
    # Init threshold if not exists
    threshold = db.query(models.Threshold).filter(models.Threshold.device_id == device.id).first()
    if not threshold:
        threshold = models.Threshold(device_id=device.id)
        db.add(threshold)
        db.commit()
        
    return device

@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(device_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    device = db.query(models.Device).filter(models.Device.id == device_id, models.Device.user_id == current_user.id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Perangkat tidak ditemukan atau bukan milik Anda")
    
    # Unclaim perangkat, biarkan data sensornya ada (karena hardware mungkin masih mengirim)
    device.user_id = None
    device.name = f"Kandang Maggot"
    device.location = "Belum diatur"
    db.commit()
    return
