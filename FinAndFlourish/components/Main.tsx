import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";

// 커스텀 폰트 정의
export const CustomFonts = {
  SilkscreenRegular: "Silkscreen-Regular",
  SilkscreenBold: "Silkscreen-Bold",
  PixelifySans: "PixelifySans",
};

// Mock Data - API 연결 전 테스트용 데이터
const MOCK_DATA = {
  // 물고기 정보
  fish: {
    name: "Goofy",
    mood: "good", // "good" | "soso" | "bad"
    statusMessage: "기분이 좋습니다!",
  },
  // 센서 데이터
  sensors: {
    tds: {
      value: 17,
      unit: "ppm",
    },
    temperature: {
      value: 17,
      unit: "°C",
    },
    ph: {
      value: 8,
      unit: "",
    },
  },
  // 장치 상태
  devices: {
    light: true,
    heater: true,
    oxygen: true,
  },
  // 알림
  notifications: {
    hasUnread: true,
    count: 3,
  },
};

// 물고기 상태에 따른 이미지 매핑
const getFishImage = (mood: string) => {
  switch (mood) {
    case "good":
      return require("@/assets/images/good.png");
    case "soso":
      return require("@/assets/images/soso.png");
    case "bad":
      return require("@/assets/images/bad.png");
    default:
      return require("@/assets/images/good.png");
  }
};

