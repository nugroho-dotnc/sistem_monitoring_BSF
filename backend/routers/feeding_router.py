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
    tags=["Feeding"]
)

class FeedingLogCreate(BaseModel):
    fed_at: Optional[datetime] = None
    feed_type: str
    weight_gram: float
    notes: Optional[str] = None

class FeedingLogResponse(BaseModel):
    id: int
    device_id: int
    fed_at: datetime
    feed_type: str
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

@router.get("/{device_id}/feeding", response_model=List[FeedingLogResponse])
def get_feeding_logs(
    device_id: int, 
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    verify_device_access(device_id, current_user.id, db)
    
    query = db.query(models.FeedingLog).filter(models.FeedingLog.device_id == device_id)
    if from_date:
        query = query.filter(models.FeedingLog.fed_at >= from_date)
    if to_date:
        query = query.filter(models.FeedingLog.fed_at <= to_date)
        
    return query.order_by(models.FeedingLog.fed_at.desc()).all()

@router.post("/{device_id}/feeding", response_model=FeedingLogResponse)
def create_feeding_log(
    device_id: int, 
    log: FeedingLogCreate, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    verify_device_access(device_id, current_user.id, db)
    
    new_log = models.FeedingLog(
        device_id=device_id,
        fed_at=log.fed_at or datetime.utcnow(),
        feed_type=log.feed_type,
        weight_gram=log.weight_gram,
        notes=log.notes
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@router.put("/{device_id}/feeding/{log_id}", response_model=FeedingLogResponse)
def update_feeding_log(
    device_id: int, 
    log_id: int, 
    log_update: FeedingLogCreate, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    verify_device_access(device_id, current_user.id, db)
    
    log = db.query(models.FeedingLog).filter(models.FeedingLog.id == log_id, models.FeedingLog.device_id == device_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Feeding log not found")
        
    if log_update.fed_at: log.fed_at = log_update.fed_at
    log.feed_type = log_update.feed_type
    log.weight_gram = log_update.weight_gram
    log.notes = log_update.notes
    
    db.commit()
    db.refresh(log)
    return log

@router.delete("/{device_id}/feeding/{log_id}")
def delete_feeding_log(
    device_id: int, 
    log_id: int, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    verify_device_access(device_id, current_user.id, db)
    
    log = db.query(models.FeedingLog).filter(models.FeedingLog.id == log_id, models.FeedingLog.device_id == device_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Feeding log not found")
        
    db.delete(log)
    db.commit()
    return {"detail": "Deleted"}
