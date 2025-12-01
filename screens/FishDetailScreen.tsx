// screens/FishDetailScreen.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList, LifeStage } from "../types";
import { addFish } from "../services/fishStorage";

type FishDetailScreenProps = StackScreenProps<RootStackParamList, "FishDetail">;

export default function FishDetailScreen({ navigation, route }: FishDetailScreenProps) {
  const { fishName, fishType } = route.params;

  // 기본값 설정
  const [lifeStage, setLifeStage] = useState<LifeStage>("adult");
  const [count, setCount] = useState("1");
  const [weight, setWeight] = useState("");
  const [tankVolume, setTankVolume] = useState("");

  // 어종별 기본 체중 (g)
  const getDefaultWeight = () => {
    switch (fishType) {
      case "betta":
        return "3";
      case "goldfish":
        return "50";
      case "guppy":
        return "1";
      default:
        return "3";
    }
  };

  const handleSkip = async () => {
    try {
      // 기본값으로 저장
      await addFish(fishName, fishType);

      Alert.alert(
        "완료!",
        `${fishName}이(가) 추가되었습니다!`,
        [
          {
            text: "확인",
            onPress: () => navigation.navigate("Main"),
          },
        ]
      );
    } catch (error) {
      Alert.alert("오류", "물고기 추가에 실패했습니다.");
    }
  };

  const handleConfirm = async () => {
    try {
      // 입력값 검증
      const fishCount = parseInt(count) || 1;
      const fishWeight = parseFloat(weight) || parseFloat(getDefaultWeight());
      const tank_Volume = parseFloat(tankVolume) || 10;

      if (fishCount <= 0) {
        Alert.alert("입력 오류", "개체수는 1 이상이어야 합니다.");
        return;
      }

      if (fishWeight <= 0) {
        Alert.alert("입력 오류", "평균 체중은 0보다 커야 합니다.");
        return;
      }

      if (tank_Volume <= 0) {
        Alert.alert("입력 오류", "수조 용량은 0보다 커야 합니다.");
        return;
      }

      // 상세 정보와 함께 저장
      await addFish(fishName, fishType, lifeStage, fishWeight, fishCount, tank_Volume);

      Alert.alert(
        "완료!",
        `${fishName}이(가) 추가되었습니다!\n\n개체수: ${fishCount}마리\n평균 체중: ${fishWeight}g\n수조 용량: ${tank_Volume}L`,
        [
          {
            text: "확인",
            onPress: () => navigation.navigate("Main"),
          },
        ]
      );
    } catch (error) {
      Alert.alert("오류", "물고기 추가에 실패했습니다.");
    }
  };

  const fishDisplayName = fishType === "betta" ? "베타" : fishType === "goldfish" ? "금붕어" : "구피";

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <Text style={styles.titleText}>상세 정보 입력</Text>
        <Text style={styles.subtitleText}>
          {fishName} ({fishDisplayName})의 추가 정보를 입력해주세요
        </Text>
        <Text style={styles.hintText}>※ 건너뛰기를 누르면 기본값으로 저장됩니다</Text>

        {/* 생애 단계 선택 */}
        <View style={styles.section}>
          <Text style={styles.label}>생애 단계</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                lifeStage === "juvenile" && styles.optionButtonSelected,
              ]}
              onPress={() => setLifeStage("juvenile")}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  lifeStage === "juvenile" && styles.optionButtonTextSelected,
                ]}
              >
                치어
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                lifeStage === "adult" && styles.optionButtonSelected,
              ]}
              onPress={() => setLifeStage("adult")}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  lifeStage === "adult" && styles.optionButtonTextSelected,
                ]}
              >
                성어
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 개체수 */}
        <View style={styles.section}>
          <Text style={styles.label}>개체수 (마리)</Text>
          <TextInput
            style={styles.input}
            value={count}
            onChangeText={setCount}
            keyboardType="numeric"
            placeholder="기본값: 1"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* 평균 체중 */}
        <View style={styles.section}>
          <Text style={styles.label}>개체당 평균 체중 (g)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder={`기본값: ${getDefaultWeight()}g`}
            placeholderTextColor="#94A3B8"
          />
          <Text style={styles.helpText}>
            {fishType === "betta" && "일반 베타 성어: 약 3g"}
            {fishType === "goldfish" && "일반 금붕어 성어: 약 50g"}
            {fishType === "guppy" && "일반 구피 성어: 약 1g"}
          </Text>
        </View>

        {/* 수조 용량 */}
        <View style={styles.section}>
          <Text style={styles.label}>수조 용량 (L)</Text>
          <TextInput
            style={styles.input}
            value={tankVolume}
            onChangeText={setTankVolume}
            keyboardType="decimal-pad"
            placeholder="기본값: 10L"
            placeholderTextColor="#94A3B8"
          />
          <Text style={styles.helpText}>예: 30cm 큐브 수조 ≈ 27L</Text>
        </View>

        {/* 버튼 그룹 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>건너뛰기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>완료</Text>
          </TouchableOpacity>
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
  scrollContent: {
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
    marginBottom: 4,
  },
  hintText: {
    fontFamily: "PixelifySans",
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontFamily: "SilkscreenBold",
    fontSize: 14,
    color: "#1E293B",
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 12,
  },
  optionButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  optionButtonSelected: {
    backgroundColor: "#4D55FF",
    borderColor: "#4D55FF",
  },
  optionButtonText: {
    fontFamily: "SilkscreenBold",
    fontSize: 14,
    color: "#64748B",
  },
  optionButtonTextSelected: {
    color: "#FFFFFF",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: "PixelifySans",
    fontSize: 16,
    color: "#1E293B",
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  helpText: {
    fontFamily: "PixelifySans",
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 6,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  skipButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  skipButtonText: {
    fontFamily: "SilkscreenBold",
    fontSize: 14,
    color: "#64748B",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#4D55FF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmButtonText: {
    fontFamily: "SilkscreenBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
});
