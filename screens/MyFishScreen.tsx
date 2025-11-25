// screens/MyFishScreen.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

import { RootStackParamList, Fish } from "../types";
import {
  getAllFish,
  getCurrentFishId,
  setCurrentFish,
  deleteFish,
} from "../services/fishStorage";

type MyFishScreenProps = StackScreenProps<RootStackParamList, "MyFish">;

const FISH_TYPE_EMOJI: Record<string, string> = {
  betta: "🐟",
  goldfish: "🐠",
  guppy: "🐡",
};

const FISH_TYPE_NAME: Record<string, string> = {
  betta: "베타",
  goldfish: "금붕어",
  guppy: "구피",
};

export default function MyFishScreen({ navigation }: MyFishScreenProps) {
  const [fishList, setFishList] = useState<Fish[]>([]);
  const [currentFishId, setCurrentFishId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadFishData = async () => {
    setIsLoading(true);
    const fish = await getAllFish();
    const currentId = await getCurrentFishId();
    setFishList(fish);
    setCurrentFishId(currentId);
    setIsLoading(false);
  };

  // 화면 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      loadFishData();
    }, [])
  );

  const handleSelectFish = async (fishId: string) => {
    await setCurrentFish(fishId);
    setCurrentFishId(fishId);
    Alert.alert("변경 완료", "메인 화면의 물고기가 변경되었습니다!", [
      {
        text: "확인",
        onPress: () => navigation.navigate("Main"),
      },
    ]);
  };

  const handleDeleteFish = (fish: Fish) => {
    Alert.alert(
      "물고기 삭제",
      `${fish.name}를 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            await deleteFish(fish.id);
            loadFishData();
          },
        },
      ]
    );
  };

  const renderFishItem = ({ item }: { item: Fish }) => {
    const isSelected = item.id === currentFishId;

    return (
      <TouchableOpacity
        style={[styles.fishCard, isSelected && styles.fishCardSelected]}
        onPress={() => handleSelectFish(item.id)}
        onLongPress={() => handleDeleteFish(item)}
      >
        <View style={styles.fishCardContent}>
          <Text style={styles.fishEmoji}>
            {FISH_TYPE_EMOJI[item.type]}
          </Text>
          <View style={styles.fishInfo}>
            <Text style={styles.fishName}>{item.name}</Text>
            <Text style={styles.fishType}>{FISH_TYPE_NAME[item.type]}</Text>
          </View>
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>현재</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <LinearGradient
        colors={["#4D55FF", "#7B83FF"] as const}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>내 물고기들</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("FishName")}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* 물고기 목록 */}
      {fishList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🐟</Text>
          <Text style={styles.emptyText}>등록된 물고기가 없습니다</Text>
          <TouchableOpacity
            style={styles.addFishButton}
            onPress={() => navigation.navigate("FishName")}
          >
            <Text style={styles.addFishButtonText}>물고기 추가하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={fishList}
          renderItem={renderFishItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
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
    justifyContent: "space-between",
  },
  backButton: {
    fontSize: 28,
    color: "white",
    width: 40,
  },
  headerTitle: {
    fontFamily: "SilkscreenBold",
    color: "white",
    fontSize: 16,
    flex: 1,
    textAlign: "center",
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    fontSize: 24,
    color: "white",
  },
  listContent: {
    padding: 20,
  },
  fishCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  fishCardSelected: {
    borderColor: "#4D55FF",
    backgroundColor: "#EEF0FF",
  },
  fishCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  fishEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  fishInfo: {
    flex: 1,
  },
  fishName: {
    fontFamily: "SilkscreenBold",
    fontSize: 16,
    color: "#1E293B",
    marginBottom: 4,
  },
  fishType: {
    fontFamily: "PixelifySans",
    fontSize: 12,
    color: "#64748B",
  },
  selectedBadge: {
    backgroundColor: "#4D55FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  selectedBadgeText: {
    fontFamily: "SilkscreenBold",
    fontSize: 10,
    color: "#FFFFFF",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontFamily: "PixelifySans",
    fontSize: 14,
    color: "#64748B",
    marginBottom: 30,
  },
  addFishButton: {
    backgroundColor: "#4D55FF",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addFishButtonText: {
    fontFamily: "SilkscreenBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
});