const AquariumDashboard = () => {
  const [fontsLoaded] = useFonts({
    [CustomFonts.SilkscreenRegular]: require("@/assets/fonts/Silkscreen-Regular.ttf"),
    [CustomFonts.SilkscreenBold]: require("@/assets/fonts/Silkscreen-Bold.ttf"),
    [CustomFonts.PixelifySans]: require("@/assets/fonts/PixelifySans-VariableFont_wght.ttf"),
  });

  const [isLightOn, setIsLightOn] = useState(MOCK_DATA.devices.light);
  const [isHeaterOn, setIsHeaterOn] = useState(MOCK_DATA.devices.heater);
  const [feedCountdown, setFeedCountdown] = useState(0);
  const feedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (feedCountdown > 0) {
      feedTimerRef.current = setTimeout(() => {
        setFeedCountdown(feedCountdown - 1);
      }, 1000);
    }
    return () => {
      if (feedTimerRef.current) {
        clearTimeout(feedTimerRef.current);
      }
    };
  }, [feedCountdown]);

  const handleFeed = () => {
    if (feedCountdown === 0) {
      setFeedCountdown(60);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4169E1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <LinearGradient colors={["#4343FF", "#4343FF"]} style={styles.header}>
          <Text style={styles.headerTitle}>FIN & FLOURISH</Text>
          <View style={styles.notificationBadge}>
            <Image
              source={require("@/assets/images/Letter.png")}
              style={styles.mailIcon}
            />
            {MOCK_DATA.notifications.hasUnread && <View style={styles.redDot} />}
          </View>
        </LinearGradient>

        {/* Fish Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>How is your Friend today?</Text>
          <View style={styles.fishStatusBox}>
            <Image
              source={getFishImage(MOCK_DATA.fish.mood)}
              style={styles.fishIcon}
            />
            <Text style={styles.statusText}>
              {MOCK_DATA.fish.name} (이)가 {MOCK_DATA.fish.statusMessage}
            </Text>
          </View>
        </View>

        {/* Control Buttons Grid */}
        <View style={styles.controlGrid}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleFeed}
            disabled={feedCountdown > 0}
          >
            <View style={[styles.iconBox, feedCountdown > 0 && styles.iconBoxDisabled]}>
              {feedCountdown > 0 ? (
                <Text style={styles.countdownText}>{feedCountdown}</Text>
              ) : (
                <Image
                  source={require("@/assets/images/feed.png")}
                  style={styles.iconImage}
                />
              )}
            </View>
            <Text style={styles.controlLabel}>FEED THEM</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setIsLightOn(!isLightOn)}
          >
            <View style={styles.iconBox}>
              <Image
                source={isLightOn
                  ? require("@/assets/images/light_on.png")
                  : require("@/assets/images/light_off.png")
                }
                style={styles.iconImage}
              />
            </View>
            <Text style={styles.controlLabel}>{isLightOn ? "LIGHT ON" : "LIGHT OFF"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <View style={styles.iconBox}>
              <Image
                source={require("@/assets/images/oxygen.png")}
                style={styles.iconImage}
              />
            </View>
            <Text style={styles.controlLabel}>OXYGEN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setIsHeaterOn(!isHeaterOn)}
          >
            <View style={styles.iconBox}>
              <Image
                source={isHeaterOn
                  ? require("@/assets/images/heater.png")
                  : require("@/assets/images/heater_off.png")
                }
                style={styles.iconImage}
              />
            </View>
            <Text style={styles.controlLabel}>{isHeaterOn ? "HEATER ON" : "HEATER OFF"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <View style={styles.iconBox}>
              <Image
                source={require("@/assets/images/camera.png")}
                style={styles.iconImage}
              />
            </View>
            <Text style={styles.controlLabel}>CAMERA</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <View style={styles.iconBox}>
              <Image
                source={require("@/assets/images/log.png")}
                style={styles.iconImage}
              />
            </View>
            <Text style={styles.controlLabel}>LOG</Text>
          </TouchableOpacity>
        </View>

        {/* Sensor Data */}
        <View style={styles.sensorContainer}>
          {/* TDS */}
          <View style={styles.sensorCard}>
            <Text style={styles.sensorLabel}>TDS</Text>
            <Text style={styles.sensorValue}>
              {MOCK_DATA.sensors.tds.value} {MOCK_DATA.sensors.tds.unit}
            </Text>
            <LinearGradient
              colors={["#FFD700", "#8B4513"]}
              style={styles.sensorBar}
            >
              <View style={styles.indicator} />
            </LinearGradient>
          </View>

          {/* Temperature */}
          <View style={styles.sensorCard}>
            <Text style={[styles.sensorLabel]}>TEMP</Text>
            <Text style={styles.sensorValue}>
              {MOCK_DATA.sensors.temperature.value}
              {MOCK_DATA.sensors.temperature.unit}
            </Text>
            <LinearGradient
              colors={["#FF0000", "#0000FF"]}
              style={styles.sensorBar}
            >
              <View style={styles.indicator} />
            </LinearGradient>
          </View>

          {/* pH */}
          <View style={styles.sensorCard}>
            <Text style={styles.sensorLabel}>PH</Text>
            <Text style={styles.sensorValue}>
              {MOCK_DATA.sensors.ph.value}
              {MOCK_DATA.sensors.ph.unit}
            </Text>
            <LinearGradient
              colors={["#00FF00", "#0000FF"]}
              style={styles.sensorBar}
            >
              <View style={styles.indicator} />
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontFamily: "Silkscreen-Bold",
    fontSize: 24,
    color: "#FFFFFF",
    letterSpacing: 2,
  },
  notificationBadge: {
    position: "relative",
  },
  mailIcon: {
    width: 32,
    height: 32,
  },
  redDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    backgroundColor: "#FF0000",
    borderRadius: 6,
  },
  statusCard: {
    margin: 20,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusTitle: {
    fontSize: 18,
    fontFamily: "PixelifySans",
    fontWeight: "bold",
    marginBottom: 16,
    color: "#000000",
  },
  fishStatusBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F3FF",
    padding: 16,
    borderRadius: 10,
  },
  fishIcon: {
    width: 48,
    height: 48,
    marginRight: 16,
  },
  statusText: {
    fontFamily: "PixelifySans",
    fontSize: 16,
    color: "#333333",
    flex: 1,
  },
  controlGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  controlButton: {
    width: "30%",
    margin: "1.66%",
    alignItems: "center",
  },
  iconBox: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  iconBoxDisabled: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  countdownText: {
    fontFamily: "PixelifySans",
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  iconImage: {
    width: 100,
    height: 100,
  },
  controlLabel: {
    fontFamily: "Silkscreen-Bold",
    fontSize: 15,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
  },
  sensorContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sensorCard: {
    flex: 1,
    marginTop: 20,
    marginHorizontal: 8,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sensorLabel: {
    fontFamily: "Silkscreen-Bold",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000000",
  },
  sensorValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#000000",
  },
  sensorBar: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    justifyContent: "flex-end",
    padding: 4,
  },
  indicator: {
    width: 16,
    height: 16,
    backgroundColor: "#000000",
    alignSelf: "flex-end",
    marginBottom: 8,
    marginRight: 4,
    transform: [{ rotate: "45deg" }],
  },
});

export default AquariumDashboard;
