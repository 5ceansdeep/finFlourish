// screens/MainScreen.tsx

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StackScreenProps } from "@react-navigation/stack";
import * as Notifications from "expo-notifications";

import { useSensorData, feedFish } from "../services/sensorService";
import { RootStackParamList, FishStatus } from "../types";

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

const { width } = Dimensions.get("window");

type MainScreenProps = StackScreenProps<RootStackParamList, "Main">;

// --- 공통 컴포넌트 정의 ---

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
    <Text style={styles.gaugeValue}>{label}{unit}</Text>
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
// ----------------------------

export default function MainScreen({ navigation }: MainScreenProps) {
  // HTTP로 센서 데이터 가져옴 (1시간마다 갱신)
  const [sensorData, isLoading, error, refetch] = useSensorData();

  // 이전 물고기 상태 저장 (상태 변화 감지용)
  const prevStatusRef = useRef<FishStatus>(sensorData.status);

  // 센서 값을 게이지 비율 (0.0 ~ 1.0)로 변환
  const normalizeValue = (value: number, min: number, max: number): number => {
    return Math.min(1.0, Math.max(0.0, (value - min) / (max - min)));
  };

  // 물고기 상태 변화 감지 및 알림
  useEffect(() => {
    const checkStatusChange = async () => {
      const currentStatus = sensorData.status;
      const prevStatus = prevStatusRef.current;

      // 상태가 변경되었고, 로딩 중이 아닐 때만 알림
      if (currentStatus !== prevStatus && !isLoading) {
        let title = "";
        let body = "";

        switch (currentStatus) {
          case "angry":
            title = "🚨 Goofy가 화났어요!";
            body = "수질이 나빠졌습니다. 확인이 필요합니다.";
            break;
          case "worry":
            title = "⚠️ Goofy가 걱정돼요";
            body = "수질이 조금 불안정해요. 주의가 필요합니다.";
            break;
          case "happy":
            title = "✨ Goofy가 행복해요!";
            body = "수질이 좋아졌습니다!";
            break;
        }

        // 로컬 알림 전송
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: true,
          },
          trigger: null, // 즉시 표시
        });

        // 현재 상태를 이전 상태로 업데이트
        prevStatusRef.current = currentStatus;
      }
    };

    checkStatusChange();
  }, [sensorData.status, isLoading]);

  // 물고기 상태 설명 함수
  const explainFishStatus = () => {
    const { tds, temp, ph, status } = sensorData;

    let title = "";
    let message = "";

    switch (status) {
      case "angry":
        title = "😡 Goofy가 화났어요!";
        message = `수질이 좋지 않아요.\n\n`;
        if (tds > 70) message += `💧 TDS: ${tds}ppm (높음)\n`;
        if (temp < 20 || temp > 28) message += `🌡️ 온도: ${temp.toFixed(1)}°C (부적절)\n`;
        if (ph < 6.5 || ph > 8.0) message += `⚗️ pH: ${ph.toFixed(1)} (부적절)\n`;
        message += `\n수질 개선이 필요합니다!`;
        break;

      case "worry":
        title = "😟 Goofy가 걱정돼요";
        message = `수질이 약간 불안정해요.\n\n`;
        if (tds > 60) message += `💧 TDS: ${tds}ppm (조금 높음)\n`;
        if (temp < 22 || temp > 27) message += `🌡️ 온도: ${temp.toFixed(1)}°C (주의)\n`;
        if (ph < 6.8 || ph > 7.8) message += `⚗️ pH: ${ph.toFixed(1)} (주의)\n`;
        message += `\n조금만 더 신경써주세요.`;
        break;

      case "happy":
      default:
        title = "😊 Goofy가 행복해요!";
        message = `수질이 아주 좋아요!\n\n`;
        message += `💧 TDS: ${tds}ppm ✓\n`;
        message += `🌡️ 온도: ${temp.toFixed(1)}°C ✓\n`;
        message += `⚗️ pH: ${ph.toFixed(1)} ✓\n`;
        message += `\n완벽한 환경입니다!`;
    }

    Alert.alert(title, message, [{ text: "확인", style: "default" }]);
  };

  // 물고기 상태에 따른 이미지 및 텍스트 렌더링
  const renderFishStatus = () => {
    let imageSource;
    let text: string;
    let bgColor: string;

    switch (sensorData.status) {
      case "angry":
        imageSource = fishAngry;
        text = "Goofy가 화가 난 것 같습니다...";
        bgColor = "#FFE5E5";
        break;
      case "worry":
        imageSource = fishWorry;
        text = "Goofy가 고민 중이에요.";
        bgColor = "#FFF8E5";
        break;
      case "happy":
      default:
        imageSource = fishHappy;
        text = "Goofy가 기분이 좋아요!";
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
            <Text style={styles.statusText}>{text}</Text>
            <Text style={styles.tapHint}>탭하여 자세히 보기</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <LinearGradient
        colors={["#4D55FF", "#7B83FF"] as const}
        style={styles.header}
      >
        <Image source={logoImage} style={styles.logo} />
        <Text style={styles.headerTitle}>FIN & FLOURISH</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 인사말 */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>안녕하세요!</Text>
          <Text style={styles.subGreeting}>오늘 Goofy의 상태를 확인해보세요</Text>
        </View>

        {/* 물고기 상태 카드 */}
        {renderFishStatus()}

        {/* 센서 데이터 섹션 */}
        <View style={styles.sensorSection}>
          <Text style={styles.sectionTitle}>수질 현황</Text>
          <View style={styles.gaugeRow}>
            <Gauge
              title="TDS"
              label={`${sensorData.tds}`}
              unit=" ppm"
              colors={["#FFD93D", "#FF8C00"] as const}
              value={normalizeValue(sensorData.tds, 0, 100)}
            />
            <Gauge
              title="TEMP"
              label={`${sensorData.temp.toFixed(1)}`}
              unit="°C"
              colors={["#6BCB77", "#4CAF50"] as const}
              value={normalizeValue(sensorData.temp, 15, 30)}
            />
            <Gauge
              title="pH"
              label={`${sensorData.ph.toFixed(1)}`}
              colors={["#4D96FF", "#3B82F6"] as const}
              value={normalizeValue(sensorData.ph, 6.0, 9.0)}
            />
          </View>
        </View>

        {/* 액션 버튼 */}
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
                  // TODO: 실제 앱에서는 로그를 서버나 로컬 스토리지에 저장
                } else {
                  Alert.alert("실패", "먹이 주기에 실패했습니다.");
                }
              }}
            />
            <ActionButton 
              label="Camera"
              imageSource={require("../FinAndFlourish/assets/images/camera.png")}
              color="#4ECDC4"
            />
            <ActionButton
              label="Log"
              imageSource={require("../FinAndFlourish/assets/images/log.png")}
              onPress={() => navigation.navigate("Log")}
              color="#45B7D1"
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
    fontFamily: "PressStart2P_400Regular",
    color: "white",
    fontSize: 14,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  greetingContainer: {
    marginBottom: 20,
  },
  greetingText: {
    fontFamily: "PressStart2P_400Regular",
    fontSize: 16,
    color: "#1E293B",
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: "#64748B",
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
    fontFamily: "PressStart2P_400Regular",
    fontSize: 13,
    color: "#1E293B",
    lineHeight: 20,
    marginBottom: 6,
  },
  tapHint: {
    fontFamily: "PixelifySans",
    fontSize: 10,
    color: "#64748B",
    marginTop: 8,
    textDecorationLine: "underline",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderRadius: 20,
  },
  connectingText: {
    marginTop: 12,
    fontFamily: "PressStart2P_400Regular",
    fontSize: 10,
    color: "#4D55FF",
  },
  sensorSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 16,
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
    fontFamily: "PressStart2P_400Regular",
    fontSize: 8,
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
    fontFamily: "PressStart2P_400Regular",
    fontSize: 9,
    color: "#1E293B",
    marginTop: 10,
  },
  actionSection: {
    marginBottom: 20,
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    alignItems: "center",
    flex: 1,
  },
  iconBox: {
    width: 70,
    height: 70,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionIcon: {
    marginTop: 30,
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  actionText: {
    fontFamily: "PressStart2P_400Regular",
    marginTop: 30,
    fontSize: 13,
    color: "#1E293B",
    textAlign: "center",
  },
});
