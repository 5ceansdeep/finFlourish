// services/waterQualityService.ts
// 센서 변환/보정 및 수질 상태 평가 유틸리티 (논문 근거)

import { FishType } from "../types";

export interface CalibrationParams {
  slope: number;
  intercept: number;
}

export type WaterStatus = "happy" | "worry" | "angry";

interface PreferredBand {
  temp: { preferred: { min: number; max: number }; limit: { min: number; max: number } };
  ph: { preferred: { min: number; max: number }; limit: { min: number; max: number } };
  tds?: { preferredMax: number; limitMax: number };
}

const SPECIES_PRESETS: Record<FishType, PreferredBand> = {
  betta: {
    temp: { preferred: { min: 25, max: 30 }, limit: { min: 15, max: 33 } },
    ph: { preferred: { min: 5.5, max: 7.0 }, limit: { min: 5.0, max: 9.0 } },
    tds: { preferredMax: 1000, limitMax: 6000 },
  },
  goldfish: {
    temp: { preferred: { min: 10, max: 30 }, limit: { min: 0, max: 41 } },
    ph: { preferred: { min: 5.5, max: 7.0 }, limit: { min: 4.5, max: 10.5 } },
    tds: { preferredMax: 8000, limitMax: 20000 },
  },
  guppy: {
    temp: { preferred: { min: 18, max: 28 }, limit: { min: 15, max: 41 } },
    ph: { preferred: { min: 6.5, max: 7.5 }, limit: { min: 5.0, max: 9.0 } },
    tds: { preferredMax: 10000, limitMax: 45000 },
  },
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
 * 어종별 온도/pH/TDS 허용 구간에 따라 상태를 평가합니다.
 * - happy: 어종별 권장(Preferred) 구간 충족
 * - worry: 권장 구간은 벗어나지만 한계(Limit) 내, 혹은 어종 특이 스트레스 조건(pH>8.5 구피 등)
 * - angry: 한계 구간 밖 (급격한 스트레스)
 */
export function evaluateWaterStatus(
  readings: { temp: number; ph: number; tds: number; fishType: FishType }
): WaterStatus {
  const { temp, ph, tds, fishType } = readings;
  const preset = SPECIES_PRESETS[fishType];

  // 한계 밖이면 바로 angry
  const outsideLimit =
    temp < preset.temp.limit.min ||
    temp > preset.temp.limit.max ||
    ph < preset.ph.limit.min ||
    ph > preset.ph.limit.max ||
    (preset.tds ? tds > preset.tds.limitMax : false) ||
    (fishType === "betta" && temp < 20);

  if (outsideLimit) return "angry";

  const outsidePreferred =
    temp < preset.temp.preferred.min ||
    temp > preset.temp.preferred.max ||
    ph < preset.ph.preferred.min ||
    ph > preset.ph.preferred.max ||
    (preset.tds ? tds > preset.tds.preferredMax : false);

  // 어종 특이 주의 조건 반영
  const specialWorry =
    (fishType === "guppy" && ph > 8.5) ||
    (fishType === "goldfish" && preset.tds ? tds > 15000 : false);

  return outsidePreferred || specialWorry ? "worry" : "happy";
}
