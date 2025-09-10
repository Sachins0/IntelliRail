from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

class TrainType(Enum):
    EXPRESS = "express"
    LOCAL = "local"
    FREIGHT = "freight"

class TrainPriority(Enum):
    HIGH = 3
    MEDIUM = 2
    LOW = 1

class Station(BaseModel):
    id: str
    name: str
    platforms: int

class Train(BaseModel):
    id: str
    name: str
    type: TrainType
    priority: TrainPriority
    delay_minutes: int = 0
    speed_kmh: float = 80.0

class TrainMovement(BaseModel):
    train_id: str
    from_station: str
    to_station: str
    scheduled_departure_hour: int  # 0-23
    scheduled_arrival_hour: int
    platform: int = 1
    delay_minutes: int = 0
    
class OptimizationRequest(BaseModel):
    trains: List[Train]
    stations: List[Station]
    movements: List[TrainMovement]
