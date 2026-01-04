import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppSelector } from "../store/store";
import { RootStackParamList } from "./types";

const logo = require("../assets/p.png");

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, "Home">;

const Home: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeNavProp>();

  const { user } = useAppSelector((state) => state.auth);

  const displayName = user?.name || user?.email || "Farmer";

  const handleStartDetection = () => {
    navigation.navigate("PineappleDetection");
  };

  const handleViewAlerts = () => {
    Alert.alert(
      "Alerts",
      "This will show a list of pest alerts, timestamps, and locations."
    );
  };

  const handleFieldSummary = () => {
    Alert.alert(
      "Field Summary",
      "This will show summary charts for pest counts and risk levels over time."
    );
  };

  const handleSettings = () => {
    Alert.alert(
      "Settings",
      "This will let you adjust thresholds, notification preferences, and account info."
    );
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Do you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          // TODO: dispatch your logout/clearAuth action here if you implement it
          // dispatch(logout());
          navigation.reset({
            index: 0,
            routes: [{ name: "SignIn" }],
          });
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-emerald-900">
      <View
        className="flex-1"
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <LinearGradient
          colors={["#064e3b", "#166534", "#facc15"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* TOP BAR */}
            <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
              <View className="flex-row items-center">
                <Image
                  source={logo}
                  className="w-10 h-10 mr-2"
                  style={{ resizeMode: "contain" }}
                />
                <View>
                  <Text className="text-xs text-emerald-50 opacity-80">
                    Pineapple Pest Detector
                  </Text>
                  <Text className="text-base font-semibold text-amber-300">
                    Hi, {displayName}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                className="flex-row items-center bg-emerald-900/40 px-3 py-2 rounded-full"
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={18} color="#fefce8" />
                <Text className="text-xs text-amber-100 ml-1 font-medium">
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>

            {/* OVERVIEW CARD */}
            <View className="px-5">
              <View
                className="bg-white/95 rounded-2xl px-4 py-4 mb-4"
                style={{
                  shadowColor: "#000",
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 10,
                }}
              >
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm font-semibold text-emerald-900">
                    Field overview
                  </Text>
                  <View className="flex-row items-center bg-emerald-50 px-2 py-1 rounded-full">
                    <Ionicons name="cloud-outline" size={14} color="#166534" />
                    <Text className="text-[11px] text-emerald-700 ml-1">
                      Live monitoring
                    </Text>
                  </View>
                </View>

                <Text className="text-xs text-gray-500 mb-3">
                  Quickly access pest detection, alerts, and field summaries
                  from one place.
                </Text>

                <View className="flex-row justify-between mt-1">
                  <View>
                    <Text className="text-emerald-900 font-bold text-xl">
                      0
                    </Text>
                    <Text className="text-[11px] text-gray-500">
                      Active alerts
                    </Text>
                  </View>
                  <View>
                    <Text className="text-emerald-900 font-bold text-xl">
                      0
                    </Text>
                    <Text className="text-[11px] text-gray-500">
                      Fields synced
                    </Text>
                  </View>
                  <View>
                    <Text className="text-emerald-900 font-bold text-xl">
                      -
                    </Text>
                    <Text className="text-[11px] text-gray-500">Last scan</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* MAIN ACTIONS GRID */}
            <View className="px-5 mt-1">
              <Text className="text-xs uppercase tracking-widest text-amber-100 mb-2">
                Main Actions
              </Text>

              <View className="flex-row flex-wrap -mx-1">
                {/* Start Detection */}
                <TouchableOpacity
                  className="w-1/2 px-1 mb-3"
                  onPress={handleStartDetection}
                >
                  <View className="bg-white/95 rounded-2xl px-3 py-4 h-32 justify-between shadow-md">
                    <View className="bg-emerald-100 w-12 h-12 rounded-xl items-center justify-center">
                      <MaterialCommunityIcons
                        name="camera-iris"
                        size={28}
                        color="#059669"
                      />
                    </View>
                    <View>
                      <Text className="text-base font-bold text-emerald-900 mb-1">
                        Start Detection
                      </Text>
                      <Text className="text-xs text-gray-600">
                        Analyze plant growth
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* View Alerts */}
                <TouchableOpacity
                  className="w-1/2 px-1 mb-3"
                  onPress={handleViewAlerts}
                >
                  <View className="bg-white/95 rounded-2xl px-3 py-4 h-32 justify-between shadow-md">
                    <View className="bg-amber-100 w-12 h-12 rounded-xl items-center justify-center">
                      <MaterialCommunityIcons
                        name="bell-alert"
                        size={28}
                        color="#d97706"
                      />
                    </View>
                    <View>
                      <Text className="text-base font-bold text-emerald-900 mb-1">
                        View Alerts
                      </Text>
                      <Text className="text-xs text-gray-600">
                        Check pest warnings
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Field Summary */}
                <TouchableOpacity
                  className="w-1/2 px-1 mb-3"
                  onPress={handleFieldSummary}
                >
                  <View className="bg-white/95 rounded-2xl px-3 py-4 h-32 justify-between shadow-md">
                    <View className="bg-blue-100 w-12 h-12 rounded-xl items-center justify-center">
                      <MaterialCommunityIcons
                        name="chart-bar"
                        size={28}
                        color="#2563eb"
                      />
                    </View>
                    <View>
                      <Text className="text-base font-bold text-emerald-900 mb-1">
                        Field Summary
                      </Text>
                      <Text className="text-xs text-gray-600">
                        View analytics
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Settings */}
                <TouchableOpacity
                  className="w-1/2 px-1 mb-3"
                  onPress={handleSettings}
                >
                  <View className="bg-white/95 rounded-2xl px-3 py-4 h-32 justify-between shadow-md">
                    <View className="bg-purple-100 w-12 h-12 rounded-xl items-center justify-center">
                      <MaterialCommunityIcons
                        name="cog"
                        size={28}
                        color="#7c3aed"
                      />
                    </View>
                    <View>
                      <Text className="text-base font-bold text-emerald-900 mb-1">
                        Settings
                      </Text>
                      <Text className="text-xs text-gray-600">
                        Manage preferences
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* FOOTER */}
            <View className="px-5 mt-1">
              <Text className="text-[11px] text-emerald-50/90 text-center mt-2">
                Powered by AI-based pest detection • Pineapple Research Project
              </Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </View>
  );
};

export default Home;
