// services/sensorService.ts

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { SensorData, FishType } from "../types";
import { getFishLogic } from "./fishLogic";

// 라즈베리파이 API 주소
const API_BASE_URL = "http://172.20.10.2:8000";

// TODO: 어종 선택 기능 구현 후 동적으로 변경해야 함
const CURRENT_FISH_TYPE: FishType = "betta";

// 기본 센서 데이터
const DEFAULT_SENSOR_DATA: SensorData = {
  tds: 50,
  temp: 25,
  ph: 7.0,
  status: "happy",
  fishType: CURRENT_FISH_TYPE,
};

// 1분 (밀리초)
const ONE_M = 60 * 1000;

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
  const [sensorData, setSensorData] =
    useState<SensorData>(DEFAULT_SENSOR_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 현재 어종에 맞는 로직 가져오기
  const fishLogic = getFishLogic(CURRENT_FISH_TYPE);

  const fetchSensorData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 라즈베리파이 FastAPI 서버에서 센서 데이터 가져오기
      const response = await axios.get(`${API_BASE_URL}/api/sensors`, {
        timeout: 5000, // 5초 타임아웃
      });

      const data = response.data;
      const status = fishLogic.calculateStatus(data.temp, data.ph, data.tds);

      // 센서 데이터 상태 변환
      setSensorData({
        tds: data.tds || 0,
        temp: data.temp || 0,
        ph: data.ph || 7.0,
        status: status,
        fishType: CURRENT_FISH_TYPE,
      });

      setIsLoading(false);
    } catch (err) {
      console.error("센서 데이터 로드 실패:", err);

      // 네트워크 오류 시 시뮬레이션 데이터 사용 (개발용)
      console.log("시뮬레이션 모드로 전환");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 시뮬레이션용 랜덤 데이터 생성
      const simTemp = 18 + Math.random() * 15; // 18 ~ 33
      const simPh = 5.5 + Math.random() * 3; // 5.5 ~ 8.5
      const simTds = 30 + Math.random() * 450; // 30 ~ 480

      const simStatus = fishLogic.calculateStatus(simTemp, simPh, simTds);

      setSensorData({
        tds: Math.floor(simTds),
        temp: parseFloat(simTemp.toFixed(1)),
        ph: parseFloat(simPh.toFixed(1)),
        status: simStatus,
        fishType: CURRENT_FISH_TYPE,
      });

      setError("라즈베리파이 연결 실패 (시뮬레이션 모드)");
      setIsLoading(false);
    }
  }, [fishLogic]);

  useEffect(() => {
    // 초기 데이터 로드
    fetchSensorData();

    // 1시간마다 데이터 업데이트
    const interval = setInterval(fetchSensorData, ONE_M);

    return () => clearInterval(interval);
  }, [fetchSensorData]);

  return [sensorData, isLoading, error, fetchSensorData];
}

/**
 * 먹이 주기 명령 전송
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
