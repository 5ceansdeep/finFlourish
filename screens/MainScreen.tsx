// screens/MainScreen.tsx

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StackScreenProps } from "@react-navigation/stack";
import { useFocusEffect } from "@react-navigation/native";
import * as Notifications from "expo-notifications";

import { useSensorData, feedFish, executeAutoFeed } from "../services/sensorService";
import { RootStackParamList, Fish, FishType, FishStatus } from "../types";
import { getCurrentFish, setStressMode, clearStressMode } from "../services/fishStorage";
import { autoFeedingController } from "../services/autoFeedingService";
import {
  getLastAutoFeedTime,
  setLastAutoFeedTime,
  getMinutesUntilNextFeed,
  shouldFeedNow,
  isAutoFeedEnabled,
  setAutoFeedEnabled,
  formatTimeAgo,
  formatTimeUntil,
  getRecommendedInterval,
  setFeedIntervalHours,
} from "../services/autoFeedingScheduler";
import { addLog } from "../services/logService";

// 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// 이미지 미리 import
const fishAngry = require("../FinAndFlourish/assets/images/fish_angry.png");
const fishWorry = require("../FinAndFlourish/assets/images/fish_worry.png");
const fishHappy = require("../FinAndFlourish/assets/images/fish_happy.png");
const logoImage = require("../FinAndFlourish/assets/images/logo.png");

type MainScreenProps = StackScreenProps<RootStackParamList, "Main">;

type FeedingMode = "NORMAL" | "REDUCED" | "HOLD";

interface GaugeProps {
  label: string;
  title: string;
  colors: readonly [string, string, ...string[]];
  value: number;
  unit?: string;
}
const Gauge: React.FC<GaugeProps> = ({ label, title, colors, value, unit }) => (
  <View style={styles.gaugeWrapper}>
    <Text style={styles.gaugeTitle}>{title}</Text>
    <View style={styles.gaugeBarBackground}>
      <LinearGradient
        colors={colors}
        style={[styles.gaugeBar, { height: `${value * 100}%` }]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
      />
    </View>
    <Text style={styles.gaugeValue}>
      {label}
      {unit}
    </Text>
  </View>
);

interface ActionButtonProps {
  label: string;
  imageSource: any;
  onPress?: () => void;
  color: string;
}
const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  imageSource,
  onPress,
  color,
}) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <View style={[styles.iconBox, { borderColor: color }]}>
      <Image source={imageSource} style={styles.actionIcon} />
    </View>
    <Text style={styles.actionText}>{label}</Text>
  </TouchableOpacity>
);

