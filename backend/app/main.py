from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import uvicorn

from app.models.train import OptimizationRequest
from app.services.data_generator import SimpleDataGenerator
from app.services.optimizer import SimpleRailwayOptimizer

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

# Initialize services
data_generator = SimpleDataGenerator()
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

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
