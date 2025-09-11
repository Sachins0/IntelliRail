import uvicorn
from app.main import app

if __name__ == "__main__":
    print("Starting IntelliRail Backend...")
    print("API will be available at: http://localhost:8000")
    print("API Documentation at: http://localhost:8000/docs")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
