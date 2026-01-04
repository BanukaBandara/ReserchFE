import React, { useEffect, useState } from "react";
import { View, Image, Text, Animated, Dimensions } from "react-native";
import * as Progress from "react-native-progress";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../app/App";

// Use this if your image is in assets folder:
const logo = require("../assets/p.png");

type SplashNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Splash"
>;

const { width, height } = Dimensions.get("window");

const Splash: React.FC = () => {
  const navigation = useNavigation<SplashNavigationProp>();
  const [progress, setProgress] = useState(0);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.3)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigation timer
    const timer = setTimeout(() => {
      navigation.navigate("SignIn");
    }, 4500);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 1) {
          return prev + 0.08;
        }
        clearInterval(progressInterval);
        return prev;
      });
    }, 360);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [navigation, fadeAnim, scaleAnim, slideAnim]);

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {/* Background Pattern with Teal Accents */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
        }}
      >
        {/* Decorative circles */}
        <View
          style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: "#0891b2",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: -100,
            left: -50,
            width: 300,
            height: 300,
            borderRadius: 150,
            backgroundColor: "#06b6d4",
          }}
        />
        <View
          style={{
            position: "absolute",
            top: height * 0.3,
            right: -30,
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: "#22d3ee",
          }}
        />
      </View>

      {/* Main Content */}
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 40,
        }}
      >
        {/* Logo Container with Shadow */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            shadowColor: "#0891b2",
            shadowOffset: {
              width: 0,
              height: 8,
            },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 10,
            backgroundColor: "#ffffff",
            borderRadius: 30,
            padding: 20,
            marginBottom: 40,
            borderWidth: 1,
            borderColor: "rgba(8, 145, 178, 0.1)",
          }}
        >
          <Image
            source={logo}
            style={{
              width: 120,
              height: 120,
              resizeMode: "contain",
            }}
          />
        </Animated.View>

        {/* App Name */}
        <Animated.Text
          style={{
            color: "#0f172a",
            fontSize: 32,
            fontWeight: "700",
            marginBottom: 10,
            textAlign: "center",
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            letterSpacing: 1,
          }}
        >
          Pineapple Growth
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          style={{
            color: "#64748b",
            fontSize: 16,
            fontWeight: "400",
            marginBottom: 60,
            textAlign: "center",
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            letterSpacing: 0.5,
          }}
        >
          Smart Plant Detection & Monitoring
        </Animated.Text>

        {/* Progress Bar Container */}
        <Animated.View
          style={{
            width: "75%",
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Progress.Bar
            progress={progress}
            width={null}
            height={8}
            color="#0891b2"
            unfilledColor="#f1f5f9"
            borderWidth={0}
            borderRadius={4}
            style={{
              shadowColor: "#0891b2",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
          />

          {/* Loading Text */}
          <Text
            style={{
              color: "#64748b",
              fontSize: 14,
              textAlign: "center",
              marginTop: 15,
              fontWeight: "500",
              letterSpacing: 0.5,
            }}
          >
            Loading...
          </Text>
        </Animated.View>
      </View>

      {/* Bottom Decorative Element */}
      <View
        style={{
          position: "absolute",
          bottom: 50,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 40,
            height: 4,
            backgroundColor: "#0891b2",
            borderRadius: 2,
            opacity: 0.4,
          }}
        />
      </View>
    </View>
  );
};

export default Splash;
