from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

import models
from database import SessionLocal
from auth import get_db, get_current_user

router = APIRouter(
    prefix="/api/devices",
    tags=["Weight"]
)

class WeightLogCreate(BaseModel):
    weighed_at: Optional[datetime] = None
    weight_gram: float
    notes: Optional[str] = None

class WeightLogResponse(BaseModel):
    id: int
    device_id: int
    weighed_at: datetime
    weight_gram: float
    notes: Optional[str]

    class Config:
        from_attributes = True

def verify_device_access(device_id: int, user_id: int, db: Session):
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if device.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this device")
    return device

@router.get("/{device_id}/weight", response_model=List[WeightLogResponse])
def get_weight_logs(
    device_id: int, 
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    verify_device_access(device_id, current_user.id, db)
    
    query = db.query(models.MaggotWeightLog).filter(models.MaggotWeightLog.device_id == device_id)
    if from_date:
        query = query.filter(models.MaggotWeightLog.weighed_at >= from_date)
    if to_date:
        query = query.filter(models.MaggotWeightLog.weighed_at <= to_date)
        
    return query.order_by(models.MaggotWeightLog.weighed_at.desc()).all()

@router.post("/{device_id}/weight", response_model=WeightLogResponse)
def create_weight_log(
    device_id: int, 
    log: WeightLogCreate, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    verify_device_access(device_id, current_user.id, db)
    
    new_log = models.MaggotWeightLog(
        device_id=device_id,
        weighed_at=log.weighed_at or datetime.utcnow(),
        weight_gram=log.weight_gram,
        notes=log.notes
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@router.put("/{device_id}/weight/{log_id}", response_model=WeightLogResponse)
def update_weight_log(
    device_id: int, 
    log_id: int, 
    log_update: WeightLogCreate, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    verify_device_access(device_id, current_user.id, db)
    
    log = db.query(models.MaggotWeightLog).filter(models.MaggotWeightLog.id == log_id, models.MaggotWeightLog.device_id == device_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Weight log not found")
        
    if log_update.weighed_at: log.weighed_at = log_update.weighed_at
    log.weight_gram = log_update.weight_gram
    log.notes = log_update.notes
    
    db.commit()
    db.refresh(log)
    return log

@router.delete("/{device_id}/weight/{log_id}")
def delete_weight_log(
    device_id: int, 
    log_id: int, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    verify_device_access(device_id, current_user.id, db)
    
    log = db.query(models.MaggotWeightLog).filter(models.MaggotWeightLog.id == log_id, models.MaggotWeightLog.device_id == device_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Weight log not found")
        
    db.delete(log)
    db.commit()
    return {"detail": "Deleted"}
