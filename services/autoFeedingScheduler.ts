// services/autoFeedingScheduler.ts
// 자동급여 스케줄러 및 기록 관리

import AsyncStorage from "@react-native-async-storage/async-storage";
import { FishType, FishStatus } from "../types";
import { FeedingMode } from "./autoFeedingService";

const LAST_FEED_TIME_KEY = "@last_auto_feed_time";
const AUTO_FEED_ENABLED_KEY = "@auto_feed_enabled";
const FEED_INTERVAL_KEY = "@feed_interval_hours";

export interface AutoFeedRecord {
  timestamp: string;
  mode: FeedingMode;
  executed: boolean; // true: 급여 실행, false: 급여 중단
  reason: string;
  fishType: FishType;
  sensorData: {
    temp: number;
    ph: number;
    tds: number;
    status: FishStatus;
  };
}

// 마지막 자동급여 시간 가져오기
export async function getLastAutoFeedTime(): Promise<Date | null> {
  try {
    const timeStr = await AsyncStorage.getItem(LAST_FEED_TIME_KEY);
    return timeStr ? new Date(timeStr) : null;
  } catch (error) {
    console.error("Failed to get last feed time:", error);
    return null;
  }
}

// 마지막 자동급여 시간 저장
export async function setLastAutoFeedTime(time: Date): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_FEED_TIME_KEY, time.toISOString());
  } catch (error) {
    console.error("Failed to set last feed time:", error);
  }
}

// 자동급여 활성화 상태 가져오기
export async function isAutoFeedEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(AUTO_FEED_ENABLED_KEY);
    return enabled === "true";
  } catch (error) {
    console.error("Failed to get auto feed enabled:", error);
    return false;
  }
}

// 자동급여 활성화/비활성화
export async function setAutoFeedEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTO_FEED_ENABLED_KEY, enabled.toString());
  } catch (error) {
    console.error("Failed to set auto feed enabled:", error);
  }
}

// 급여 간격(시간) 가져오기
export async function getFeedIntervalHours(): Promise<number> {
  try {
    const interval = await AsyncStorage.getItem(FEED_INTERVAL_KEY);
    return interval ? parseFloat(interval) : 8; // 기본값: 8시간
  } catch (error) {
    console.error("Failed to get feed interval:", error);
    return 8;
  }
}

// 급여 간격(시간) 설정
export async function setFeedIntervalHours(hours: number): Promise<void> {
  try {
    await AsyncStorage.setItem(FEED_INTERVAL_KEY, hours.toString());
  } catch (error) {
    console.error("Failed to set feed interval:", error);
  }
}

// 다음 급여 시간까지 남은 시간 (분 단위)
export async function getMinutesUntilNextFeed(): Promise<number | null> {
  const lastFeedTime = await getLastAutoFeedTime();
  if (!lastFeedTime) return null;

  const intervalHours = await getFeedIntervalHours();
  const nextFeedTime = new Date(
    lastFeedTime.getTime() + intervalHours * 60 * 60 * 1000
  );
  const now = new Date();
  const minutesRemaining = Math.floor(
    (nextFeedTime.getTime() - now.getTime()) / (60 * 1000)
  );

  return minutesRemaining;
}

// 급여 시간이 되었는지 확인
export async function shouldFeedNow(): Promise<boolean> {
  const minutesRemaining = await getMinutesUntilNextFeed();
  if (minutesRemaining === null) return true; // 처음 실행 시 바로 급여

  return minutesRemaining <= 0;
}

// 어종별 급여 간격 추천 (시간 단위)
export function getRecommendedInterval(
  fishType: FishType,
  mode: FeedingMode
): number {
  const intervals: Record<
    FishType,
    Record<FeedingMode, number>
  > = {
    betta: {
      NORMAL: 12, // 하루 2회 -> 12시간 간격
      REDUCED: 24, // 하루 1회 -> 24시간 간격
      HOLD: 999, // 급여 중단
    },
    goldfish: {
      NORMAL: 12, // 하루 1-2회 -> 12시간 간격
      REDUCED: 72, // 2-3일에 1회 -> 72시간 간격
      HOLD: 999,
    },
    guppy: {
      NORMAL: 8, // 하루 2-3회 -> 8시간 간격
      REDUCED: 24, // 하루 1회 -> 24시간 간격
      HOLD: 999,
    },
  };

  return intervals[fishType][mode];
}

// 자동급여 기록 생성
export function createAutoFeedRecord(
  mode: FeedingMode,
  executed: boolean,
  reason: string,
  fishType: FishType,
  sensorData: {
    temp: number;
    ph: number;
    tds: number;
    status: FishStatus;
  }
): AutoFeedRecord {
  return {
    timestamp: new Date().toISOString(),
    mode,
    executed,
    reason,
    fishType,
    sensorData,
  };
}

// 시간 포맷팅 (예: "2시간 30분 전")
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;

  if (diffHours < 24) {
    return remainingMinutes > 0
      ? `${diffHours}시간 ${remainingMinutes}분 전`
      : `${diffHours}시간 전`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 전`;
}

// 다음 급여 시간 포맷팅 (예: "2시간 30분 후")
export function formatTimeUntil(minutes: number): string {
  if (minutes <= 0) return "지금";
  if (minutes < 60) return `${minutes}분 후`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return remainingMinutes > 0
      ? `${hours}시간 ${remainingMinutes}분 후`
      : `${hours}시간 후`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0
    ? `${days}일 ${remainingHours}시간 후`
    : `${days}일 후`;
}
