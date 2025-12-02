// services/autoFeedingService.ts
// 논문 기반 자동급여 로직 - 생물량, 온도, pH 중심

import { FishType, LifeStage, SensorData } from "../types";
import { ENV_BANDS } from "./fishEnvPresets";

// 급여 모드 타입
export type FeedingMode = "NORMAL" | "REDUCED" | "HOLD";

// 급여 입력 파라미터
export interface FeedingInput {
  species: FishType;
  lifeStage: LifeStage;
  n_fish: number; // 개체수
  w_mean: number; // 개체당 평균 체중(g)
  v_tank: number; // 수조 용량(L)
  sensorData: SensorData;
  stressEvent?: boolean; // 스트레스 이벤트 (이동, 질병, 대규모 환수 등)
  isNightTime?: boolean; // 야간 여부
}

// 급여 결정 결과
export interface FeedingDecision {
  mode: FeedingMode;
  dailyFeed_g: number; // 하루 총 급여량 (g)
  feedPerTime_g: number; // 회당 급여량 (g)
  timesPerDay: number; // 급여 횟수
  feedPercent: number; // 체중 대비 급여율 (%BW/day)
  recommendation: string; // 사용자 안내 메시지
  details: string; // 상세 설명
}

// === 2. 기본 급여율 (%BW/day) ===
interface FeedRange {
  min: number;
  max: number;
}

const NORMAL_FEED: Record<string, FeedRange> = {
  betta_juvenile: { min: 5, max: 10 },
  betta_adult: { min: 1, max: 2 },
  goldfish_juvenile: { min: 2, max: 3 },
  goldfish_adult: { min: 1.5, max: 2 },
  guppy_juvenile: { min: 5, max: 10 },
  guppy_adult: { min: 2, max: 3 },
};

// === 3. 급여 횟수 (회/일) ===
const FEEDING_FREQUENCY: Record<string, number> = {
  betta_juvenile: 4,
  betta_adult: 2,
  goldfish_juvenile: 3,
  goldfish_adult: 2,
  guppy_juvenile: 4,
  guppy_adult: 2,
};

// === 5. 급여 모드 판정 로직 ===
export function determineFeedingMode(
  input: FeedingInput
): FeedingMode {
  const { species, lifeStage, sensorData, stressEvent } = input;
  const { temp, ph, tds } = sensorData;

  const speciesKey = `${species}_${lifeStage}` as const;
  const env = ENV_BANDS[speciesKey];

  // 1) HOLD - 즉시 금식 필요
  // 스트레스 이벤트
  if (stressEvent === true) {
    return "HOLD";
  }

  // 온도/피에이치/염분이 생존 한계를 벗어날 때 금식
  if (species === "betta" && env.caution?.holdTempBelow !== undefined && temp < env.caution.holdTempBelow) {
    return "HOLD"; // 20°C 미만은 논문에서 급격한 생존률 저하
  }

  if (temp < env.temp.survival.min || temp > env.temp.survival.max) {
    return "HOLD";
  }
  if (ph < env.ph.survival.min || ph > env.ph.survival.max) {
    return "HOLD";
  }
  if (env.tds && tds > env.tds.survivalMax) {
    return "HOLD";
  }

  // 2) REDUCED - 감량 모드
  // 온도 경계 (최적범위 벗어남)
  if (temp < env.temp.preferred.min || temp > env.temp.preferred.max) {
    return "REDUCED";
  }

  // pH 경계
  if (sensorData.ph < env.ph.preferred.min || sensorData.ph > env.ph.preferred.max) {
    return "REDUCED";
  }

  // 구피 pH 8.5 초과, 금붕어 고염(>15,000ppm) 같은 특이 스트레스 구간
  if (species === "guppy" && env.caution?.worryPhAbove !== undefined && sensorData.ph > env.caution.worryPhAbove) {
    return "REDUCED";
  }

  if (species === "goldfish" && env.caution?.worryTdsAbove !== undefined && sensorData.tds > env.caution.worryTdsAbove) {
    return "REDUCED";
  }

  if (env.tds && sensorData.tds > env.tds.preferredMax) {
    return "REDUCED";
  }

  // pH가 하한선 근처면 급여량을 줄여 일일 pH 하락폭을 억제 (Daud 2020)
  if (sensorData.ph < env.ph.preferred.min + 0.2) {
    return "REDUCED";
  }

  // 3) NORMAL - 최적 환경
  return "NORMAL";
}

