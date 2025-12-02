// screens/LogScreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { useFocusEffect } from "@react-navigation/native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { RootStackParamList, LogEntry, LogType } from "../types";
import { getAllLogs } from "../services/logService";
import { LineChart } from "react-native-chart-kit";

const Tab = createMaterialTopTabNavigator();

// 이미지 미리 import
const fishAngry = require("../FinAndFlourish/assets/images/fish_angry.png");
const fishWorry = require("../FinAndFlourish/assets/images/fish_worry.png");
const fishHappy = require("../FinAndFlourish/assets/images/fish_happy.png");

type LogScreenProps = StackScreenProps<RootStackParamList, "Log">;
type FilterType = LogType | "all";

const screenWidth = Dimensions.get("window").width;

// ========== 로그 탭 컴포넌트 ==========
function LogsTab() {
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
      setFilteredLogs(logs.filter(log => log.type === 'feed' || log.type === 'auto_feed'));
    } else {
      setFilteredLogs(logs.filter((log) => log.type === activeFilter));
    }
  }, [logs, activeFilter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderItem = ({ item }: { item: LogEntry }) => {
    // 자동급여 로그
    if (item.type === "auto_feed") {
      const executed = item.autoFeedData?.executed ?? false;
      return (
        <View style={styles.logItemContainer}>
          <View style={styles.logHeader}>
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
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
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
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
      if (item.status === 'worry') {
        imgSource = fishWorry;
      } else {
        imgSource = fishHappy;
      }
    }

    return (
      <View style={styles.logItemContainer}>
        <View style={styles.logHeader}>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
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
    <View style={styles.tabContainer}>
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

// ========== 차트 탭 컴포넌트 ==========
function ChartsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedChart, setSelectedChart] = useState<"temp" | "ph" | "tds">("temp");

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

  // 센서 데이터 히스토리 추출 (상태 로그에서)
  const getSensorHistory = () => {
    const statusLogs = logs
      .filter((log) => log.type === "status" && log.sensorData)
      .reverse() // 시간순 정렬
      .slice(-10); // 최근 10개

    const labels = statusLogs.map((log) => {
      const date = new Date(log.date);
      return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
    });

    const tempData = statusLogs.map((log) => log.sensorData?.temp || 0);
    const phData = statusLogs.map((log) => log.sensorData?.ph || 0);
    const tdsData = statusLogs.map((log) => log.sensorData?.tds || 0);

    return { labels, tempData, phData, tdsData };
  };

  const renderChart = () => {
    const { labels, tempData, phData, tdsData } = getSensorHistory();

    // 데이터가 없으면 차트 미표시
    if (labels.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>📊 센서값 추이</Text>
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>센서 데이터가 충분하지 않습니다</Text>
            <Text style={styles.noDataSubText}>상태 로그가 누적되면 차트가 표시됩니다</Text>
          </View>
        </View>
      );
    }

    let chartData: number[];
    let chartTitle: string;
    let chartColor: string;

    switch (selectedChart) {
      case "temp":
        chartData = tempData;
        chartTitle = "🌡️ 온도 (°C)";
        chartColor = "#EF4444";
        break;
      case "ph":
        chartData = phData;
        chartTitle = "⚗️ pH";
        chartColor = "#8B5CF6";
        break;
      case "tds":
        chartData = tdsData;
        chartTitle = "💧 TDS (ppm)";
        chartColor = "#3B82F6";
        break;
    }

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>📊 센서값 추이</Text>

        {/* 차트 타입 선택 버튼 */}
        <View style={styles.chartButtonContainer}>
          <TouchableOpacity
            style={[
              styles.chartButton,
              selectedChart === "temp" && styles.chartButtonActive,
              selectedChart === "temp" && { backgroundColor: "#FEE2E2" },
            ]}
            onPress={() => setSelectedChart("temp")}
          >
            <Text
              style={[
                styles.chartButtonText,
                selectedChart === "temp" && { color: "#EF4444" },
              ]}
            >
              온도
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chartButton,
              selectedChart === "ph" && styles.chartButtonActive,
              selectedChart === "ph" && { backgroundColor: "#EDE9FE" },
            ]}
            onPress={() => setSelectedChart("ph")}
          >
            <Text
              style={[
                styles.chartButtonText,
                selectedChart === "ph" && { color: "#8B5CF6" },
              ]}
            >
              pH
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chartButton,
              selectedChart === "tds" && styles.chartButtonActive,
              selectedChart === "tds" && { backgroundColor: "#DBEAFE" },
            ]}
            onPress={() => setSelectedChart("tds")}
          >
            <Text
              style={[
                styles.chartButtonText,
                selectedChart === "tds" && { color: "#3B82F6" },
              ]}
            >
              TDS
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.chartSubtitle}>{chartTitle}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <LineChart
            data={{
              labels: labels,
              datasets: [
                {
                  data: chartData,
                },
              ],
            }}
            width={Math.max(screenWidth - 40, labels.length * 60)}
            height={200}
            yAxisSuffix=""
            yAxisInterval={1}
            fromZero={false}
            segments={4}
            chartConfig={{
              backgroundColor: "#FFFFFF",
              backgroundGradientFrom: "#FFFFFF",
              backgroundGradientTo: "#F8FAFC",
              decimalPlaces: 1,
              color: () => chartColor,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.6})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "5",
                strokeWidth: "2",
                stroke: chartColor,
              },
              propsForBackgroundLines: {
                strokeDasharray: "",
                stroke: "#E2E8F0",
                strokeWidth: 1,
              },
            }}
            bezier
            style={styles.chart}
          />
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView style={styles.tabContainer}>
      {renderChart()}
    </ScrollView>
  );
}

// ========== 메인 LogScreen 컴포넌트 ==========
export default function LogScreen({ navigation }: LogScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 24, color: "white" }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FIN & FLOURISH</Text>
        <View style={{ width: 24 }} />
      </View>

      <Tab.Navigator
        id={undefined}
        screenOptions={{
          tabBarActiveTintColor: "#4D55FF",
          tabBarInactiveTintColor: "#94A3B8",
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: "SilkscreenBold",
            textTransform: "none",
          },
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: "#E2E8F0",
          },
          tabBarIndicatorStyle: {
            backgroundColor: "#4D55FF",
            height: 3,
          },
        }}
      >
        <Tab.Screen name="로그" component={LogsTab} />
        <Tab.Screen name="차트" component={ChartsTab} />
      </Tab.Navigator>
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
  tabContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
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
    backgroundColor: '#FEFCE8',
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
  // 차트 스타일
  chartContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontFamily: "SilkscreenBold",
    fontSize: 14,
    color: "#1E293B",
    marginBottom: 12,
  },
  chartSubtitle: {
    fontFamily: "PixelifySans",
    fontSize: 11,
    color: "#64748B",
    marginBottom: 12,
    marginTop: 8,
  },
  chartButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  chartButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    minWidth: 70,
    alignItems: "center",
  },
  chartButtonActive: {
    elevation: 2,
  },
  chartButtonText: {
    fontFamily: "SilkscreenRegular",
    fontSize: 10,
    color: "#64748B",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    paddingVertical: 30,
    alignItems: "center",
  },
  noDataText: {
    fontFamily: "PixelifySans",
    fontSize: 11,
    color: "#94A3B8",
    marginBottom: 4,
  },
  noDataSubText: {
    fontFamily: "PixelifySans",
    fontSize: 9,
    color: "#CBD5E1",
  },
});
