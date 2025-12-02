// services/waterQualityService.ts
// 센서 변환/보정 및 수질 상태 평가 유틸리티 (논문 근거)

export interface CalibrationParams {
  slope: number;
  intercept: number;
}

export interface SamsPreset {
  temp: { min: number; max: number };
  ph: { min: number; max: number };
}

export type WaterStatus = "happy" | "worry" | "angry";

// SAMS(2024) 안정 구간 기본 프리셋 (온도, pH만 사용)
export const DEFAULT_SAMS_PRESET: SamsPreset = {
  temp: { min: 23, max: 26 },
  ph: { min: 7.4, max: 7.7 },
};

/**
 * 직선 보정 파라미터(m, b)를 이용해 센서 원시값을 보정합니다. (Palconit 2021)
 * Sr = m * Rc + b  →  Sa = (Sr - b) / m
 */
export function calibrateSensorReading(raw: number, params: CalibrationParams): number {
  if (params.slope === 0) {
    throw new Error("Calibration slope cannot be zero");
  }
  return (raw - params.intercept) / params.slope;
}

/**
 * RMSE를 계산해 보정 품질을 평가합니다. (Palconit 2021)
 * @param referenceValues 기준값 배열
 * @param adjustedValues 보정된 센서값 배열
 */
export function calculateRmse(referenceValues: number[], adjustedValues: number[]): number {
  if (referenceValues.length !== adjustedValues.length) {
    throw new Error("Reference and adjusted arrays must have the same length");
  }
  if (referenceValues.length === 0) return 0;

  const mse = referenceValues.reduce((acc, ref, idx) => {
    const diff = ref - adjustedValues[idx];
    return acc + diff * diff;
  }, 0) / referenceValues.length;

  return Math.sqrt(mse);
}

/**
 * SAMS(2024) 안정 구간을 기반으로 수질 상태를 평가합니다.
 * - happy: SAMS 구간을 모두 만족
 * - worry: SAMS 구간을 살짝 벗어나지만 논문 제시 최적 범위(온도 24~28°C, pH 6.5~7.8, 탁도 < 12 NTU) 안에 있음
 * - angry: 그 외의 경우
 */
export function evaluateWaterStatus(
  readings: { temp: number; ph: number },
  preset: SamsPreset = DEFAULT_SAMS_PRESET
): WaterStatus {
  const { temp, ph } = readings;
  const withinPreset =
    temp >= preset.temp.min &&
    temp <= preset.temp.max &&
    ph >= preset.ph.min &&
    ph <= preset.ph.max;

  if (withinPreset) return "happy";

  const withinOptimalBand =
    temp >= 24 &&
    temp <= 28 &&
    ph >= 6.5 &&
    ph <= 7.8;

  return withinOptimalBand ? "worry" : "angry";
}