// === 6. 생애 단계별 체중 보정 ===
function weightFactor(w_mean: number, species: FishType, _lifeStage: LifeStage): number {
  // 종별 기준 체중 (g) - 대략적인 값
  const W_REF: Record<string, { juvenile: number; adult: number }> = {
    betta: { juvenile: 0.5, adult: 3 },
    goldfish: { juvenile: 5, adult: 50 },
    guppy: { juvenile: 0.2, adult: 1 },
  };

  const ref = W_REF[species];

  if (w_mean < ref.juvenile) {
    return 1.1; // 매우 어린 개체 - 10% 상향
  }

  if (w_mean >= ref.juvenile && w_mean <= ref.adult) {
    return 1.0; // 기준 그대로
  }

  if (w_mean > ref.adult) {
    return 0.8; // 큰 성어 - 20% 감량
  }

  return 1.0;
}

// === 7. 생물량 밀도 보정 ===
function densityFactor(density: number): number {
  // density = W_total / V_tank (g/L)

  if (density < 0.2) {
    return 1.0; // 저밀도
  }

  if (density >= 0.2 && density < 0.5) {
    return 0.9; // 약간 감량
  }

  if (density >= 0.5 && density < 1.0) {
    return 0.8; // 중간~고밀도
  }

  if (density >= 1.0) {
    return 0.6; // 매우 고밀도 - 40% 감량
  }

  return 1.0;
}

// === 8. 모드별 전역 감량 계수 ===
function modeFactor(mode: FeedingMode): number {
  switch (mode) {
    case "NORMAL":
      return 1.0;
    case "REDUCED":
      return 0.5; // 50% 감량
    case "HOLD":
      return 0.0; // 금식
  }
}

// === 9. 기본 급여율 가져오기 ===
function getBaseFeedPercent(species: FishType, lifeStage: LifeStage): number {
  const key = `${species}_${lifeStage}`;
  const range = NORMAL_FEED[key];
  return (range.min + range.max) / 2; // 평균값 사용
}

// === 10. 급여 횟수 가져오기 ===
function getFeedingFrequency(species: FishType, lifeStage: LifeStage, mode: FeedingMode): number {
  if (mode === "HOLD") return 0;

  const key = `${species}_${lifeStage}`;
  const normalFreq = FEEDING_FREQUENCY[key];

  // REDUCED 모드에서는 횟수도 줄임
  if (mode === "REDUCED") {
    return Math.max(1, Math.floor(normalFreq / 2));
  }

  return normalFreq;
}

// === 11. 최종 급여량 계산 ===
export function computeDailyFeed(input: FeedingInput): FeedingDecision {
  const { species, lifeStage, n_fish, w_mean, v_tank, sensorData, isNightTime } = input;

  const w_total = n_fish * w_mean; // 총 생물량 (g)
  const density = w_total / v_tank; // 밀도 (g/L)

  // 1. 모드 판정
  const mode = determineFeedingMode(input);

  // 2. 각 보정 계수 계산
  const basePercent = getBaseFeedPercent(species, lifeStage);
  const wFactor = weightFactor(w_mean, species, lifeStage);
  const dFactor = densityFactor(density);
  const mFactor = modeFactor(mode);

  // 3. 최종 급여율 계산
  let finalPercent = basePercent * wFactor * dFactor * mFactor;

  // 4. 금붕어 특수 보정
  if (species === "goldfish") {
    // 고온 보정
    if (sensorData.temp >= 28) {
      finalPercent *= 0.7; // 30% 추가 감량
    }

    // 야간 보정
    if (isNightTime === true) {
      finalPercent *= 0.3; // 야간 70% 감량
    }
  }

  // 5. 하루 총 급여량 (g)
  const dailyFeed_g = w_total * (finalPercent / 100.0);

  // 6. 급여 횟수
  const timesPerDay = getFeedingFrequency(species, lifeStage, mode);

  // 7. 회당 급여량
  const feedPerTime_g = timesPerDay > 0 ? dailyFeed_g / timesPerDay : 0;

  // 8. 사용자 안내 메시지 생성
  const recommendation = generateRecommendation(mode, species, lifeStage, sensorData);
  const details = generateDetails(input, mode, finalPercent, density);

  return {
    mode,
    dailyFeed_g,
    feedPerTime_g,
    timesPerDay,
    feedPercent: finalPercent,
    recommendation,
    details,
  };
}

