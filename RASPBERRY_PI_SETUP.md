# 라즈베리파이 FastAPI 서버 설정 가이드

## 1. 라즈베리파이에 FastAPI 설치

라즈베리파이 터미널에서 실행:

```bash
sudo apt update
sudo apt install python3-pip
pip3 install fastapi uvicorn
```

## 2. FastAPI 서버 파일 만들기

### 프로젝트 폴더 생성

```bash
mkdir ~/rpi_api
cd ~/rpi_api
```

### main.py 파일 생성

```bash
nano main.py
```

### main.py 코드 작성

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()

# CORS 설정 (React Native 앱에서 접근 가능하도록)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Fin & Flourish API Server"}

@app.get("/api/sensors")
def get_sensor_data():
    """
    센서 데이터 반환
    TODO: 실제 센서 값으로 교체
    """
    return {
        "tds": random.randint(30, 80),
        "temp": round(22 + random.random() * 6, 1),
        "ph": round(6.5 + random.random() * 1.5, 1),
        "status": random.choice(["happy", "worry", "angry"])
    }

@app.post("/api/feed")
def feed_fish():
    """
    먹이 주기 명령
    TODO: 실제 하드웨어 제어 코드 추가
    """
    print("먹이 주기 명령 수신")
    # GPIO 핀 제어 코드 추가 예정
    return {"success": True, "message": "먹이 주기 완료"}

@app.get("/temperature")
def read_temp():
    """테스트용 온도 엔드포인트"""
    temp = round(25 + random.random() * 5, 2)
    return {"temp": temp}
```

저장: `Ctrl + O` → `Enter` → `Ctrl + X`

## 3. 서버 실행

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

성공 메시지:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### 백그라운드 실행 (선택사항)

서버를 백그라운드에서 계속 실행하려면:

```bash
nohup uvicorn main:app --host 0.0.0.0 --port 8000 &
```

백그라운드 프로세스 확인:
```bash
ps aux | grep uvicorn
```

백그라운드 프로세스 종료:
```bash
pkill uvicorn
```

## 4. 라즈베리파이 IP 주소 확인

```bash
hostname -I
```

출력 예시:
```
192.168.0.42
```

이 IP 주소를 React Native 앱 설정에 사용합니다.

## 5. React Native 앱 설정

### services/sensorService.ts 파일 수정

```typescript
const API_BASE_URL = 'http://192.168.0.42:8000';  // 라즈베리파이 IP로 변경
```

## 6. 연결 테스트

### 브라우저에서 테스트

라즈베리파이와 같은 와이파이에 연결된 컴퓨터/핸드폰 브라우저에서:

```
http://192.168.0.42:8000/api/sensors
```

응답 예시:
```json
{
  "tds": 65,
  "temp": 25.3,
  "ph": 7.2,
  "status": "happy"
}
```

### curl로 테스트

```bash
# 센서 데이터 가져오기
curl http://192.168.0.42:8000/api/sensors

# 먹이 주기
curl -X POST http://192.168.0.42:8000/api/feed
```

## 중요 체크리스트

- [ ] 라즈베리파이와 스마트폰이 **같은 와이파이**에 연결되어 있는가?
- [ ] 라즈베리파이 IP 주소를 정확히 확인했는가?
- [ ] FastAPI 서버가 실행 중인가? (`ps aux | grep uvicorn`)
- [ ] 방화벽에서 8000번 포트가 열려 있는가?

## 포트 방화벽 설정 (필요시)

```bash
sudo ufw allow 8000
sudo ufw status
```

## 실제 센서 연동 (다음 단계)

`main.py`에서 실제 센서 라이브러리를 import하여 사용:

```python
# 예시: TDS 센서
import board
import busio
import adafruit_ads1x15.ads1115 as ADS
from adafruit_ads1x15.analog_in import AnalogIn

# 실제 센서 값 읽기
@app.get("/api/sensors")
def get_sensor_data():
    # TODO: 실제 센서 코드로 교체
    tds_value = read_tds_sensor()
    temp_value = read_temp_sensor()
    ph_value = read_ph_sensor()

    return {
        "tds": tds_value,
        "temp": temp_value,
        "ph": ph_value,
        "status": calculate_fish_status(tds_value, temp_value, ph_value)
    }
```

## 문제 해결

### 연결 안 됨
1. 같은 와이파이인지 확인
2. IP 주소 다시 확인: `hostname -I`
3. 서버 실행 중인지 확인: `ps aux | grep uvicorn`

### CORS 에러
- `main.py`에 CORS 미들웨어가 추가되어 있는지 확인

### 타임아웃 에러
- 라즈베리파이가 켜져 있는지 확인
- 네트워크 연결 상태 확인
