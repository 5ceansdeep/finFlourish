// services/fishLogic.ts

import { FishStatus, FishType } from "../types";

// 먹이 급여 기준 인터페이스
interface FeedingRecommendation {
  frequency: string; // 급여 빈도
  amount: string; // 급여량
  notice: string; // 주의사항
}

// 어종별 로직 인터페이스
interface FishLogic {
  calculateStatus: (temp: number, ph: number, tds: number) => FishStatus;
  getFeedingRecommendation: (status: FishStatus) => FeedingRecommendation;
}

// 1. 베타 (Betta splendens) 로직
const bettaLogic: FishLogic = {
  calculateStatus: (temp, ph, tds): FishStatus => {
    // Angry (위험)
    if (temp < 20 || temp > 30 || ph < 6.0 || ph > 8.0 || tds > 400) {
      return "angry";
    }
    // Worry (주의)
    if (
      (temp >= 20 && temp < 24) ||
      (temp > 28 && temp <= 30) ||
      (ph >= 6.0 && ph < 6.5) ||
      (ph > 7.5 && ph <= 8.0) ||
      (tds > 200 && tds <= 400)
    ) {
      return "worry";
    }
    // Happy (최적)
    if (
      temp >= 24 &&
      temp <= 28 &&
      ph >= 6.5 &&
      ph <= 7.5 &&
      tds >= 50 &&
      tds <= 200
    ) {
      return "happy";
    }
    return "worry"; // 경계값의 경우
  },
  getFeedingRecommendation: (status) => {
    switch (status) {
      case "happy":
        return {
          frequency: "1일 2회",
          amount: "3~5알 (2분 내)",
          notice: "고단백 사료 권장",
        };
      case "worry":
        return {
          frequency: "1일 1회 또는 격일",
          amount: "정량의 50%",
          notice: "소화 잘 되는 사료, 금식 고려",
        };
      case "angry":
        return {
          frequency: "급여 중단",
          amount: "없음",
          notice: "상태 호전 시까지 금식",
        };
    }
  },
};

// 2. 금붕어 (Carassius auratus) 로직
const goldfishLogic: FishLogic = {
  calculateStatus: (temp, ph, tds): FishStatus => {
    // Angry (위험)
    if (temp > 30 || temp < 10 || ph < 6.0 || ph > 9.0 || tds > 1000) {
      return "angry";
    }
    // Worry (주의)
    if (
      (temp >= 25 && temp <= 29) ||
      (ph >= 6.5 && ph < 7.0) ||
      (ph > 8.0 && ph <= 8.5) ||
      (tds > 400 && tds <= 1000)
    ) {
      return "worry";
    }
    // Happy (최적)
    if (
      temp >= 18 &&
      temp <= 24 &&
      ph >= 7.0 &&
      ph <= 8.0 &&
      tds >= 150 &&
      tds <= 400
    ) {
      return "happy";
    }
    return "worry";
  },
  getFeedingRecommendation: (status) => {
    switch (status) {
      case "happy":
        return {
          frequency: "1일 1~2회",
          amount: "1분 내 섭취량",
          notice: "침강성 소화 사료 권장",
        };
      case "worry":
        return {
          frequency: "2~3일에 1회",
          amount: "극소량",
          notice: "소화 잘 되는 식물성 사료",
        };
      case "angry":
        return {
          frequency: "급여 중단",
          amount: "없음",
          notice: "절대 급여 금지",
        };
    }
  },
};

// 3. 구피 (Poecilia reticulata) 로직
const guppyLogic: FishLogic = {
  calculateStatus: (temp, ph, tds): FishStatus => {
    // Angry (위험)
    if (temp < 18 || temp > 30 || ph < 6.0 || ph > 9.0 || tds < 100 || tds > 1000) {
      return "angry";
    }
    // Worry (주의)
    if (
      (temp >= 20 && temp < 24) ||
      (temp > 26 && temp <= 29) ||
      (ph >= 6.5 && ph < 7.2) ||
      (ph > 8.2 && ph <= 8.5) ||
      (tds >= 100 && tds < 300) ||
      (tds > 600 && tds <= 800)
    ) {
      return "worry";
    }
    // Happy (최적)
    if (
      temp >= 24 &&
      temp <= 26 &&
      ph >= 7.2 &&
      ph <= 8.2 &&
      tds >= 300 &&
      tds <= 600
    ) {
      return "happy";
    }
    return "worry";

  },
  getFeedingRecommendation: (status) => {
    switch (status) {
      case "happy":
        return {
          frequency: "1일 2~3회",
          amount: "소량 (1분 내)",
          notice: "치어는 더 자주 급여",
        };
      case "worry":
        return {
          frequency: "1일 1회",
          amount: "극소량",
          notice: "잔반 없도록 철저히 관리",
        };
      case "angry":
        return {
          frequency: "급여 중단",
          amount: "없음",
          notice: "상태 호전 시까지 금식",
        };
    }
  },
};

// 어종에 맞는 로직을 반환하는 팩토리 함수
export const getFishLogic = (fishType: FishType): FishLogic => {
  switch (fishType) {
    case "betta":
      return bettaLogic;
    case "goldfish":
      return goldfishLogic;
    case "guppy":
      return guppyLogic;
    default:
      // 기본값으로 베타 로직 반환
      return bettaLogic;
  }
};
