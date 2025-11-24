// services/sensorService.ts

import { useState, useEffect, useCallback } from 'react';
import { SensorData, FishStatus } from '../types';

// 라즈베리파이 API 주소 (실제 주소로 변경 필요)
const API_BASE_URL = 'http://192.168.0.1:5000';

// 기본 센서 데이터
const DEFAULT_SENSOR_DATA: SensorData = {
  tds: 50,
  temp: 25,
  ph: 7.0,
  status: 'happy',
};

// 1시간 (밀리초)
const ONE_HOUR = 60 * 60 * 1000;

/**
 * 센서 데이터를 HTTP로 가져오는 훅
 * @returns [sensorData, isLoading, error, refetch]
 */
export function useSensorData(): [SensorData, boolean, string | null, () => void] {
  const [sensorData, setSensorData] = useState<SensorData>(DEFAULT_SENSOR_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSensorData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: 실제 라즈베리파이 API 연동 시 아래 주석 해제
      // const response = await fetch(`${API_BASE_URL}/api/sensors`);
      // if (!response.ok) throw new Error('서버 응답 오류');
      // const data = await response.json();
      // setSensorData(data);

      // 시뮬레이션 데이터 (개발용)
      await new Promise(resolve => setTimeout(resolve, 1000)); // 네트워크 지연 시뮬레이션

      const statuses: FishStatus[] = ['happy', 'worry', 'angry'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      setSensorData({
        tds: Math.floor(Math.random() * 100),
        temp: 20 + Math.floor(Math.random() * 10),
        ph: parseFloat((6.5 + Math.random() * 2).toFixed(1)),
        status: randomStatus,
      });

      setIsLoading(false);
    } catch (err) {
      console.error('센서 데이터 로드 실패:', err);
      setError(err instanceof Error ? err.message : '데이터 로드 실패');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 초기 데이터 로드
    fetchSensorData();

    // 1시간마다 데이터 업데이트
    const interval = setInterval(fetchSensorData, ONE_HOUR);

    return () => clearInterval(interval);
  }, [fetchSensorData]);

  return [sensorData, isLoading, error, fetchSensorData];
}

/**
 * 먹이 주기 명령 전송
 */
export async function feedFish(): Promise<boolean> {
  try {
    // TODO: 실제 API 연동
    // const response = await fetch(`${API_BASE_URL}/api/feed`, { method: 'POST' });
    // return response.ok;

    console.log('먹이 주기 명령 전송');
    return true;
  } catch (err) {
    console.error('먹이 주기 실패:', err);
    return false;
  }
}