export default function MainScreen({ navigation }: MainScreenProps) {
  const [sensorData, isLoading, error, refetch] = useSensorData();
  const [currentFish, setCurrentFish] = useState<Fish | null>(null);
  const prevStatusRef = useRef<FeedingMode | undefined>(undefined);

  // 자동급여 상태
  const [lastFeedTime, setLastFeedTimeState] = useState<Date | null>(null);
  const [minutesUntilNext, setMinutesUntilNext] = useState<number | null>(null);
  const [autoFeedOn, setAutoFeedOn] = useState<boolean>(false);

  // 현재 물고기 정보 (등록된 물고기가 있으면 해당 정보, 없으면 기본값)
  const fishType: FishType = currentFish?.type || sensorData.fishType;
  const fishName: string = currentFish?.name || "물고기";

  // 자동급여 로직 결과
  const autoFeeding = autoFeedingController(fishType, sensorData);

  const loadCurrentFish = async () => {
    const fish = await getCurrentFish();
    setCurrentFish(fish);
  };

  // 화면 포커스될 때마다 현재 물고기 정보 갱신
  useFocusEffect(
    useCallback(() => {
      const checkStressExpirationAndLoad = async () => {
        const fish = await getCurrentFish();
        if (fish && fish.stressUntil && new Date(fish.stressUntil) < new Date()) {
          console.log(`${fish.name}의 스트레스 모드가 만료되었습니다. 로그를 기록합니다.`);
          await addLog({
            // 만료된 시점을 기준으로 로그 시간 기록
            date: new Date(fish.stressUntil).toISOString(),
            type: "stress",
            status: "happy", // 스트레스가 끝났으므로 'happy'로 기록
            message: `${fish.name}의 스트레스 관리가 종료되었습니다.`,
          });
          await clearStressMode(fish.id);
          // 상태가 변경되었으므로 물고기 정보를 다시 로드
          const updatedFish = await getCurrentFish();
          setCurrentFish(updatedFish);
        } else {
          setCurrentFish(fish);
        }
      };

      checkStressExpirationAndLoad();
    }, [])
  );

  // 자동급여 상태 로드 및 업데이트
  useEffect(() => {
    const loadAutoFeedStatus = async () => {
      const enabled = await isAutoFeedEnabled();
      const lastTime = await getLastAutoFeedTime();
      const minutes = await getMinutesUntilNextFeed();

      setAutoFeedOn(enabled);
      setLastFeedTimeState(lastTime);
      setMinutesUntilNext(minutes);
    };

    loadAutoFeedStatus();
    // 1분마다 다음 급여 시간 업데이트
    const interval = setInterval(loadAutoFeedStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // 자동급여 실행 로직
  useEffect(() => {
    // 스트레스 모드인지 확인
    const isStressMode =
      currentFish?.stressUntil && new Date(currentFish.stressUntil) > new Date();

    const checkAndExecuteAutoFeed = async () => {
      if (isLoading || !autoFeedOn || isStressMode) {
        if (isStressMode) console.log("스트레스 모드이므로 자동급여를 건너뜁니다.");
        return;
      }

      const shouldFeed = await shouldFeedNow();
      if (!shouldFeed) return;

      const mode = autoFeeding.mode;
      const shouldExecute = mode === "NORMAL";

      // 급여 실행 또는 중단 기록
      const success = await executeAutoFeed(shouldExecute);

      if (success) {
        // 로그 추가
        await addLog({
          date: new Date().toISOString(),
          type: "auto_feed",
          message: shouldExecute
            ? `자동급여 완료`
            : autoFeeding.recommendation,
          autoFeedData: {
            executed: shouldExecute,
            mode,
            reason: autoFeeding.recommendation,
          },
        });

        // 마지막 급여 시간 업데이트
        const now = new Date();
        await setLastAutoFeedTime(now);
        setLastFeedTimeState(now);

        // 다음 급여 간격 설정
        const recommendedInterval = getRecommendedInterval(fishType, mode);
        await setFeedIntervalHours(recommendedInterval);

        // 알림 전송
        await Notifications.scheduleNotificationAsync({
          content: {
            title: shouldExecute ? "🤖 자동급여 완료" : "🤖 자동급여 중단",
            body: shouldExecute
              ? `${fishName}에게 먹이를 주었습니다.`
              : `수질이 좋지 않아 급여를 중단했습니다.`,
            sound: true,
          },
          trigger: null,
        });
      }
    };

    checkAndExecuteAutoFeed();
  }, [sensorData, isLoading, autoFeedOn, autoFeeding, fishType, fishName, currentFish]);

  const normalizeValue = (value: number, min: number, max: number): number => {
    return Math.min(1.0, Math.max(0.0, (value - min) / (max - min)));
  };

  // 자동급여 ON/OFF 토글
  const toggleAutoFeed = async () => {
    const newState = !autoFeedOn;
    await setAutoFeedEnabled(newState);
    setAutoFeedOn(newState);

    Alert.alert(
      "자동급여 설정",
      newState
        ? "자동급여가 활성화되었습니다. 센서 데이터를 기반으로 자동으로 먹이를 급여합니다."
        : "자동급여가 비활성화되었습니다.",
      [{ text: "확인" }]
    );
  };

  // 물고기 상태 변화 감지 및 알림
  useEffect(() => {
    const checkStatusChange = async () => {
      if (isLoading) return;

      const currentStatus = autoFeeding.mode; // autoFeeding.mode를 기준으로 상태 판단
      const prevStatus = prevStatusRef.current;

      if (currentStatus !== prevStatus && prevStatus !== undefined) {
        let title = "";
        let body = "";
        let logMessage = "";

        switch (currentStatus) {
          case "HOLD":
            title = `🚨 ${fishName}(이)가 화가 났습니다!`;
            body = "수질이 위험합니다. 급여가 중단될 수 있습니다.";
            logMessage = `${fishName}(이)가 화가 났습니다 😡`;
            break;
          case "REDUCED":
            title = `⚠️ ${fishName}(이)가 걱정하고 있습니다`;
            body = "수질이 주의 수준입니다. 급여량이 줄어들 수 있습니다.";
            logMessage = `${fishName}(이)가 걱정하고 있습니다 😟`;
            break;
          case "NORMAL":
          default: // NORMAL 모드
            title = `✨ ${fishName}(이)가 행복합니다!`;
            body = "수질이 최적 상태입니다!";
            logMessage = `${fishName}(이)가 행복합니다 😊`;
            break;
        }

        // 알림 전송
        await Notifications.scheduleNotificationAsync({
          content: { title, body, sound: true },
          trigger: null,
        });

        // 상태 변화 로그 기록
        await addLog({
          date: new Date().toISOString(),
          type: "status",
          status: currentStatus === "HOLD" ? "angry" : currentStatus === "REDUCED" ? "worry" : "happy",
          message: logMessage,
          sensorData: {
            temp: sensorData.temp,
            ph: sensorData.ph,
            tds: sensorData.tds,
          },
        });

        prevStatusRef.current = currentStatus;
      } else if (prevStatus === undefined) {
        // 첫 로드 시 현재 상태를 저장
        prevStatusRef.current = currentStatus;
      }
    };

    checkStatusChange();
  }, [autoFeeding.mode, isLoading, fishName]);

  // 물고기 상태 상세 설명 표시
  const explainFishStatus = () => {
    const { temp, ph, tds } = sensorData;
    const currentMode = autoFeeding.mode;
    let title = "";
    let message = "";

    switch (currentMode) {
      case "HOLD":
        title = `😡 ${fishName}(이)가 화가 났습니다!`;
        message = `수질이 위험 수준입니다.\n(현재: T:${temp.toFixed(
          1
        )}°C, pH:${ph.toFixed(1)}, TDS:${tds}ppm)\n\n즉각적인 확인과 조치가 필요합니다!`;
        break;
      case "REDUCED":
        title = `😟 ${fishName}(이)가 걱정하고 있습니다`;
        message = `수질이 주의 수준입니다.\n(현재: T:${temp.toFixed(
          1
        )}°C, pH:${ph.toFixed(1)}, TDS:${tds}ppm)\n\n환경을 점검해주세요.`;
        break;
      case "NORMAL":
      default:
        title = `😊 ${fishName}(이)가 행복합니다!`;
        message = `최적의 수질 환경입니다.\n(현재: T:${temp.toFixed(
          1
        )}°C, pH:${ph.toFixed(1)}, TDS:${tds}ppm)\n\n완벽해요!`;
        break;
    }
    Alert.alert(title, message, [{ text: "확인", style: "default" }]);
  };

  // 물고기 상태 카드 렌더링
  const renderFishStatus = () => {
    let imageSource;
    let statusText: string;
    let bgColor: string;
    
    const isStressMode =
      currentFish?.stressUntil && new Date(currentFish.stressUntil) > new Date();

    if (isStressMode) {
      imageSource = fishWorry;
      statusText = `${fishName}(이)가 스트레스를 받고 있습니다.`;
      bgColor = "#FFF8E5"; // worry color
    } else {
      // autoFeeding.mode를 기준으로 상태 결정
      switch (autoFeeding.mode) {
        case "HOLD":
          imageSource = fishAngry;
          statusText = `${fishName}(이)가 화가 난 것 같습니다...`;
          bgColor = "#FFE5E5";
          break;
        case "REDUCED":
          imageSource = fishWorry;
          statusText = `${fishName}(이)가 걱정하고 있습니다.`;
          bgColor = "#FFF8E5";
          break;
        case "NORMAL":
        default:
          imageSource = fishHappy;
          statusText = `${fishName}(이)가 기분이 좋아요!`;
          bgColor = "#E5F8FF";
      }
    }

    return (
      <View>
        <Text style={styles.sectionTitle}>오늘의 상태</Text>
        <TouchableOpacity
          // 스트레스 모드일 때는 탭 비활성화
          style={[styles.statusCard, { backgroundColor: bgColor }]} 
          onPress={explainFishStatus}
          activeOpacity={0.7}
        >
          {isLoading && (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color="#4D55FF" />
            </View>
          )}
          <Image source={imageSource} style={styles.fishImage} />
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusText}>{statusText}</Text>
            <Text style={styles.tapHint}>탭하여 자세히 보기</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // 스트레스 모드 관리
  const handleSetStressMode = async (reason: string) => {
    if (currentFish) {
      try {
        await setStressMode(currentFish.id);

        // 스트레스 모드 시작 로그 추가
        await addLog({
          date: new Date().toISOString(),
          type: "stress",
          status: "worry", // 스트레스 시작이므로 'worry'로 기록
          message: `${currentFish.name}의 스트레스 관리를 시작합니다. (${reason})`,
        });

        Alert.alert(
          `${reason} 완료`,
          `${currentFish.name}이(가) 24시간 동안 스트레스 관리 모드로 전환됩니다. 이 시간 동안 자동 급여가 중단됩니다.`,
          [{ text: "확인", onPress: loadCurrentFish }]
        );
      } catch (error) {
        Alert.alert("오류", "스트레스 모드 설정에 실패했습니다.");
      }
    }
  };

  const handleClearStressMode = async () => {
    if (currentFish) {
      try {
        await clearStressMode(currentFish.id);
        Alert.alert(
          "스트레스 모드 해제",
          `${currentFish.name}의 스트레스 관리 모드가 해제되었습니다.`,
          [{ text: "확인", onPress: loadCurrentFish }]
        );
      } catch (error) {
        Alert.alert("오류", "스트레스 모드 해제에 실패했습니다.");
      }
    }
  };

  // 스트레스 모드 UI 렌더링
  const renderStressModeSection = () => {
    const isStressMode =
      currentFish?.stressUntil && new Date(currentFish.stressUntil) > new Date();

    return (
      <View style={styles.stressModeSection}>
        <Text style={styles.sectionTitle}>스트레스 관리</Text>
        {isStressMode ? (
          <View style={styles.stressModeCardActive}>
            <Text style={styles.stressModeText}>
              현재 스트레스 관리 모드입니다. (만료: {formatTimeUntil(Math.floor((new Date(currentFish!.stressUntil!).getTime() - new Date().getTime()) / 60000))})
            </Text>
            <TouchableOpacity style={styles.stressModeButtonInactive} onPress={handleClearStressMode}>
              <Text style={styles.stressModeButtonText}>모드 해제</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.stressModeCardInactive}>
            <TouchableOpacity style={styles.stressModeButton} onPress={() => handleSetStressMode("환수")}>
              <Text style={styles.stressModeButtonText}>환수 완료</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stressModeButton} onPress={() => handleSetStressMode("물고기 이동")}>
              <Text style={styles.stressModeButtonText}>물고기 이동</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#4D55FF", "#7B83FF"]} style={styles.header}>
        <Image source={logoImage} style={styles.logo} />
        <Text style={styles.headerTitle}>FIN & FLOURISH</Text>
        <TouchableOpacity
          style={styles.fishSettingsButton}
          onPress={() => navigation.navigate("FishName")}
        >
          <Text style={styles.fishSettingsIcon}>🐟+</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>안녕하세요!</Text>
          <Text style={styles.subGreeting}>
            오늘 {fishName}의 상태를 확인해보세요
          </Text>
        </View>

        {renderFishStatus()}

        <View style={styles.sensorSection}>
          <Text style={styles.sectionTitle}>수질 현황</Text>
          <View style={styles.gaugeRow}>
            <Gauge
              title="TDS"
              label={`${sensorData.tds}`}
              unit=" ppm"
              colors={["#FFD93D", "#FF8C00"]}
              value={normalizeValue(sensorData.tds, 0, 100)}
            />
            <Gauge
              title="TEMP"
              label={`${sensorData.temp.toFixed(1)}`}
              unit="°C"
              colors={["#6BCB77", "#4CAF50"]}
              value={normalizeValue(sensorData.temp, 15, 30)}
            />
            <Gauge
              title="pH"
              label={`${sensorData.ph.toFixed(1)}`}
              colors={["#4D96FF", "#3B82F6"]}
              value={normalizeValue(sensorData.ph, 6.0, 9.0)}
            />
          </View>
        </View>

        {renderStressModeSection()}

        <View style={styles.autoFeedingSection}>
          <Text style={styles.sectionTitle}>자동급여 시스템</Text>

          {/* 논문 기반 급여 피드백 */}
          <View
            style={[
              styles.feedbackCard,
              autoFeeding.mode === "NORMAL" && styles.feedbackNormal,
              autoFeeding.mode === "REDUCED" && styles.feedbackReduced,
              autoFeeding.mode === "HOLD" && styles.feedbackHold,
            ]}
          >
            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackTitle}>
                {autoFeeding.mode === "NORMAL" && "✅ 정상 급여 가능"}
                {autoFeeding.mode === "REDUCED" && "⚠️ 급여량 감량 필요"}
                {autoFeeding.mode === "HOLD" && "🚨 급여 중단 권장"}
              </Text>
            </View>
            <Text style={styles.feedbackText}>
              {autoFeeding.recommendation}
            </Text>
            <View style={styles.feedbackDetails}>
              <Text style={styles.feedbackDetailLabel}>어종:</Text>
              <Text style={styles.feedbackDetailValue}>
                {fishType === "betta"
                  ? "베타"
                  : fishType === "goldfish"
                  ? "금붕어"
                  : "구피"}
              </Text>
            </View>
            <View style={styles.feedbackDetails}>
              <Text style={styles.feedbackDetailLabel}>현재 수질:</Text>
              <Text style={styles.feedbackDetailValue}>
                TEMP: {sensorData.temp.toFixed(1)}°C, pH:{" "}
                {sensorData.ph.toFixed(1)}, TDS: {sensorData.tds}ppm
              </Text>
            </View>
          </View>

          {/* 자동급여 타이머 정보 */}
          <View style={styles.timerCard}>
            <View style={styles.timerRow}>
              <Text style={styles.timerLabel}>🕐 마지막 급여</Text>
              <Text style={styles.timerValue}>
                {lastFeedTime ? formatTimeAgo(lastFeedTime) : "기록 없음"}
              </Text>
            </View>
            <View style={styles.timerRow}>
              <Text style={styles.timerLabel}>⏰ 다음 급여</Text>
              <Text style={styles.timerValue}>
                {minutesUntilNext !== null && minutesUntilNext > 0
                  ? formatTimeUntil(minutesUntilNext)
                  : minutesUntilNext === null
                  ? "미설정"
                  : "지금"}
              </Text>
            </View>
            <View style={styles.timerRow}>
              <Text style={styles.timerLabel}>🤖 자동급여</Text>
              <Switch
                value={autoFeedOn}
                onValueChange={toggleAutoFeed}
                trackColor={{ false: "#CBD5E1", true: "#10B981" }}
                thumbColor={autoFeedOn ? "#FFFFFF" : "#F1F5F9"}
              />
            </View>
          </View>
        </View>

        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>빠른 메뉴</Text>
          <View style={styles.actionContainer}>
            <ActionButton
              label="Feed"
              imageSource={require("../FinAndFlourish/assets/images/feed.png")}
              color="#FF6B6B"
              onPress={async () => {
                const success = await feedFish();
                if (success) {
                  // 수동 먹이급여 로그 기록
                  await addLog({
                    date: new Date().toISOString(),
                    type: "feed",
                    message: `${fishName}에게 먹이를 주었습니다 🍽️`,
                  });
                  Alert.alert("성공", "먹이를 주었습니다! 🍽️");
                } else {
                  Alert.alert("실패", "먹이 주기에 실패했습니다.");
                }
              }}
            />
            <ActionButton
              label="feeding Log"
              imageSource={require("../FinAndFlourish/assets/images/log.png")}
              onPress={() => navigation.navigate("Log")}
              color="#45B7D1"
            />
            <ActionButton
              label="My fishes"
              imageSource={require("../FinAndFlourish/assets/images/fish_happy.png")}
              onPress={() => navigation.navigate("MyFish")}
              color="#9B59B6"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: "SilkscreenBold",
    color: "white",
    fontSize: 14,
    flex: 1,
  },
  fishSettingsButton: {
    width: 36,
    height: 36,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  fishSettingsIcon: {
    fontSize: 18,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  greetingContainer: {
    marginBottom: 20,
  },
  greetingText: {
    fontFamily: "SilkscreenBold",
    fontSize: 16,
    color: "#1E293B",
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: "#64748B",
    fontFamily: "PixelifySans",
  },
  statusCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  fishImage: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },
  statusTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  statusText: {
    fontFamily: "SilkscreenRegular",
    fontSize: 13,
    color: "#1E293B",
    lineHeight: 20,
    marginBottom: 6,
  },
  tapHint: {
    fontFamily: "PixelifySans",
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderRadius: 20,
  },
  connectingText: {
    marginTop: 12,
    fontFamily: "SilkscreenRegular",
    fontSize: 10,
    color: "#4D55FF",
  },
  sectionTitle: {
    fontFamily: "SilkscreenBold",
    fontSize: 18,
    color: "#1E293B",
    marginBottom: 16,
  },
  sensorSection: {
    marginBottom: 24,
  },
  gaugeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gaugeWrapper: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 8,
  },
  gaugeTitle: {
    fontFamily: "SilkscreenRegular",
    fontSize: 12,
    color: "#64748B",
    marginBottom: 12,
  },
  gaugeBarBackground: {
    width: 50,
    height: 100,
    backgroundColor: "#F1F5F9",
    borderRadius: 25,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  gaugeBar: {
    width: "100%",
    borderRadius: 25,
  },
  gaugeValue: {
    fontFamily: "SilkscreenRegular",
    fontSize: 14,
    color: "#1E293B",
    marginTop: 10,
  },
  feedingSection: {
    marginBottom: 24,
  },
  feedingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  feedingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  feedingLabel: {
    fontFamily: "SilkscreenBold",
    fontSize: 14,
    color: "#334155",
    width: "25%",
  },
  feedingValue: {
    fontFamily: "PixelifySans",
    fontSize: 15,
    color: "#1E293B",
    textAlign: "right",
    flex: 1,
  },
  autoFeedingSection: {
    marginBottom: 24,
  },
  feedbackCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  feedbackNormal: {
    backgroundColor: "#ECFDF5",
  },
  feedbackReduced: {
    backgroundColor: "#FFFBEB",
  },
  feedbackHold: {
    backgroundColor: "#FEF2F2",
  },
  feedbackHeader: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  feedbackTitle: {
    fontFamily: "SilkscreenBold",
    fontSize: 16,
    color: "#1E293B",
  },
  feedbackText: {
    fontFamily: "PixelifySans",
    fontSize: 14,
    color: "#334155",
    lineHeight: 22,
    marginBottom: 16,
  },
  feedbackDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
  },
  feedbackDetailLabel: {
    fontFamily: "SilkscreenBold",
    fontSize: 14,
    color: "#64748B",
    marginRight: 8,
    minWidth: 60,
  },
  feedbackDetailValue: {
    fontFamily: "PixelifySans",
    fontSize: 12,
    color: "#1E293B",
    flex: 1,
  },
  timerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  timerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  timerLabel: {
    fontFamily: "SilkscreenBold",
    fontSize: 14,
    color: "#1E293B",
  },
  timerValue: {
    fontFamily: "PixelifySans",
    fontSize: 15,
    color: "#4D55FF",
    fontWeight: "600",
  },
  statusOn: {
    color: "#10B981",
    fontFamily: "SilkscreenBold",
  },
  statusOff: {
    color: "#94A3B8",
    fontFamily: "SilkscreenBold",
  },
  modeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  modeNormal: {
    backgroundColor: "#E5F8FF",
    borderLeftWidth: 4,
    borderLeftColor: "#4D96FF",
  },
  modeReduced: {
    backgroundColor: "#FFF8E5",
    borderLeftWidth: 4,
    borderLeftColor: "#FFB800",
  },
  modeHold: {
    backgroundColor: "#FFE5E5",
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
  },
  modeTitle: {
    fontFamily: "SilkscreenBold",
    fontSize: 16,
    color: "#1E293B",
    marginBottom: 8,
  },
  modeRecommendation: {
    fontFamily: "PixelifySans",
    fontSize: 13,
    color: "#334155",
    lineHeight: 20,
  },
  strategyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  strategyTitle: {
    fontFamily: "SilkscreenBold",
    fontSize: 15,
    color: "#1E293B",
    marginBottom: 12,
  },
  strategyItem: {
    fontFamily: "PixelifySans",
    fontSize: 13,
    color: "#475569",
    lineHeight: 22,
    marginBottom: 6,
  },
  warningBox: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
  },
  warningText: {
    fontFamily: "PixelifySans",
    fontSize: 12,
    color: "#92400E",
    lineHeight: 18,
  },
  actionSection: {
    marginBottom: 20,
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionButton: {
    alignItems: "center",
    flex: 1,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    backgroundColor: "#F8FAFC",
  },
  actionIcon: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  actionText: {
    fontFamily: "SilkscreenRegular",
    fontSize: 12,
    color: "#1E293B",
    textAlign: "center",
  },
  stressModeSection: {
    marginBottom: 24,
  },
  stressModeCardInactive: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stressModeCardActive: {
    backgroundColor: "#FFFBEB",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  stressModeText: {
    fontFamily: "PixelifySans",
    fontSize: 13,
    color: "#B45309",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 20,
  },
  stressModeButton: {
    backgroundColor: "#4D55FF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  stressModeButtonInactive: {
    backgroundColor: "#F59E0B",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  stressModeButtonText: { color: "#FFFFFF", fontFamily: "SilkscreenBold", fontSize: 12 },
});
