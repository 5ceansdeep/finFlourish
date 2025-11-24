// screens/LogScreen.tsx

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";

import { RootStackParamList, LogEntry } from "../types";

// 이미지 미리 import
const fishAngry = require("../FinAndFlourish/assets/images/fish_angry.png");
const fishWorry = require("../FinAndFlourish/assets/images/fish_worry.png");
const fishHappy = require("../FinAndFlourish/assets/images/fish_happy.png");

type LogScreenProps = StackScreenProps<RootStackParamList, "Log">;

// 더미 로그 데이터
const LOG_DATA: LogEntry[] = [
  {
    id: "1",
    date: "2025/01/27",
    status: "angry",
    message: "Bufr<이>가 화가 난 것 같습니다...",
  },
  {
    id: "2",
    date: "2025/01/27",
    status: "worry",
    message: "Bufr<이>가 고민중입니다.",
  },
  {
    id: "3",
    date: "2025/01/27",
    status: "happy",
    message: "Bufr<이>가 기분이 좋습니다!",
  },
  {
    id: "4",
    date: "2025/01/27",
    status: "worry",
    message: "Bufr<이>가 고민중입니다.",
  },
  {
    id: "5",
    date: "2025/01/26",
    status: "angry",
    message: "온도 급변으로 인해 스트레스를 받았습니다.",
  },
  {
    id: "6",
    date: "2025/01/26",
    status: "happy",
    message: "센서 점검 결과 양호한 상태입니다.",
  },
];

export default function LogScreen({ navigation }: LogScreenProps) {
  const renderItem = ({ item }: { item: LogEntry }) => {
    let imgSource;
    switch (item.status) {
      case "angry":
        imgSource = fishAngry;
        break;
      case "worry":
        imgSource = fishWorry;
        break;
      case "happy":
      default:
        imgSource = fishHappy;
    }

    return (
      <View style={styles.logItemContainer}>
        <Text style={styles.dateText}>{item.date}</Text>
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
        data={LOG_DATA}
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
  dateText: {
    fontFamily: "PressStart2P_400Regular",
    fontSize: 10,
    color: "#888",
    marginBottom: 5,
  },
  logCard: {
    backgroundColor: "#EAF8FC",
    borderRadius: 15,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  fishImage: { width: 40, height: 40, resizeMode: "contain", marginRight: 15 },
  logText: {
    fontFamily: "PressStart2P_400Regular",
    fontSize: 10,
    flex: 1,
    lineHeight: 16,
  },
});
