from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    unique_code = Column(String, unique=True, index=True)
    name = Column(String, default="Kandang Maggot")
    location = Column(String, default="Belum diatur")
    created_at = Column(DateTime, default=datetime.utcnow)

    logs = relationship("SensorLog", back_populates="device")
    threshold = relationship("Threshold", back_populates="device", uselist=False)
class SensorLog(Base):
    __tablename__ = "sensor_logs"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    temperature = Column(Float)
    humidity = Column(Float)
    light_intensity = Column(Float)

    device = relationship("Device", back_populates="logs")

class Threshold(Base):
    __tablename__ = "thresholds"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), unique=True)
    temp_warning = Column(Float, default=30.0)
    temp_critical = Column(Float, default=32.0)
    humid_warning = Column(Float, default=60.0)
    humid_critical = Column(Float, default=50.0)
    light_warning = Column(Float, default=30.0)
    light_critical = Column(Float, default=50.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    device = relationship("Device", back_populates="threshold")
