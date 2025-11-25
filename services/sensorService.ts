// services/sensorService.ts

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { SensorData, FishStatus } from '../types';

// 라즈베리파이 API 주소 (실제 주소로 변경 필요)
// 예: 'http://192.168.0.42:8000' (라즈베리파이 IP:포트)
const API_BASE_URL = 'http://192.168.0.1:8000';

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
      // 라즈베리파이 FastAPI 서버에서 센서 데이터 가져오기
      const response = await axios.get(`${API_BASE_URL}/api/sensors`, {
        timeout: 5000, // 5초 타임아웃
      });

      const data = response.data;

      // 센서 데이터 상태 변환
      setSensorData({
        tds: data.tds || 0,
        temp: data.temp || 0,
        ph: data.ph || 7.0,
        status: data.status || 'happy',
      });

      setIsLoading(false);
    } catch (err) {
      console.error('센서 데이터 로드 실패:', err);

      // 네트워크 오류 시 시뮬레이션 데이터 사용 (개발용)
      console.log('시뮬레이션 모드로 전환');
      await new Promise(resolve => setTimeout(resolve, 500));

      const statuses: FishStatus[] = ['happy', 'worry', 'angry'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      setSensorData({
        tds: Math.floor(Math.random() * 100),
        temp: 20 + Math.floor(Math.random() * 10),
        ph: parseFloat((6.5 + Math.random() * 2).toFixed(1)),
        status: randomStatus,
      });

      setError('라즈베리파이 연결 실패 (시뮬레이션 모드)');
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
    const response = await axios.post(`${API_BASE_URL}/api/feed`, {}, {
      timeout: 5000,
    });

    console.log('먹이 주기 명령 전송 성공:', response.data);
    return response.status === 200;
  } catch (err) {
    console.error('먹이 주기 실패:', err);
    return false;
  }
}
