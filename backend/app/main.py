from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import uvicorn
from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import json
from datetime import datetime

from app.models.train import OptimizationRequest
from app.services.optimizer import SimpleRailwayOptimizer

from app.services.data_generator import AdvancedDataGenerator
import random


# Initialize the advanced data generator
advanced_generator = AdvancedDataGenerator()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()


# Create FastAPI app
app = FastAPI(
    title="IntelliRail API",
    description="AI-Powered Railway Traffic Control - 2 Day Demo",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for demo
    allow_methods=["*"],
    allow_headers=["*"],
)

optimizer = SimpleRailwayOptimizer()

@app.get("/")
async def root():
    return {
        "message": "IntelliRail API is running!",
        "version": "1.0.0",
        "status": "active"
    }

@app.get("/api/demo-data")
async def get_demo_data():
    """Get sample railway data for demo"""
    try:
        data = data_generator.generate_demo_data()
        return {
            "trains": [train.dict() for train in data["trains"]],
            "stations": [station.dict() for station in data["stations"]],
            "movements": [movement.dict() for movement in data["movements"]]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data generation failed: {str(e)}")

@app.post("/api/optimize")
async def optimize_railway(request: OptimizationRequest):
    """Optimize railway schedule"""
    try:
        result = optimizer.optimize_simple(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@app.get("/api/status")
async def system_status():
    """Get system status"""
    return {
        "system": "operational",
        "optimizer": "ready",
        "data_generator": "ready",
        "timestamp": "2025-09-12T10:00:00Z"
    }

@app.websocket("/ws/simulation")
async def websocket_simulation(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Simulate real-time train updates
            simulation_data = {
                "timestamp": datetime.now().isoformat(),
                "type": "train_position_update",
                "data": {
                    "train_id": f"TRN_{random.randint(1, 6):03d}",
                    "current_station": f"STN_{random.randint(1, 4)}",
                    "delay_minutes": random.randint(0, 30),
                    "speed_kmh": random.uniform(60, 120),
                    "status": random.choice(["on_time", "delayed", "approaching"])
                }
            }
            
            await manager.broadcast(json.dumps(simulation_data))
            await asyncio.sleep(2)  # Update every 2 seconds
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/api/start-simulation")
async def start_simulation():
    """Start real-time simulation"""
    return {"status": "simulation_started", "message": "Real-time updates active"}

@app.post("/api/stop-simulation")
async def stop_simulation():
    """Stop real-time simulation"""
    return {"status": "simulation_stopped", "message": "Real-time updates paused"}

# Add these routes to your main.py
@app.get("/api/scenarios")
async def get_available_scenarios():
    """Get list of available scenarios"""
    return {
        "scenarios": [
            {
                "id": "normal",
                "name": "Normal Operations",
                "description": "Regular railway operations with minimal delays",
                "difficulty": "Easy",
                "expected_improvement": "15-25%"
            },
            {
                "id": "peak_hour",
                "name": "Peak Hour Congestion", 
                "description": "Rush hour with high traffic and platform conflicts",
                "difficulty": "Medium",
                "expected_improvement": "25-40%"
            },
            {
                "id": "weather_disruption",
                "name": "Weather Disruption",
                "description": "Heavy rainfall causing significant delays",
                "difficulty": "Hard", 
                "expected_improvement": "30-45%"
            },
            {
                "id": "mechanical_failure",
                "name": "Mechanical Failure",
                "description": "Major equipment failure causing cascade delays",
                "difficulty": "Very Hard",
                "expected_improvement": "35-50%"
            }
        ]
    }

@app.post("/api/generate-scenario")
async def generate_scenario(request: dict):
    """Generate specific scenario data"""
    scenario_type = request.get("scenario_type", "normal")
    try:
        data = advanced_generator.generate_realistic_scenario(scenario_type)
        return {
            "scenario_info": {
                "type": data["scenario"],
                "description": data["description"],
                "expected_improvement": data.get("expected_improvement")
            },
            "trains": [train.dict() for train in data["trains"]],
            "stations": [station.dict() for station in data["stations"]],
            "movements": [movement.dict() for movement in data["movements"]]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scenario generation failed: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
