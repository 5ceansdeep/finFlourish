// services/autoFeedingService.ts
// 논문 기반 자동급여 로직

import { FishType, FishStatus } from "../types";

// 급여 모드 타입
export type FeedingMode = "NORMAL" | "REDUCED" | "HOLD";

// 센서 데이터 타입 (확장)
export interface ExtendedSensorData {
  temp: number;
  ph: number;
  tds: number;
  status: FishStatus;
}

// 급여 결정 결과
export interface FeedingDecision {
  mode: FeedingMode;
  frequency: string;
  amount: string;
  notice: string;
  recommendation: string;
}

// 어종별 최적 환경 기준
const OPTIMAL_ENV = {
  betta: {
    temp: { min: 24, max: 28 },
    ph: { min: 6.5, max: 7.5 },
    tds: { min: 50, max: 200 },
  },
  goldfish: {
    temp: { min: 18, max: 24 },
    ph: { min: 7.0, max: 8.0 },
    tds: { min: 150, max: 400 },
  },
  guppy: {
    temp: { min: 24, max: 26 },
    ph: { min: 7.2, max: 8.2 },
    tds: { min: 300, max: 600 },
  },
};

// 어종별 정상 급여 기준 (성어 기준)
const NORMAL_FEED = {
  betta: {
    frequency: "하루 2회",
    amount: "소량 (3-5알)",
    notice: "고단백 사료 권장",
  },
  goldfish: {
    frequency: "하루 1-2회",
    amount: "1분 내 섭취량",
    notice: "침강성 소화 사료",
  },
  guppy: {
    frequency: "하루 2-3회",
    amount: "소량 (1분 섭취량)",
    notice: "치어는 고빈도 소량",
  },
};

/**
 * 급여 모드 판정 로직
 * HOLD → REDUCED → NORMAL 순서로 체크
 */
export function determineFeedingMode(
  fishType: FishType,
  sensorData: ExtendedSensorData
): FeedingMode {
  const { temp, ph, tds, status } = sensorData;
  const optimal = OPTIMAL_ENV[fishType];

  // 1) HOLD - 즉시 금식 필요 (Angry 상태)
  if (status === "angry") {
    return "HOLD";
  }

  // 2) REDUCED - 감량 모드 (Worry 상태 또는 환경 경계 구간)
  if (status === "worry") {
    return "REDUCED";
  }

  // 추가 환경 체크 (Happy 상태라도 환경이 경계에 있으면 REDUCED)
  if (
    temp > optimal.temp.max - 1 || // 최대 온도 -1도 이내
    temp < optimal.temp.min + 1 || // 최소 온도 +1도 이내
    ph > optimal.ph.max - 0.2 ||
    ph < optimal.ph.min + 0.2 ||
    tds > optimal.tds.max - 50
  ) {
    return "REDUCED";
  }

  // 3) NORMAL - 최적 환경
  return "NORMAL";
}

/**
 * 급여량 및 전략 계산
 */
export function calculateFeedingStrategy(
  mode: FeedingMode,
  fishType: FishType,
  status: FishStatus
): FeedingDecision {
  const normalFeed = NORMAL_FEED[fishType];

  // NORMAL 모드
  if (mode === "NORMAL") {
    return {
      mode: "NORMAL",
      frequency: normalFeed.frequency,
      amount: normalFeed.amount,
      notice: normalFeed.notice,
      recommendation: "✅ 최적 환경입니다. 정상 급여하세요.",
    };
  }

  // REDUCED 모드
  if (mode === "REDUCED") {
    const reducedStrategies: Record<
      FishType,
      { frequency: string; amount: string; notice: string }
    > = {
      betta: {
        frequency: "하루 1회",
        amount: "소량 (2알)",
        notice: "소화 잘 되는 사료",
      },
      goldfish: {
        frequency: "2-3일에 1회",
        amount: "극소량",
        notice: "식물성 사료 권장",
      },
      guppy: {
        frequency: "하루 1회",
        amount: "극소량",
        notice: "잔반 없도록 철저 관리",
      },
    };

    return {
      mode: "REDUCED",
      frequency: reducedStrategies[fishType].frequency,
      amount: reducedStrategies[fishType].amount,
      notice: reducedStrategies[fishType].notice,
      recommendation:
        "⚠️ 수질 주의 구간입니다. 급여량을 50% 감량하세요.",
    };
  }

  // HOLD 모드
  const holdNotices: Record<FishType, string> = {
    betta: "라비린스 기관이 있어도 극한 환경에서는 소화 활동이 산소 부족을 가속화합니다.",
    goldfish:
      "30°C 이상에서 유산소 대사 능력이 붕괴됩니다. 소화 과정(SDA)은 질식사 위험을 높입니다.",
    guppy:
      "아가미가 작아 암모니아 독성에 매우 취약합니다. 치명적인 수질에서는 생존에 전념해야 합니다.",
  };

  return {
    mode: "HOLD",
    frequency: "급여 중단",
    amount: "0",
    notice: "금식 필수",
    recommendation: `🚨 위험 구간입니다. 즉시 급여를 중단하세요.\n${holdNotices[fishType]}`,
  };
}

/**
 * 자동급여 컨트롤러 - 메인 함수
 */
export function autoFeedingController(
  fishType: FishType,
  sensorData: ExtendedSensorData
): FeedingDecision {
  const mode = determineFeedingMode(fishType, sensorData);
  const decision = calculateFeedingStrategy(mode, fishType, sensorData.status);

  // 금붕어 야간 급여 제한 로직 (실제 구현 시 시간 체크 추가)
  // if (fishType === "goldfish" && isNightTime()) {
  //   decision.recommendation += "\n🌙 야간에는 최소 급여만 하세요 (MO2 상승 고려).";
  // }

  return decision;
}

/**
 * 어종별 급여 가이드 설명 (UI 표시용)
 */
export function getFeedingGuideText(fishType: FishType): {
  title: string;
  strategy: string[];
  warning: string;
} {
  const guides = {
    betta: {
      title: "베타 급여 전략",
      strategy: [
        "• 치어는 DO 의존도 높음 → 환경 나빠지면 최우선 감량",
        "• 성어는 라비린스가 있지만 암모니아에 취약",
        "• NH₃ 감지 시 즉시 REDUCED 모드 전환",
        "• 고단백 사료로 소량 분할 급여",
      ],
      warning: "⚠️ 극한 환경에서 소화 활동은 산소 부족을 가속화합니다.",
    },
    goldfish: {
      title: "금붕어 급여 전략",
      strategy: [
        "• 환경 악화 시 금식 임계 빠르게 도달",
        "• 야간 대량 급여 금지 (SDA로 산소 소비 35% 증가)",
        "• 고온(>28°C)에서 자동 REDUCED 전환",
        "• 침강성 소화 사료로 1분 내 섭취량만",
      ],
      warning:
        "🚨 30°C 이상에서 유산소 대사 능력 붕괴. 밤에는 급여량 70% 축소.",
    },
    guppy: {
      title: "구피 급여 전략",
      strategy: [
        "• '버틴다'를 '급여해도 된다'로 착각 금지",
        "• 수질 악화(DO<5, TAN>0.5) 시 REDUCED 우선",
        "• 오염 발생 시 즉시 급여 감량 → 수질 회복 최우선",
        "• 치어는 고빈도 소량 급여 (하루 3-5회)",
      ],
      warning: "⚠️ 아가미가 작아 암모니아 독성 호흡 곤란에 매우 취약합니다.",
    },
  };

  return guides[fishType];
}
