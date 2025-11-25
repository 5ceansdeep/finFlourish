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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StackScreenProps } from "@react-navigation/stack";
import { useFocusEffect } from "@react-navigation/native";
import * as Notifications from "expo-notifications";

import { useSensorData, feedFish } from "../services/sensorService";
import { RootStackParamList, FishStatus, Fish, FishType } from "../types";
import { getCurrentFish } from "../services/fishStorage";

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

// 물고기 종류와 상태에 따른 먹이 가이드
const getFeedingGuide = (fishType: FishType, status: FishStatus) => {
  const guides: Record<FishType, Record<FishStatus, { frequency: string; amount: string; notice: string }>> = {
    betta: {
      happy: {
        frequency: "하루 2회",
        amount: "소량 (2-3알)",
        notice: "최적 상태입니다!"
      },
      worry: {
        frequency: "하루 1회",
        amount: "소량 (2알)",
        notice: "수질 관리 필요"
      },
      angry: {
        frequency: "하루 1회",
        amount: "최소량 (1-2알)",
        notice: "수질 개선 후 급여"
      }
    },
    goldfish: {
      happy: {
        frequency: "하루 2-3회",
        amount: "중량 (5-6알)",
        notice: "활발한 급여 가능"
      },
      worry: {
        frequency: "하루 2회",
        amount: "소량 (3-4알)",
        notice: "과식 주의"
      },
      angry: {
        frequency: "하루 1회",
        amount: "최소량 (2알)",
        notice: "환경 개선 우선"
      }
    },
    guppy: {
      happy: {
        frequency: "하루 3회",
        amount: "소량 (3-4알)",
        notice: "자주 소량 급여"
      },
      worry: {
        frequency: "하루 2회",
        amount: "소량 (2-3알)",
        notice: "수질 점검 필요"
      },
      angry: {
        frequency: "하루 1회",
        amount: "최소량 (1-2알)",
        notice: "급여 제한 필요"
      }
    }
  };

  return guides[fishType][status];
};

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
  const prevStatusRef = useRef<FishStatus>(sensorData.status);

  // 현재 물고기 정보 (등록된 물고기가 있으면 해당 정보, 없으면 기본값)
  const fishType: FishType = currentFish?.type || sensorData.fishType;
  const fishName: string = currentFish?.name || "물고기";
  const feedingGuide = getFeedingGuide(fishType, sensorData.status);

  // 현재 선택된 물고기 정보 로드
  const loadCurrentFish = async () => {
    const fish = await getCurrentFish();
    setCurrentFish(fish);
  };

  // 화면 포커스될 때마다 현재 물고기 정보 갱신
  useFocusEffect(
    useCallback(() => {
      loadCurrentFish();
    }, [])
  );

  const normalizeValue = (value: number, min: number, max: number): number => {
    return Math.min(1.0, Math.max(0.0, (value - min) / (max - min)));
  };

  // 물고기 상태 변화 감지 및 알림
  useEffect(() => {
    const checkStatusChange = async () => {
      if (isLoading) return;

      const currentStatus = sensorData.status;
      const prevStatus = prevStatusRef.current;

      if (currentStatus !== prevStatus) {
        let title = "";
        let body = "";

        switch (currentStatus) {
          case "angry":
            title = `🚨 ${fishName}(이)가 화가 났습니다!`;
            body = "수질이 나빠졌습니다. 확인이 필요합니다.";
            break;
          case "worry":
            title = `⚠️ ${fishName}(이)가 걱정하고 있습니다`;
            body = "수질이 조금 불안정해요. 주의가 필요합니다.";
            break;
          case "happy":
            title = `✨ ${fishName}(이)가 행복합니다!`;
            body = "수질이 좋아졌습니다!";
            break;
        }

        await Notifications.scheduleNotificationAsync({
          content: { title, body, sound: true },
          trigger: null,
        });
        prevStatusRef.current = currentStatus;
      }
    };

    checkStatusChange();
  }, [sensorData.status, isLoading, fishName]);

  // 물고기 상태 상세 설명 표시
  const explainFishStatus = () => {
    const { status, temp, ph, tds } = sensorData;
    let title = "";
    let message = "";

    switch (status) {
      case "angry":
        title = `😡 ${fishName}(이)가 화가 났습니다!`;
        message = `수질이 위험 수준입니다.\n(현재: T:${temp.toFixed(
          1
        )}°C, pH:${ph.toFixed(1)}, TDS:${tds}ppm)\n\n즉각적인 확인과 조치가 필요합니다!`;
        break;
      case "worry":
        title = `😟 ${fishName}(이)가 걱정하고 있습니다`;
        message = `수질이 주의 수준입니다.\n(현재: T:${temp.toFixed(
          1
        )}°C, pH:${ph.toFixed(1)}, TDS:${tds}ppm)\n\n환경을 점검해주세요.`;
        break;
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

    switch (sensorData.status) {
      case "angry":
        imageSource = fishAngry;
        statusText = `${fishName}(이)가 화가 난 것 같습니다...`;
        bgColor = "#FFE5E5";
        break;
      case "worry":
        imageSource = fishWorry;
        statusText = `${fishName}(이)가 걱정하고 있습니다.`;
        bgColor = "#FFF8E5";
        break;
      default:
        imageSource = fishHappy;
        statusText = `${fishName}(이)가 기분이 좋아요!`;
        bgColor = "#E5F8FF";
    }

    return (
      <View>
        <Text style={styles.sectionTitle}>오늘의 상태</Text>
        <TouchableOpacity
          style={[styles.statusCard, { backgroundColor: bgColor }]}
          onPress={explainFishStatus}
          activeOpacity={0.7}
        >
          {isLoading && (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color="#4D55FF" />
              <Text style={styles.connectingText}>로딩 중...</Text>
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#4D55FF", "#7B83FF"]}
        style={styles.header}
      >
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

        <View style={styles.feedingSection}>
          <Text style={styles.sectionTitle}>오늘의 먹이 가이드</Text>
          <View style={styles.feedingCard}>
            <View style={styles.feedingRow}>
              <Text style={styles.feedingLabel}>빈도</Text>
              <Text style={styles.feedingValue}>
                {feedingGuide.frequency}
              </Text>
            </View>
            <View style={styles.feedingRow}>
              <Text style={styles.feedingLabel}>양</Text>
              <Text style={styles.feedingValue}>
                {feedingGuide.amount}
              </Text>
            </View>
            <View style={styles.feedingRow}>
              <Text style={styles.feedingLabel}>주의</Text>
              <Text style={styles.feedingValue} numberOfLines={2} ellipsizeMode="tail">
                {feedingGuide.notice}
              </Text>
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
                  Alert.alert("성공", "먹이를 주었습니다! 🍽️");
                } else {
                  Alert.alert("실패", "먹이 주기에 실패했습니다.");
                }
              }}
            />
            <ActionButton
              label="기록"
              imageSource={require("../FinAndFlourish/assets/images/log.png")}
              onPress={() => navigation.navigate("Log")}
              color="#45B7D1"
            />
            <ActionButton
              label="내 물고기들"
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
    fontFamily: "PixelifySans",
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
});
