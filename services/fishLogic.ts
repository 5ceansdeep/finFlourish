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
  getFeedingRecommendation: (status: FishStatus) => FeedingRecommendation;
}

// 1. 베타 (Betta splendens) 로직
const bettaLogic: FishLogic = {
  getFeedingRecommendation: (status) => {
    switch (status) {
      case "happy":
        return {
          frequency: "1일 1~2회",
          amount: "2분 내 섭취량",
          notice: "과식 주의, 남은 먹이 제거",
        };
      case "worry":
        return {
          frequency: "1일 1회",
          amount: "소량",
          notice: "소화 잘 되는 먹이 권장",
        };
      case "angry":
        return {
          frequency: "급여 중단",
          amount: "없음",
          notice: "수질 안정 후 급여 재개",
        };
    }
  },
};

// 2. 금붕어 (Carassius auratus) 로직
const goldfishLogic: FishLogic = {
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
  getFeedingRecommendation: (status) => {
    switch (status) {
      case "happy":
        return {
          frequency: "1일 2~3회",
          amount: "1분 내 섭취량",
          notice: "치어와 성어 사료 구분",
        };
      case "worry":
        return {
          frequency: "1일 1회",
          amount: "소량",
          notice: "수질 변화에 민감",
        };
      case "angry":
        return {
          frequency: "급여 중단",
          amount: "없음",
          notice: "수질 안정까지 금식",
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
      return bettaLogic; // 기본값으로 베타 로직 반환
  }
};
