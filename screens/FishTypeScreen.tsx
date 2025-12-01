// screens/FishTypeScreen.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList, FishType } from "../types";

type FishTypeScreenProps = StackScreenProps<RootStackParamList, "FishType">;

interface FishOption {
  type: FishType;
  name: string;
  emoji: string;
  description: string;
}

const FISH_OPTIONS: FishOption[] = [
  {
    type: "betta",
    name: "베타",
    emoji: "🐟",
    description: "화려한 지느러미의 투사",
  },
  {
    type: "goldfish",
    name: "금붕어",
    emoji: "🐠",
    description: "고전적이고 사랑스러운 친구",
  },
  {
    type: "guppy",
    name: "구피",
    emoji: "🐡",
    description: "작고 활발한 열대어",
  },
];

export default function FishTypeScreen({ navigation, route }: FishTypeScreenProps) {
  const { fishName } = route.params;
  const [selectedType, setSelectedType] = useState<FishType | null>(null);

  const handleConfirm = () => {
    if (selectedType) {
      // 상세 정보 입력 화면으로 이동
      navigation.navigate("FishDetail", {
        fishName,
        fishType: selectedType,
      });
    } else {
      Alert.alert("선택 필요", "물고기 종류를 선택해주세요.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* 헤더 */}
        <Text style={styles.titleText}>물고기 종류를 선택하세요</Text>
        <Text style={styles.subtitleText}>{fishName}의 종류는?</Text>

        {/* 물고기 선택 옵션 */}
        <View style={styles.optionsContainer}>
          {FISH_OPTIONS.map((fish) => (
            <TouchableOpacity
              key={fish.type}
              style={[
                styles.optionCard,
                selectedType === fish.type && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedType(fish.type)}
              activeOpacity={0.7}
            >
              <Text style={styles.fishEmoji}>{fish.emoji}</Text>
              <Text style={styles.fishName}>{fish.name}</Text>
              <Text style={styles.fishDescription}>{fish.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 확인 버튼 */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            !selectedType && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!selectedType}
        >
          <Text style={styles.confirmButtonText}>확인</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  titleText: {
    fontFamily: "SilkscreenBold",
    fontSize: 20,
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleText: {
    fontFamily: "PixelifySans",
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 40,
  },
  optionsContainer: {
    flex: 1,
    gap: 16,
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 3,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  optionCardSelected: {
    borderColor: "#4D55FF",
    backgroundColor: "#EEF0FF",
  },
  fishEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  fishName: {
    fontFamily: "SilkscreenBold",
    fontSize: 18,
    color: "#1E293B",
    marginBottom: 4,
  },
  fishDescription: {
    fontFamily: "PixelifySans",
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },
  confirmButton: {
    backgroundColor: "#4D55FF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  confirmButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  confirmButtonText: {
    fontFamily: "SilkscreenBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
});
