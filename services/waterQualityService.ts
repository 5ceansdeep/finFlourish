// services/waterQualityService.ts
// 센서 변환/보정 및 수질 상태 평가 유틸리티 (논문 근거)

import { FishType } from "../types";
import { SPECIES_ENV_PRESETS } from "./fishEnvPresets";

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

const getPreferredBand = (fishType: FishType) => {
  const preset = SPECIES_ENV_PRESETS[fishType];
  return {
    temp: { preferred: preset.preferred.temp, limit: preset.survival.temp },
    ph: { preferred: preset.preferred.ph, limit: preset.survival.ph },
    tds: preset.preferred.tdsMax && preset.survival.tdsMax
      ? { preferredMax: preset.preferred.tdsMax, limitMax: preset.survival.tdsMax }
      : undefined,
  };
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
  const preset = getPreferredBand(fishType);

  // 한계 밖이면 바로 angry
  const caution = SPECIES_ENV_PRESETS[fishType].caution;
  const outsideLimit =
    temp < preset.temp.limit.min ||
    temp > preset.temp.limit.max ||
    ph < preset.ph.limit.min ||
    ph > preset.ph.limit.max ||
    (preset.tds ? tds > preset.tds.limitMax : false) ||
    (caution?.holdTempBelow !== undefined && temp < caution.holdTempBelow);

  if (outsideLimit) return "angry";

  const outsidePreferred =
    temp < preset.temp.preferred.min ||
    temp > preset.temp.preferred.max ||
    ph < preset.ph.preferred.min ||
    ph > preset.ph.preferred.max ||
    (preset.tds ? tds > preset.tds.preferredMax : false);

  // 어종 특이 주의 조건 반영 (공유 프리셋에서 가져옴)
  const specialWorry =
    (caution?.worryPhAbove !== undefined && ph > caution.worryPhAbove) ||
    (caution?.worryTdsAbove !== undefined && tds > caution.worryTdsAbove);

  return outsidePreferred || specialWorry ? "worry" : "happy";
}

/**
 * SAMS(2024) 안정 구간을 기반으로 수질 상태를 평가합니다. (간단한 버전)
 * - happy: SAMS 구간을 모두 만족
 * - worry: SAMS 구간을 살짝 벗어나지만 논문 제시 최적 범위(온도 24~28°C, pH 6.5~7.8, 탁도 < 12 NTU) 안에 있음
 * - angry: 그 외의 경우
 */
export function evaluateWaterStatusSimple(
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