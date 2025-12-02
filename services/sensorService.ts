// services/sensorService.ts

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FishType, SensorData } from "../types";

// 라즈베리파이 API 주소
const API_BASE_URL = "http://172.20.10.2:8000";

// TODO: 어종 선택 기능 구현 후 동적으로 변경해야 함
const CURRENT_FISH_TYPE: FishType = "betta";

// 기본 센서 데이터
const DEFAULT_SENSOR_DATA: SensorData = {
  tds: 50,
  temp: 25,
  ph: 7.0,
  fishType: CURRENT_FISH_TYPE,
};

// 1분 (밀리초)
const ONE_MINUTE = 60 * 1000;

/**
 * 센서 데이터를 HTTP로 가져오는 훅
 * @returns [sensorData, isLoading, error, refetch]
 */
export function useSensorData(): [
  SensorData,
  boolean,
  string | null,
  () => void
] {
  const [sensorData, setSensorData] = useState<SensorData>(DEFAULT_SENSOR_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const toNumberOrUndefined = useCallback((value: unknown): number | undefined => {
    const parsed = typeof value === "string" ? Number(value) : value;
    return typeof parsed === "number" && !Number.isNaN(parsed) ? parsed : undefined;
  }, []);

  const fetchSensorData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 라즈베리파이 FastAPI 서버에서 센서 데이터 가져오기
      const response = await axios.get(`${API_BASE_URL}/api/sensors`, {
        timeout: 5000, // 5초 타임아웃
      });

      const data = response.data;

      // 센서 데이터 상태 변환
      setSensorData({
        tds: toNumberOrUndefined(data.tds) ?? 0,
        temp: toNumberOrUndefined(data.temp) ?? 0,
        ph: toNumberOrUndefined(data.ph) ?? 7.0,
        fishType: CURRENT_FISH_TYPE,
      });

      setIsLoading(false);
    } catch (err) {
      console.error("센서 데이터 로드 실패:", err);

      // 네트워크 오류 시 시뮬레이션 데이터 사용 (개발용)
      console.log("시뮬레이션 모드로 전환");

      // 시뮬레이션용 랜덤 데이터 생성
      const simTemp = 18 + Math.random() * 15; // 18 ~ 33
      const simPh = 5.5 + Math.random() * 3; // 5.5 ~ 8.5
      const simTds = 30 + Math.random() * 450; // 30 ~ 480
      setSensorData({
        tds: Math.floor(simTds),
        temp: parseFloat(simTemp.toFixed(1)),
        ph: parseFloat(simPh.toFixed(1)),
        fishType: CURRENT_FISH_TYPE,
      });

      setError("라즈베리파이 연결 실패 (시뮬레이션 모드)");
      setIsLoading(false);
    }
  }, [toNumberOrUndefined]);

  useEffect(() => {
    // 초기 데이터 로드
    fetchSensorData();

    // 1분마다 데이터 업데이트
    const interval = setInterval(fetchSensorData, ONE_MINUTE);

    return () => clearInterval(interval);
  }, [fetchSensorData]);

  return [sensorData, isLoading, error, fetchSensorData];
}

/**
 * 먹이 주기 명령 전송 (수동)
 */
export async function feedFish(): Promise<boolean> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/feed`,
      {},
      {
        timeout: 5000,
      }
    );

    console.log("먹이 주기 명령 전송 성공:", response.data);
    return response.status === 200;
  } catch (err) {
    console.error("먹이 주기 실패:", err);
    return false;
  }
}

/**
 * 자동 먹이 주기 실행
 * @param shouldExecute - true: 실제 급여, false: 급여 중단 (기록만)
 */
export async function executeAutoFeed(shouldExecute: boolean): Promise<boolean> {
  if (!shouldExecute) {
    // 급여 중단 시에는 API 호출 없이 기록만
    console.log("자동급여 중단 (센서값 비정상)");
    return true;
  }

  // 실제 급여 실행
  return await feedFish();
}
