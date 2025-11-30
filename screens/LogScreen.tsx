// screens/LogScreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { useFocusEffect } from "@react-navigation/native";

import { RootStackParamList, LogEntry } from "../types";
import { getAllLogs } from "../services/logService";

// 이미지 미리 import
const fishAngry = require("../FinAndFlourish/assets/images/fish_angry.png");
const fishWorry = require("../FinAndFlourish/assets/images/fish_worry.png");
const fishHappy = require("../FinAndFlourish/assets/images/fish_happy.png");

type LogScreenProps = StackScreenProps<RootStackParamList, "Log">;

// 더미 로그 데이터
const LOG_DATA: LogEntry[] = [
  {
    id: "1",
    date: "2025/01/27 14:30",
    type: "feed",
    message: "먹이 급여 완료!",
  },
  {
    id: "2",
    date: "2025/01/27 12:15",
    type: "status",
    status: "angry",
    message: "Goofy가 화가 난 것 같습니다...",
  },
  {
    id: "3",
    date: "2025/01/27 10:20",
    type: "feed",
    message: "먹이 급여 완료!",
  },
  {
    id: "4",
    date: "2025/01/27 09:45",
    type: "status",
    status: "worry",
    message: "Goofy가 고민중입니다.",
  },
  {
    id: "5",
    date: "2025/01/26 18:00",
    type: "feed",
    message: "먹이 급여 완료!",
  },
  {
    id: "6",
    date: "2025/01/26 15:30",
    type: "status",
    status: "happy",
    message: "Goofy가 기분이 좋습니다!",
  },
  {
    id: "7",
    date: "2025/01/26 12:00",
    type: "feed",
    message: "먹이 급여 완료!",
  },
  {
    id: "8",
    date: "2025/01/26 10:00",
    type: "status",
    status: "angry",
    message: "온도 급변으로 인해 스트레스를 받았습니다.",
  },
];

export default function LogScreen({ navigation }: LogScreenProps) {
  const [logs, setLogs] = useState<LogEntry[]>(LOG_DATA);

  // 화면 포커스될 때마다 로그 새로고침
  useFocusEffect(
    React.useCallback(() => {
      const loadLogs = async () => {
        const savedLogs = await getAllLogs();
        if (savedLogs.length > 0) {
          setLogs(savedLogs);
        }
      };
      loadLogs();
    }, [])
  );

  const renderItem = ({ item }: { item: LogEntry }) => {
    // 자동급여 로그
    if (item.type === "auto_feed") {
      const executed = item.autoFeedData?.executed ?? false;
      return (
        <View style={styles.logItemContainer}>
          <View style={styles.logHeader}>
            <Text style={styles.dateText}>{item.date}</Text>
            <View style={[
              styles.logTypeBadge,
              executed ? styles.badgeAutoSuccess : styles.badgeAutoSkipped
            ]}>
              <Text style={styles.badgeText}>
                {executed ? "자동 급여" : "급여 중단"}
              </Text>
            </View>
          </View>
          <View style={[
            styles.logCard,
            styles.autoFeedCard,
            executed ? styles.autoFeedSuccess : styles.autoFeedSkipped
          ]}>
            <Text style={styles.autoFeedIcon}>
              {executed ? "🤖✅" : "🤖❌"}
            </Text>
            <View style={styles.autoFeedTextContainer}>
              <Text style={styles.logText}>{item.message}</Text>
              {item.autoFeedData && (
                <Text style={styles.autoFeedMode}>
                  모드: {item.autoFeedData.mode}
                </Text>
              )}
            </View>
          </View>
        </View>
      );
    }

    // 먹이 주기 로그 (수동)
    if (item.type === "feed") {
      return (
        <View style={styles.logItemContainer}>
          <View style={styles.logHeader}>
            <Text style={styles.dateText}>{item.date}</Text>
            <View style={styles.logTypeBadge}>
              <Text style={styles.badgeText}>수동 급여</Text>
            </View>
          </View>
          <View style={[styles.logCard, styles.feedCard]}>
            <Text style={styles.feedIcon}>🍽️</Text>
            <Text style={styles.logText}>{item.message}</Text>
          </View>
        </View>
      );
    }

    // 상태 로그
    let imgSource;
    let statusBadgeStyle;
    let statusBadgeText;

    switch (item.status) {
      case "angry":
        imgSource = fishAngry;
        statusBadgeStyle = styles.badgeAngry;
        statusBadgeText = "화남";
        break;
      case "worry":
        imgSource = fishWorry;
        statusBadgeStyle = styles.badgeWorry;
        statusBadgeText = "걱정";
        break;
      case "happy":
      default:
        imgSource = fishHappy;
        statusBadgeStyle = styles.badgeHappy;
        statusBadgeText = "행복";
    }

    return (
      <View style={styles.logItemContainer}>
        <View style={styles.logHeader}>
          <Text style={styles.dateText}>{item.date}</Text>
          <View style={[styles.logTypeBadge, statusBadgeStyle]}>
            <Text style={styles.badgeText}>{statusBadgeText}</Text>
          </View>
        </View>
        <View style={styles.logCard}>
          <Image source={imgSource} style={styles.fishImage} />
          <Text style={styles.logText}>{item.message}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 24, color: "white" }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FIN & FLOURISH</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={logs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    height: 100,
    backgroundColor: "#4D55FF",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontFamily: "PressStart2P_400Regular",
    color: "white",
    fontSize: 18,
  },
  listContent: { padding: 20 },
  logItemContainer: { marginBottom: 20 },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dateText: {
    fontFamily: "PressStart2P_400Regular",
    fontSize: 10,
    color: "#888",
  },
  logTypeBadge: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: "PressStart2P_400Regular",
    fontSize: 8,
    color: "#4338CA",
  },
  badgeAutoSuccess: {
    backgroundColor: "#D1FAE5",
  },
  badgeAutoSkipped: {
    backgroundColor: "#FEF3C7",
  },
  badgeHappy: {
    backgroundColor: "#DBEAFE",
  },
  badgeWorry: {
    backgroundColor: "#FEF3C7",
  },
  badgeAngry: {
    backgroundColor: "#FEE2E2",
  },
  logCard: {
    backgroundColor: "#EAF8FC",
    borderRadius: 15,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  feedCard: {
    backgroundColor: "#FFF4E5",
  },
  feedIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  autoFeedCard: {
    backgroundColor: "#F0F9FF",
  },
  autoFeedSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  autoFeedSkipped: {
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  autoFeedIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  autoFeedTextContainer: {
    flex: 1,
  },
  autoFeedMode: {
    fontFamily: "PressStart2P_400Regular",
    fontSize: 8,
    color: "#64748B",
    marginTop: 6,
  },
  fishImage: { width: 40, height: 40, resizeMode: "contain", marginRight: 15 },
  logText: {
    fontFamily: "PressStart2P_400Regular",
    fontSize: 10,
    flex: 1,
    lineHeight: 16,
  },
});
