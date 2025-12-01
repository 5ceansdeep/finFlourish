// App.tsx

import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useFonts } from "expo-font";
import { PressStart2P_400Regular } from "@expo-google-fonts/press-start-2p";
import { View, StyleSheet } from "react-native";
import * as Notifications from "expo-notifications";

import { RootStackParamList } from "./types";

// 화면 컴포넌트 임포트
import SplashScreen from "./screens/SplashScreen";
import MainScreen from "./screens/MainScreen";
import LogScreen from "./screens/LogScreen";
import FishNameScreen from "./screens/FishNameScreen";
import FishTypeScreen from "./screens/FishTypeScreen";
import FishDetailScreen from "./screens/FishDetailScreen";
import MyFishScreen from "./screens/MyFishScreen";

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  // 픽셀 폰트 로드
  let [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
    PixelifySans: require("./FinAndFlourish/assets/fonts/PixelifySans-VariableFont_wght.ttf"),
    SilkscreenRegular: require("./FinAndFlourish/assets/fonts/Silkscreen-Regular.ttf"),
    SilkscreenBold: require("./FinAndFlourish/assets/fonts/Silkscreen-Bold.ttf"),
  });

  // 알림 권한 요청
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("알림 권한이 거부되었습니다.");
      }
    };

    requestPermissions();
  }, []);

  if (!fontsLoaded) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="Log" component={LogScreen} />
        <Stack.Screen name="FishName" component={FishNameScreen} />
        <Stack.Screen name="FishType" component={FishTypeScreen} />
        <Stack.Screen name="FishDetail" component={FishDetailScreen} />
        <Stack.Screen name="MyFish" component={MyFishScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
