# Fin & Flourish

스마트 어항 모니터링 및 관리 애플리케이션

## 소개

Fin & Flourish는 라즈베리파이와 연동하여 어항의 수질 상태를 실시간으로 모니터링하고, 물고기에게 먹이를 줄 수 있는 React Native 기반 모바일 앱입니다.

## 주요 기능

- **수질 모니터링**: TDS, 온도, pH 센서 데이터 실시간 확인
- **물고기 상태 표시**: 수질 상태에 따른 물고기 기분 시각화 (happy/worry/angry)
- **원격 먹이 주기**: 앱에서 버튼 하나로 먹이 급여
- **기록 확인**: 과거 수질 및 상태 기록 조회

## 기술 스택

- **Frontend**: React Native, Expo
- **Navigation**: React Navigation (Stack Navigator)
- **UI**: expo-linear-gradient, react-native-gesture-handler
- **Font**: Press Start 2P (픽셀 스타일)
- **Backend**: 라즈베리파이 Flask API (예정)

## 설치 및 실행

### 요구사항

- Node.js 18+
- npm 또는 yarn
- Expo CLI
- iOS Simulator / Android Emulator 또는 Expo Go 앱

### 설치

```bash
# 의존성 설치
npm install
```

### 실행

```bash
# 개발 서버 시작
npm start

# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 프로젝트 구조

```
finFlourish/
├── App.tsx                 # 앱 진입점 및 네비게이션 설정
├── screens/
│   ├── SplashScreen.tsx    # 스플래시 화면
│   ├── MainScreen.tsx      # 메인 대시보드
│   └── LogScreen.tsx       # 기록 화면
├── services/
│   └── sensorService.ts    # 센서 데이터 API 서비스
├── types/
│   └── index.ts            # TypeScript 타입 정의
└── FinAndFlourish/
    └── assets/images/      # 이미지 리소스
```

## 센서 데이터

| 센서 | 단위 | 정상 범위 |
|------|------|-----------|
| TDS | ppm | 0-100 |
| 온도 | °C | 15-30 |
| pH | - | 6.0-9.0 |

## 라즈베리파이 API 연동

`services/sensorService.ts`에서 API 주소를 실제 라즈베리파이 IP로 변경:

```typescript
const API_BASE_URL = 'http://YOUR_RASPBERRY_PI_IP:5000';
```

### API 엔드포인트

- `GET /api/sensors` - 센서 데이터 조회
- `POST /api/feed` - 먹이 주기 명령

## 라이선스

MIT License
