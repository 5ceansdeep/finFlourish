# Mock Server (로컬 테스트용)

라즈베리파이 없이 Windows PC에서 테스트할 수 있는 Mock API 서버입니다.

## 설치 및 실행

### 1. Python 설치 확인
```bash
python --version
```

### 2. 가상환경 생성 (선택사항)
```bash
cd mock_server
python -m venv venv
venv\Scripts\activate
```

### 3. 패키지 설치
```bash
pip install -r requirements.txt
```

### 4. 서버 실행
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. 테스트
브라우저에서 접속:
- http://localhost:8000
- http://localhost:8000/api/sensors
- http://localhost:8000/docs (Swagger UI)

## React Native 앱 설정

`services/sensorService.ts`에서:

```typescript
// Windows PC에서 테스트 시
const API_BASE_URL = 'http://localhost:8000';

// Android 에뮬레이터에서 테스트 시
const API_BASE_URL = 'http://10.0.2.2:8000';

// iOS 시뮬레이터 또는 같은 와이파이의 실제 기기에서 테스트 시
const API_BASE_URL = 'http://YOUR_PC_IP:8000';  // ipconfig로 확인
```
