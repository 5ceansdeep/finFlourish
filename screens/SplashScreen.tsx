// screens/SplashScreen.tsx

import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../types";

type SplashScreenProps = StackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: SplashScreenProps) {
  useEffect(() => {
    setTimeout(() => {
      navigation.replace("Main");
    }, 2000);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FIN & FLOURISH</Text>
      <View style={styles.placeholderImage} />

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
  },
  placeholderImage: {
    width: 150,
    height: 150,
    backgroundColor: "#5FA8D3",
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
