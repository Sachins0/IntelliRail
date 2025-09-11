import random
from typing import List, Dict
from datetime import datetime, timedelta
from app.models.train import Train, Station, TrainMovement, TrainType, TrainPriority

class AdvancedDataGenerator:
    def __init__(self):
        self.station_names = [
            "Mumbai Central", "Delhi Junction", "Chennai Express Hub", 
            "Kolkata Terminal", "Bangalore City", "Hyderabad Central"
        ]
        self.train_names = [
            "Rajdhani Express", "Shatabdi Express", "Duronto Express",
            "Jan Shatabdi", "Garib Rath", "Humsafar Express",
            "Tejas Express", "Vande Bharat"
        ]
        
    def generate_realistic_scenario(self, scenario_type: str = "normal"):
        """Generate realistic railway scenarios"""
        
        if scenario_type == "peak_hour":
            return self._generate_peak_hour_scenario()
        elif scenario_type == "weather_disruption":
            return self._generate_weather_scenario()
        elif scenario_type == "mechanical_failure":
            return self._generate_failure_scenario()
        else:
            return self._generate_normal_scenario()
    
    def _generate_normal_scenario(self):
        """Normal operations"""
        stations = self._create_stations(5)
        trains = self._create_trains(8, delay_range=(0, 15))
        movements = self._create_movements(trains, stations, conflict_probability=0.3)
        
        return {
            "scenario": "normal_operations",
            "description": "Regular railway operations with minimal delays",
            "trains": trains,
            "stations": stations,
            "movements": movements,
            "expected_improvement": "15-25%"
        }
    
    def _generate_peak_hour_scenario(self):
        """Peak hour with high congestion"""
        stations = self._create_stations(4, platform_range=(3, 6))
        trains = self._create_trains(12, delay_range=(10, 45))  # More trains, more delays
        movements = self._create_movements(trains, stations, conflict_probability=0.7)
        
        return {
            "scenario": "peak_hour_congestion",
            "description": "Rush hour with high traffic and platform conflicts",
            "trains": trains,
            "stations": stations,
            "movements": movements,
            "expected_improvement": "25-40%"
        }
    
    def _generate_weather_scenario(self):
        """Weather-related disruptions"""
        stations = self._create_stations(4)
        trains = self._create_trains(8, delay_range=(20, 60))  # Weather delays
        movements = self._create_movements(trains, stations, conflict_probability=0.5)
        
        # Add weather-specific delays
        for movement in movements:
            if random.random() < 0.6:  # 60% affected by weather
                movement.delay_minutes += random.randint(15, 30)
        
        return {
            "scenario": "weather_disruption",
            "description": "Heavy rainfall causing significant delays across the network",
            "trains": trains,
            "stations": stations,
            "movements": movements,
            "expected_improvement": "30-45%",
            "weather_condition": "heavy_rain",
            "affected_routes": random.randint(4, 6)
        }
    
    def _generate_failure_scenario(self):
        """Mechanical failure scenario"""
        stations = self._create_stations(5)
        trains = self._create_trains(8, delay_range=(5, 25))
        movements = self._create_movements(trains, stations, conflict_probability=0.4)
        
        # Simulate one major failure causing cascade delays
        failed_train = random.choice(trains)
        failed_train.delay_minutes = 90  # Major delay
        
        # Cascade effect on other trains
        for movement in movements:
            if movement.train_id != failed_train.id:
                if random.random() < 0.4:  # 40% chance of being affected
                    movement.delay_minutes += random.randint(10, 20)
        
        return {
            "scenario": "mechanical_failure",
            "description": f"Major mechanical failure of {failed_train.name} causing cascade delays",
            "trains": trains,
            "stations": stations,
            "movements": movements,
            "expected_improvement": "35-50%",
            "failed_train": failed_train.id,
            "cascade_affected": sum(1 for m in movements if m.delay_minutes > 20)
        }
    
    def _create_stations(self, count: int, platform_range=(2, 4)) -> List[Station]:
        stations = []
        for i in range(count):
            station = Station(
                id=f"STN_{i+1:03d}",
                name=self.station_names[i % len(self.station_names)],
                platforms=random.randint(platform_range[0], platform_range[1])
            )
            stations.append(station)
        return stations
    
    def _create_trains(self, count: int, delay_range=(0, 30)) -> List[Train]:
        trains = []
        train_types = list(TrainType)
        priorities = list(TrainPriority)
        
        for i in range(count):
            train = Train(
                id=f"TRN_{i+1:03d}",
                name=self.train_names[i % len(self.train_names)],
                type=random.choice(train_types),
                priority=random.choice(priorities),
                delay_minutes=random.randint(delay_range[0], delay_range[1]),
                speed_kmh=random.uniform(80, 160)
            )
            trains.append(train)
        return trains
    
    def _create_movements(self, trains: List[Train], stations: List[Station], 
                         conflict_probability: float = 0.3) -> List[TrainMovement]:
        movements = []
        time_slots = list(range(6, 22))  # 6 AM to 10 PM
        
        for train in trains:
            # Create 2-3 movements per train
            num_movements = random.randint(2, 3)
            current_time = random.choice(time_slots)
            
            for j in range(num_movements):
                from_station = random.choice(stations)
                to_station = random.choice([s for s in stations if s.id != from_station.id])
                
                # Intentionally create conflicts for demonstration
                platform = 1  # Start with platform 1
                if random.random() < conflict_probability:
                    # Create potential conflict by using same time/platform
                    existing_movements = [m for m in movements 
                                        if m.from_station == from_station.id 
                                        and m.scheduled_departure_hour == current_time]
                    if existing_movements:
                        platform = existing_movements[0].platform  # Same platform = conflict
                else:
                    platform = random.randint(1, from_station.platforms)
                
                movement = TrainMovement(
                    train_id=train.id,
                    from_station=from_station.id,
                    to_station=to_station.id,
                    scheduled_departure_hour=current_time,
                    scheduled_arrival_hour=current_time + random.randint(1, 3),
                    platform=platform,
                    delay_minutes=train.delay_minutes
                )
                movements.append(movement)
                
                current_time += random.randint(2, 4)  # Next movement
                if current_time > 22:
                    break
        
        return movements