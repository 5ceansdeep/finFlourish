import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Text,
  Image,
} from "react-native";
import { useFonts } from "expo-font";

const { height } = Dimensions.get("window");

// 커스텀 폰트 정의
export const CustomFonts = {
  SilkscreenRegular: "Silkscreen-Regular",
  SilkscreenBold: "Silkscreen-Bold",
  PixelifySans: "PixelifySans",
};

interface SplashScreenProps {
  onLoadingComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onLoadingComplete }) => {
  // 폰트 로딩
  const [fontsLoaded] = useFonts({
    [CustomFonts.SilkscreenRegular]: require("@/assets/fonts/Silkscreen-Regular.ttf"),
    [CustomFonts.SilkscreenBold]: require("@/assets/fonts/Silkscreen-Bold.ttf"),
    [CustomFonts.PixelifySans]: require("@/assets/fonts/PixelifySans-VariableFont_wght.ttf"),
  });

  const [waterLevel] = useState(new Animated.Value(0));
  const [bubbles] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  useEffect(() => {
    // 폰트가 로드되지 않았으면 애니메이션 시작하지 않음
    if (!fontsLoaded) return;
    // 물 차오르는 애니메이션
    Animated.timing(waterLevel, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(() => {
      // 로딩 완료 후 0.5초 대기
      setTimeout(onLoadingComplete, 500);
    });

    // 물거품 애니메이션
    bubbles.forEach((bubble, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 400),
          Animated.timing(bubble, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(bubble, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [fontsLoaded]);

  // 폰트 로딩 중이면 빈 화면
  if (!fontsLoaded) {
    return <View style={styles.container} />;
  }

  const waterHeight = waterLevel.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height],
  });

  return (
    <View style={styles.container}>
      {/* 물 애니메이션 */}
      <Animated.View
        style={[
          styles.water,
          {
            height: waterHeight,
          },
        ]}
      />

      {/* 물거품들 */}
      {bubbles.map((bubble, index) => {
        const translateY = bubble.interpolate({
          inputRange: [0, 1],
          outputRange: [100, -height],
        });
        const opacity = bubble.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.6, 0.8, 0],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.bubble,
              {
                left: 50 + index * 100,
                transform: [{ translateY }],
                opacity,
              },
            ]}
          />
        );
      })}

      {/* 콘텐츠 영역 */}
      <View style={styles.content}>
        {/* 타이틀 */}
        <View style={styles.titleContainer}>
          <PixelText text="FIN & FLOURISH" />
        </View>

        {/* 로고 이미지 */}
        <View style={styles.fishContainer}>
          <LogoImage />
        </View>

        {/* 프로젝트 정보 */}
        <View style={styles.infoContainer}>
          <PixelText text="INU IOT Project : Smart Aquarium" size={12} />
          <View style={styles.teamInfo}>
            <PixelText text="© Team name:" size={10} />
          </View>
        </View>
      </View>
    </View>
  );
};

// 픽셀 텍스트 컴포넌트
const PixelText: React.FC<{ text: string; size?: number }> = ({
  text,
  size = 24,
}) => (
  <View style={styles.pixelText}>
    {text.split("").map((char, index) => (
      <Text key={index} style={[styles.char, { fontSize: size }]}>
        {char}
      </Text>
    ))}
  </View>
);

// 로고 이미지 컴포넌트
const LogoImage: React.FC = () => {
  return (
    <Image
      source={require("@/assets/images/good.png")}
      style={styles.logoImage}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    position: "relative",
  },
  water: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(100, 180, 230, 0.3)",
  },
  bubble: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 80,
    zIndex: 1,
  },
  titleContainer: {
    fontFamily: "Silkscreen-Regular",
    alignItems: "center",
  },
  pixelText: {
    flexDirection: "row",
  },
  char: {
    fontFamily: "Silkscreen-Bold",
    color: "#2C3E50",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  charBackground: {
    position: "absolute",
  },
  charContent: {
    position: "relative",
  },
  fishContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: 150,
    height: 150,
  },
  infoContainer: {
    alignItems: "center",
    gap: 8,
  },
  teamInfo: {
    marginTop: 4,
  },
});

export default SplashScreen;
