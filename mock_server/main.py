from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Fin & Flourish Mock API Server"}

@app.get("/api/sensors")
def get_sensor_data():
    """센서 데이터 반환 (시뮬레이션)"""
    return {
        "tds": random.randint(30, 80),
        "temp": round(22 + random.random() * 6, 1),
        "ph": round(6.5 + random.random() * 1.5, 1),
        "status": random.choice(["happy", "worry", "angry"])
    }

@app.post("/api/feed")
def feed_fish():
    """먹이 주기 명령"""
    print("🐟 먹이 주기 명령 수신!")
    return {"success": True, "message": "먹이 주기 완료"}
