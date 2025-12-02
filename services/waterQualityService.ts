// services/waterQualityService.ts
// 센서 변환/보정 및 수질 상태 평가 유틸리티 (논문 근거)

import { FishType } from "../types";
import { ADULT_ENV_BANDS } from "./fishEnvPresets";

export interface CalibrationParams {
  slope: number;
  intercept: number;
}

export type WaterStatus = "happy" | "worry" | "angry";

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
  const band = ADULT_ENV_BANDS[fishType];

  // 한계 밖이면 바로 angry
  const caution = band.caution;
  const outsideLimit =
    temp < band.temp.survival.min ||
    temp > band.temp.survival.max ||
    ph < band.ph.survival.min ||
    ph > band.ph.survival.max ||
    (band.tds ? tds > band.tds.survivalMax : false) ||
    (caution?.holdTempBelow !== undefined && temp < caution.holdTempBelow);

  if (outsideLimit) return "angry";

  const outsidePreferred =
    temp < band.temp.preferred.min ||
    temp > band.temp.preferred.max ||
    ph < band.ph.preferred.min ||
    ph > band.ph.preferred.max ||
    (band.tds ? tds > band.tds.preferredMax : false);

  // 어종 특이 주의 조건 반영 (공유 프리셋에서 가져옴)
  const specialWorry =
    (caution?.worryPhAbove !== undefined && ph > caution.worryPhAbove) ||
    (caution?.worryTdsAbove !== undefined && tds > caution.worryTdsAbove);

  return outsidePreferred || specialWorry ? "worry" : "happy";
}
