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
import { RootStackParamList, LogEntry, LogType } from "../types";
import { addLog, getAllLogs } from "../services/logService";

// 이미지 미리 import
const fishAngry = require("../FinAndFlourish/assets/images/fish_angry.png");
const fishWorry = require("../FinAndFlourish/assets/images/fish_worry.png");
const fishHappy = require("../FinAndFlourish/assets/images/fish_happy.png");

type LogScreenProps = StackScreenProps<RootStackParamList, "Log">;

type FilterType = LogType | "all";

export default function LogScreen({ navigation }: LogScreenProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // 화면 포커스될 때마다 로그 새로고침
  useFocusEffect(
    React.useCallback(() => {
      const loadLogs = async () => {
        const savedLogs = await getAllLogs();
        setLogs(savedLogs);
      };
      loadLogs();
    }, [])
  );

  // 필터링 로직
  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredLogs(logs);
    } else if (activeFilter === "feed") {
      // '급여' 필터는 'feed'와 'auto_feed'를 모두 포함
      setFilteredLogs(logs.filter(log => log.type === 'feed' || log.type === 'auto_feed'));
    } else {
      setFilteredLogs(logs.filter((log) => log.type === activeFilter));
    }
  }, [logs, activeFilter]);

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

    // 상태 및 스트레스 로그
    let imgSource;
    let statusBadgeStyle;
    let statusBadgeText;

    switch (item.status) {
      case "angry":
        imgSource = fishAngry;
        statusBadgeStyle = styles.badgeAngry;
        statusBadgeText = "상태: 화남";
        break;
      case "worry":
        imgSource = fishWorry;
        statusBadgeStyle = styles.badgeWorry;
        statusBadgeText = "상태: 걱정";
        break;
      case "happy":
      default:
        imgSource = fishHappy;
        statusBadgeStyle = styles.badgeHappy;
        statusBadgeText = "상태: 행복";
    }

    if (item.type === 'stress') {
      statusBadgeStyle = styles.badgeStress;
      statusBadgeText = "스트레스 관리";
      // 스트레스 시작(worry)과 종료(happy)에 따라 다른 이미지 표시
      if (item.status === 'worry') {
        imgSource = fishWorry;
      } else {
        imgSource = fishHappy;
      }
    }

    return (
      <View style={styles.logItemContainer}>
        <View style={styles.logHeader}>
          <Text style={styles.dateText}>{item.date}</Text>
          <View style={[styles.logTypeBadge, statusBadgeStyle]}>
            <Text style={[styles.badgeText, item.type === 'stress' && styles.badgeStressText]}>{statusBadgeText}</Text>
          </View>
        </View>
        <View style={styles.logCard}>
          <Image source={imgSource} style={styles.fishImage} />
          <Text style={styles.logText}>{item.message}</Text>
        </View>
      </View>
    );
  };

  const renderFilterBar = () => {
    const filters: { label: string; type: FilterType }[] = [
      { label: "전체", type: "all" },
      { label: "상태", type: "status" },
      { label: "급여", type: "feed" },
      { label: "스트레스", type: "stress" },
    ];

    return (
      <View style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.type}
            style={[
              styles.filterButton,
              activeFilter === filter.type && styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter(filter.type)}
          >
            <Text
              style={[
                styles.filterButtonText,
                activeFilter === filter.type && styles.filterButtonTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
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

      {renderFilterBar()}

      <FlatList
        data={filteredLogs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    height: 100,
    backgroundColor: "#4D55FF",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerTitle: {
    fontFamily: "SilkscreenBold",
    color: "white",
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
  },
  filterButtonActive: {
    backgroundColor: "#4D55FF",
  },
  filterButtonText: {
    fontFamily: "SilkscreenBold",
    fontSize: 12,
    color: "#475569",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  logItemContainer: { marginBottom: 20 },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dateText: {
    fontFamily: "PixelifySans",
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
    fontFamily: "SilkscreenRegular",
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
  badgeStress: {
    backgroundColor: '#FEFCE8', // Light yellow
    borderColor: '#EAB308',
    borderWidth: 1,
  },
  badgeStressText: {
    color: '#A16207',
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
    fontFamily: "PixelifySans",
    fontSize: 8,
    color: "#64748B",
    marginTop: 6,
  },
  fishImage: { width: 40, height: 40, resizeMode: "contain", marginRight: 15 },
  logText: {
    fontFamily: "PixelifySans",
    fontSize: 10,
    flex: 1,
    lineHeight: 18,
  },
});
