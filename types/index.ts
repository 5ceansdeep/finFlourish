// types/index.ts

import { StackNavigationProp } from '@react-navigation/stack';

/**
 * 물고기 상태 타입 정의
 */
export type FishStatus = 'happy' | 'angry' | 'worry';

/**
 * 라즈베리파이 센서 데이터 구조 정의
 */
export interface SensorData {
  tds: number;
  temp: number; // 섭씨 온도
  ph: number;
  status: FishStatus; // 현재 물고기 상태
}

/**
 * 로그 기록 항목 구조 정의
 */
export interface LogEntry {
  id: string;
  date: string;
  status: FishStatus;
  message: string;
}

/**
 * React Navigation에서 사용하는 화면 파라미터 타입 정의
 */
export type RootStackParamList = {
  Splash: undefined;
  Main: undefined;
  Log: undefined;
};