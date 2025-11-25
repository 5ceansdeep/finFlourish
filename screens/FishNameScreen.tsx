// screens/FishNameScreen.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../types";

type FishNameScreenProps = StackScreenProps<RootStackParamList, "FishName">;

export default function FishNameScreen({ navigation }: FishNameScreenProps) {
  const [fishName, setFishName] = useState("");

  const handleContinue = () => {
    if (fishName.trim().length > 0) {
      // TODO: 물고기 이름 저장 후 다음 화면으로
      navigation.navigate("FishType", { fishName: fishName.trim() });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        {/* 물고기 이미지 */}
        <Image
          source={require("../FinAndFlourish/assets/images/fish_happy.png")}
          style={styles.fishImage}
        />

        {/* 질문 텍스트 */}
        <Text style={styles.questionText}>What is your friend's name?</Text>

        {/* 이름 입력 박스 */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={fishName}
            onChangeText={setFishName}
            maxLength={20}
            autoFocus
            placeholder="이름을 입력하세요"
            placeholderTextColor="#94A3B8"
          />

          {/* 화살표 버튼 */}
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={handleContinue}
          >
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  fishImage: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    marginBottom: 40,
  },
  questionText: {
    fontFamily: "PixelifySans",
    fontSize: 16,
    color: "#1E293B",
    marginBottom: 60,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    maxWidth: 340,
    borderWidth: 4,
    borderColor: "#1E293B",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  input: {
    flex: 1,
    fontFamily: "PixelifySans",
    fontSize: 20,
    color: "#1E293B",
    padding: 0,
  },
  arrowButton: {
    width: 40,
    height: 40,
    backgroundColor: "#94A3B8",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  arrowText: {
    fontSize: 24,
    color: "#FFFFFF",
  },
});
