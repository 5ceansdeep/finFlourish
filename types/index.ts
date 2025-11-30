// types/index.ts

import { StackNavigationProp } from "@react-navigation/stack";

/**
 * 물고기 종류 타입 정의
 */
export type FishType = "betta" | "goldfish" | "guppy";

/**
 * 물고기 정보 인터페이스
 */
export interface Fish {
  id: string;
  name: string;
  type: FishType;
  createdAt: string;
}

/**
 * 물고기 상태 타입 정의
 */
export type FishStatus = "happy" | "angry" | "worry";

/**
 * 라즈베리파이 센서 데이터 구조 정의
 */
export interface SensorData {
  tds: number;
  temp: number; // 섭씨 온도
  ph: number;
  status: FishStatus; // 현재 물고기 상태
  fishType: FishType; // 현재 물고기 종류
}

/**
 * 로그 타입 정의
 */
export type LogType = "status" | "feed" | "auto_feed";

/**
 * 로그 기록 항목 구조 정의
 */
export interface LogEntry {
  id: string;
  date: string;
  type: LogType; // 로그 타입 (상태 변화 or 먹이 주기 or 자동급여)
  status?: FishStatus; // 상태 로그일 경우
  message: string;
  autoFeedData?: {
    // 자동급여 로그일 경우
    executed: boolean; // true: 급여 실행, false: 급여 중단
    mode: "NORMAL" | "REDUCED" | "HOLD";
    reason: string;
  };
}

/**
 * React Navigation에서 사용하는 화면 파라미터 타입 정의
 */
export type RootStackParamList = {
  Splash: undefined;
  Main: undefined;
  Log: undefined;
  FishName: undefined;
  FishType: { fishName: string };
  MyFish: undefined;
};