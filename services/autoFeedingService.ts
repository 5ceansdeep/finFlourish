// services/autoFeedingService.ts
// 논문 기반 자동급여 로직 - 생물량, DO, 암모니아 고려

import { FishType, LifeStage } from "../types";

// 급여 모드 타입
export type FeedingMode = "NORMAL" | "REDUCED" | "HOLD";

// 확장된 센서 데이터 타입
export interface ExtendedSensorData {
  temp: number;
  ph: number;
  tds: number;
  do?: number; // 용존산소 (mg/L)
  tan?: number; // 총 암모니아질소 (mg/L as N)
  nh3?: number; // 유리 암모니아 (mg/L as NH3)
}

// 급여 입력 파라미터
export interface FeedingInput {
  species: FishType;
  lifeStage: LifeStage;
  n_fish: number; // 개체수
  w_mean: number; // 개체당 평균 체중(g)
  v_tank: number; // 수조 용량(L)
  sensorData: ExtendedSensorData;
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

// === 1. 최적 환경창 정의 ===
interface OptimalEnv {
  temp: { min: number; max: number };
  do: number; // 최소 DO (mg/L)
  ph: { min: number; max: number };
}

const OPTIMAL_ENV: Record<string, OptimalEnv> = {
  betta_juvenile: { temp: { min: 26, max: 30 }, do: 5, ph: { min: 6.5, max: 7.5 } },
  betta_adult: { temp: { min: 24, max: 30 }, do: 5, ph: { min: 6.0, max: 7.5 } },
  goldfish_juvenile: { temp: { min: 20, max: 26 }, do: 6, ph: { min: 6.5, max: 8.0 } },
  goldfish_adult: { temp: { min: 18, max: 26 }, do: 5, ph: { min: 6.5, max: 8.0 } },
  guppy_juvenile: { temp: { min: 24, max: 28 }, do: 5, ph: { min: 6.5, max: 7.5 } },
  guppy_adult: { temp: { min: 22, max: 28 }, do: 5, ph: { min: 6.5, max: 7.5 } },
};

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

// === 4. 암모니아 임계값 ===
const AMMONIA_THRESHOLDS = {
  TAN_TARGET: 0.5,
  TAN_WARNING: 1.0,
  NH3_TARGET: 0.02,
  NH3_WARNING: 0.05,
};

/**
 * 총 암모니아 질소(TAN), 온도, pH를 기반으로 유리 암모니아(NH3) 농도를 계산합니다.
 * @param tan 총 암모니아 질소 (mg/L as N)
 * @param temp 온도 (°C)
 * @param ph pH 값
 * @returns 유리 암모니아 농도 (mg/L as NH3)
 */
export function calculateFreeAmmonia(tan: number, temp: number, ph: number): number {
  // pKa = 0.09018 + 2729.92 / (T + 273.15), T는 섭씨 온도
  const pKa = 0.09018 + 2729.92 / (temp + 273.15);
  // NH3 분율 = 1 / (1 + 10^(pKa - pH))
  const fraction = 1 / (1 + Math.pow(10, pKa - ph));
  // NH3 농도 = TAN * NH3 분율
  return tan * fraction;
}

// === 5. 급여 모드 판정 로직 ===
export function determineFeedingMode(
  input: FeedingInput
): FeedingMode {
  const { species, lifeStage, sensorData, stressEvent } = input;
  const { temp, ph, do: doValue, tan } = sensorData;

  const speciesKey = `${species}_${lifeStage}`;
  const optimal = OPTIMAL_ENV[speciesKey];

  // DO가 없으면 기본값 사용 (안전하게 NORMAL 가정)
  const currentDO = doValue ?? 6;
  const currentTAN = tan ?? 0;
  // NH3가 없으면 TAN, 온도, pH로 계산
  const currentNH3 = sensorData.nh3 ?? (tan !== undefined ? calculateFreeAmmonia(tan, temp, ph) : 0);

  // 1) HOLD - 즉시 금식 필요
  // 스트레스 이벤트
  if (stressEvent === true) {
    return "HOLD";
  }

  // 암모니아 위험
  if (currentNH3 > AMMONIA_THRESHOLDS.NH3_WARNING ||
      currentTAN > AMMONIA_THRESHOLDS.TAN_WARNING) {
    return "HOLD";
  }

  // DO 위험 (베타 성어는 라비린스로 DO 3까지 버팀)
  if (species === "betta" && lifeStage === "adult") {
    if (currentDO < 3) return "HOLD";
  } else {
    if (currentDO < 4) return "HOLD";
  }

  // 2) REDUCED - 감량 모드
  // DO 경계
  if (currentDO < optimal.do) {
    return "REDUCED";
  }

  // 암모니아 경계
  if (currentNH3 >= AMMONIA_THRESHOLDS.NH3_TARGET ||
      currentTAN >= AMMONIA_THRESHOLDS.TAN_TARGET) {
    return "REDUCED";
  }

  // 온도 경계 (최적범위 벗어남)
  if (temp < optimal.temp.min || temp > optimal.temp.max) {
    return "REDUCED";
  }

  // pH 경계
  if (sensorData.ph < optimal.ph.min || sensorData.ph > optimal.ph.max) {
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
  const recommendation = generateRecommendation(mode, species, sensorData);
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
  sensorData: ExtendedSensorData
): string {
  if (mode === "NORMAL") {
    return "✅ 최적 환경입니다. 정상 급여하세요.";
  }

  if (mode === "REDUCED") {
    const reasons = [];

    if (sensorData.do !== undefined && sensorData.do < 5) {
      reasons.push("DO 낮음");
    }
    if (sensorData.tan !== undefined && sensorData.tan >= 0.5) {
      reasons.push("암모니아 주의");
    }
    if (sensorData.temp < 20 || sensorData.temp > 28) {
      reasons.push("온도 경계");
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

  if (sensorData.do !== undefined) {
    lines.push(`DO: ${sensorData.do.toFixed(1)} mg/L`);
  }
  if (sensorData.tan !== undefined) {
    lines.push(`TAN: ${sensorData.tan.toFixed(2)} mg/L`);
  }

  return lines.join("\n");
}

// === 14. 간단한 컨트롤러 함수 (기존 호환성 유지) ===
export function autoFeedingController(
  fishType: FishType,
  sensorData: ExtendedSensorData
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
