// services/logService.ts
// 로그 저장 및 관리 서비스

import AsyncStorage from "@react-native-async-storage/async-storage";
import { LogEntry, FishStatus } from "../types";

const LOGS_KEY = "@logs";

// 모든 로그 가져오기
export async function getAllLogs(): Promise<LogEntry[]> {
  try {
    const logsJson = await AsyncStorage.getItem(LOGS_KEY);
    if (!logsJson) return [];
    return JSON.parse(logsJson);
  } catch (error) {
    console.error("Failed to get logs:", error);
    return [];
  }
}

// 로그 추가
export async function addLog(log: Omit<LogEntry, "id">): Promise<void> {
  try {
    const logs = await getAllLogs();
    const newLog: LogEntry = {
      ...log,
      id: Date.now().toString(),
    };
    logs.unshift(newLog); // 최신 로그를 앞에 추가
    await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Failed to add log:", error);
  }
}

// 상태 변화 로그 추가
export async function addStatusLog(
  status: FishStatus,
  fishName: string
): Promise<void> {
  const messages: Record<FishStatus, string> = {
    happy: `${fishName}가 기분이 좋습니다!`,
    worry: `${fishName}가 고민중입니다.`,
    angry: `${fishName}가 화가 난 것 같습니다...`,
  };

  await addLog({
    date: new Date().toLocaleString("ko-KR"),
    type: "status",
    status,
    message: messages[status],
  });
}

// 먹이 급여 로그 추가
export async function addFeedLog(manual: boolean = true): Promise<void> {
  await addLog({
    date: new Date().toLocaleString("ko-KR"),
    type: "feed",
    message: manual ? "먹이 급여 완료!" : "자동 먹이 급여 완료!",
  });
}

// 자동급여 로그 추가
export async function addAutoFeedLog(
  executed: boolean,
  mode: "NORMAL" | "REDUCED" | "HOLD",
  reason: string
): Promise<void> {
  const message = executed
    ? `🤖 자동급여 실행 (${mode})`
    : `🤖 자동급여 중단 - ${reason}`;

  await addLog({
    date: new Date().toLocaleString("ko-KR"),
    type: "auto_feed",
    message,
    autoFeedData: {
      executed,
      mode,
      reason,
    },
  });
}

// 오래된 로그 삭제 (최근 100개만 유지)
export async function cleanOldLogs(): Promise<void> {
  try {
    const logs = await getAllLogs();
    if (logs.length > 100) {
      const recentLogs = logs.slice(0, 100);
      await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(recentLogs));
    }
  } catch (error) {
    console.error("Failed to clean old logs:", error);
  }
}
