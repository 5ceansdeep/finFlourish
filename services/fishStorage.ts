// services/fishStorage.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Fish, FishType } from "../types";

const FISH_LIST_KEY = "@fish_list";
const CURRENT_FISH_KEY = "@current_fish";

/**
 * 모든 물고기 목록 가져오기
 */
export async function getAllFish(): Promise<Fish[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(FISH_LIST_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("물고기 목록 불러오기 실패:", e);
    return [];
  }
}

/**
 * 물고기 추가
 */
export async function addFish(
  name: string,
  type: FishType,
  lifeStage?: "juvenile" | "adult",
  weight?: number,
  count?: number,
  tankVolume?: number
): Promise<Fish> {
  try {
    const fishList = await getAllFish();
    const newFish: Fish = {
      id: Date.now().toString(),
      name,
      type,
      createdAt: new Date().toISOString(),
      lifeStage: lifeStage || "adult",
      weight: weight || getDefaultWeight(type),
      count: count || 1,
      stressUntil: undefined,
    };

    fishList.push(newFish);
    await AsyncStorage.setItem(FISH_LIST_KEY, JSON.stringify(fishList));

    // 수조 용량 저장 (전역 설정)
    if (tankVolume !== undefined) {
      await AsyncStorage.setItem("@tank_volume", tankVolume.toString());
    }

    // 첫 번째 물고기면 현재 물고기로 설정
    if (fishList.length === 1) {
      await setCurrentFish(newFish.id);
    }

    return newFish;
  } catch (e) {
    console.error("물고기 추가 실패:", e);
    throw e;
  }
}

/**
 * 어종별 기본 체중 반환 (g)
 */
function getDefaultWeight(type: FishType): number {
  switch (type) {
    case "betta":
      return 3;
    case "goldfish":
      return 50;
    case "guppy":
      return 1;
    default:
      return 3;
  }
}

/**
 * 물고기 삭제
 */
export async function deleteFish(fishId: string): Promise<void> {
  try {
    const fishList = await getAllFish();
    const filteredList = fishList.filter((fish) => fish.id !== fishId);
    await AsyncStorage.setItem(FISH_LIST_KEY, JSON.stringify(filteredList));

    // 삭제한 물고기가 현재 선택된 물고기였다면
    const currentFishId = await getCurrentFishId();
    if (currentFishId === fishId && filteredList.length > 0) {
      await setCurrentFish(filteredList[0].id);
    } else if (filteredList.length === 0) {
      await AsyncStorage.removeItem(CURRENT_FISH_KEY);
    }
  } catch (e) {
    console.error("물고기 삭제 실패:", e);
    throw e;
  }
}

/**
 * 현재 선택된 물고기 ID 가져오기
 */
export async function getCurrentFishId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CURRENT_FISH_KEY);
  } catch (e) {
    console.error("현재 물고기 ID 불러오기 실패:", e);
    return null;
  }
}

/**
 * 현재 선택된 물고기 정보 가져오기
 */
export async function getCurrentFish(): Promise<Fish | null> {
  try {
    const fishId = await getCurrentFishId();
    if (!fishId) return null;

    const fishList = await getAllFish();
    return fishList.find((fish) => fish.id === fishId) || null;
  } catch (e) {
    console.error("현재 물고기 불러오기 실패:", e);
    return null;
  }
}

/**
 * 현재 물고기 설정
 */
export async function setCurrentFish(fishId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(CURRENT_FISH_KEY, fishId);
  } catch (e) {
    console.error("현재 물고기 설정 실패:", e);
    throw e;
  }
}

/**
 * 특정 물고기를 24시간 스트레스 모드로 설정
 */
export async function setStressMode(fishId: string): Promise<void> {
  try {
    const fishList = await getAllFish();
    const fishIndex = fishList.findIndex((fish) => fish.id === fishId);

    if (fishIndex !== -1) {
      const now = new Date();
      now.setHours(now.getHours() + 24); // 24시간 후
      fishList[fishIndex].stressUntil = now.toISOString();

      await AsyncStorage.setItem(FISH_LIST_KEY, JSON.stringify(fishList));
      console.log(`${fishList[fishIndex].name}을(를) 24시간 스트레스 모드로 설정했습니다.`);
    } else {
      console.warn("스트레스 모드를 설정할 물고기를 찾지 못했습니다:", fishId);
    }
  } catch (e) {
    console.error("스트레스 모드 설정 실패:", e);
    throw e;
  }
}

/**
 * 특정 물고기의 스트레스 모드 해제
 */
export async function clearStressMode(fishId: string): Promise<void> {
  try {
    const fishList = await getAllFish();
    const fishIndex = fishList.findIndex((fish) => fish.id === fishId);

    if (fishIndex !== -1) {
      fishList[fishIndex].stressUntil = undefined;
      await AsyncStorage.setItem(FISH_LIST_KEY, JSON.stringify(fishList));
      console.log(`${fishList[fishIndex].name}의 스트레스 모드를 해제했습니다.`);
    } else {
      console.warn("스트레스 모드를 해제할 물고기를 찾지 못했습니다:", fishId);
    }
  } catch (e) {
    console.error("스트레스 모드 해제 실패:", e);
    throw e;
  }
}

/**
 * 수조 용량 가져오기
 */
export async function getTankVolume(): Promise<number> {
  try {
    const volume = await AsyncStorage.getItem("@tank_volume");
    return volume ? parseFloat(volume) : 10; // 기본값 10L
  } catch (e) {
    console.error("수조 용량 불러오기 실패:", e);
    return 10;
  }
}

/**
 * 수조 용량 설정
 */
export async function setTankVolume(volume: number): Promise<void> {
  try {
    await AsyncStorage.setItem("@tank_volume", volume.toString());
  } catch (e) {
    console.error("수조 용량 설정 실패:", e);
    throw e;
  }
}
