// screens/SplashScreen.tsx

import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../types";
import { getAllFish } from "../services/fishStorage";

type SplashScreenProps = StackScreenProps<RootStackParamList, "Splash">;

const logoImage = require("../FinAndFlourish/assets/images/logo.png");

export default function SplashScreen({ navigation }: SplashScreenProps) {
  useEffect(() => {
    const checkFishAndNavigate = async () => {
      try {
        const fishList = await getAllFish();

        setTimeout(() => {
          if (fishList.length === 0) {
            // 등록된 물고기가 없으면 물고기 등록 화면으로
            navigation.replace("FishName");
          } else {
            // 등록된 물고기가 있으면 메인 화면으로
            navigation.replace("Main");
          }
        }, 2000);
      } catch (error) {
        console.error("물고기 확인 실패:", error);
        // 에러가 발생해도 메인 화면으로 이동
        setTimeout(() => {
          navigation.replace("Main");
        }, 2000);
      }
    };

    checkFishAndNavigate();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FIN & FLOURISH</Text>
      <Image source={logoImage} style={styles.logo} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>INU IOT Project : Smart Aquarium</Text>
        <Text style={styles.footerText}>© Team name</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "PressStart2P_400Regular",
    fontSize: 20,
    marginBottom: 50,
    color: "#4D55FF",
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    marginBottom: 100,
  },
  footer: {
    position: "absolute",
    bottom: 50,
    alignItems: "center",
  },
  footerText: {
    fontFamily: "PressStart2P_400Regular",
    fontSize: 10,
    color: "#888",
    marginTop: 10,
  },
});
