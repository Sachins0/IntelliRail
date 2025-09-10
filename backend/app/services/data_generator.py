import random
from typing import List
from app.models.train import Train, Station, TrainMovement, TrainType, TrainPriority

class SimpleDataGenerator:
    def __init__(self):
        self.station_names = [
            "Central Junction", "North Terminal", "South Gate", 
            "East Station", "West Hub"
        ]
        self.train_names = [
            "Express 001", "Local 102", "Freight 203", 
            "Express 104", "Local 205", "Express 306"
        ]
    
    def generate_demo_data(self):
        """Generate simple demo data for 2-day prototype"""
        
        # Create 4 stations
        stations = []
        for i in range(4):
            station = Station(
                id=f"STN_{i+1}",
                name=self.station_names[i],
                platforms=random.randint(2, 4)
            )
            stations.append(station)
        
        # Create 6 trains
        trains = []
        train_types = [TrainType.EXPRESS, TrainType.LOCAL, TrainType.FREIGHT]
        priorities = [TrainPriority.HIGH, TrainPriority.MEDIUM, TrainPriority.LOW]
        
        for i in range(6):
            train = Train(
                id=f"TRN_{i+1:03d}",
                name=self.train_names[i],
                type=random.choice(train_types),
                priority=random.choice(priorities),
                delay_minutes=random.randint(0, 30),
                speed_kmh=random.uniform(60, 100)
            )
            trains.append(train)
        
        # Create train movements (2 per train)
        movements = []
        for i, train in enumerate(trains):
            # First movement
            start_hour = 8 + i  # Spread trains from 8 AM onwards
            movement1 = TrainMovement(
                train_id=train.id,
                from_station=f"STN_{(i % 3) + 1}",
                to_station=f"STN_{((i+1) % 3) + 1}",
                scheduled_departure_hour=start_hour,
                scheduled_arrival_hour=start_hour + 1,
                platform=random.randint(1, 3),
                delay_minutes=train.delay_minutes
            )
            movements.append(movement1)
            
            # Second movement
            movement2 = TrainMovement(
                train_id=train.id,
                from_station=movement1.to_station,
                to_station=f"STN_{((i+2) % 3) + 1}",
                scheduled_departure_hour=start_hour + 2,
                scheduled_arrival_hour=start_hour + 3,
                platform=random.randint(1, 3),
                delay_minutes=train.delay_minutes
            )
            movements.append(movement2)
        
        return {
            "trains": trains,
            "stations": stations,
            "movements": movements
        }