// === 12. 사용자 안내 메시지 생성 ===
function generateRecommendation(
  mode: FeedingMode,
  species: FishType,
  lifeStage: LifeStage,
  sensorData: SensorData
): string {
  if (mode === "NORMAL") {
    return "✅ 최적 환경입니다. 정상 급여하세요.";
  }

  if (mode === "REDUCED") {
    const reasons = [];
    const env = ENV_BANDS[`${species}_${lifeStage}` as const];

    if (sensorData.temp < env.temp.preferred.min || sensorData.temp > env.temp.preferred.max) {
      reasons.push("온도 경계");
    }
    if (sensorData.ph < env.ph.preferred.min || sensorData.ph > env.ph.preferred.max) {
      reasons.push("pH 경계");
    }
    if (env.tds && sensorData.tds > env.tds.preferredMax) {
      reasons.push("염도/TDS 높음");
    }

    const reasonText = reasons.length > 0 ? ` (${reasons.join(", ")})` : "";
    return `⚠️ 수질 주의 구간입니다${reasonText}. 급여량 50% 감량하세요.`;
  }

  // HOLD
  const holdReasons: Record<FishType, string> = {
    betta: "수질 악화로 급여 중단",
    goldfish: "고온/수질 악화로 급여 중단",
    guppy: "수질 위험으로 급여 중단",
  };

  return `🚨 ${holdReasons[species]}`;
}

// === 13. 상세 정보 생성 ===
function generateDetails(
  input: FeedingInput,
  mode: FeedingMode,
  finalPercent: number,
  density: number
): string {
  const { species, lifeStage, n_fish, w_mean, sensorData } = input;
  const w_total = n_fish * w_mean;

  const speciesName = species === "betta" ? "베타" : species === "goldfish" ? "금붕어" : "구피";
  const stageName = lifeStage === "juvenile" ? "치어" : "성어";

  const lines = [
    `어종: ${speciesName} (${stageName})`,
    `개체수: ${n_fish}마리, 평균체중: ${w_mean.toFixed(1)}g`,
    `총 생물량: ${w_total.toFixed(1)}g, 밀도: ${density.toFixed(2)}g/L`,
    `급여율: ${finalPercent.toFixed(2)}% BW/day`,
    `모드: ${mode}`,
  ];

  return lines.join("\n");
}

// === 14. 간단한 컨트롤러 함수 (기존 호환성 유지) ===
export function autoFeedingController(
  fishType: FishType,
  sensorData: SensorData
): { mode: FeedingMode; recommendation: string } {
  // 기본값으로 간단하게 계산 (생물량 정보 없을 때)
  const input: FeedingInput = {
    species: fishType,
    lifeStage: "adult",
    n_fish: 1,
    w_mean: 3, // 기본 성어 체중
    v_tank: 10, // 기본 10L
    sensorData,
    stressEvent: false,
    isNightTime: false,
  };

  const decision = computeDailyFeed(input);

  return {
    mode: decision.mode,
    recommendation: decision.recommendation,
  };
}
