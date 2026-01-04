import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { RootTabParamList } from "./types";
import { LinearGradient } from "expo-linear-gradient";

type Nav = BottomTabNavigationProp<RootTabParamList, "Home">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FeatureCard = ({
  title,
  subtitle,
  icon,
  gradient,
  stats,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  stats?: string;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        overflow: "hidden",
      }}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20 }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.25)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Ionicons name={icon} size={26} color="#ffffff" />
            </View>

            <Text style={{ fontSize: 20, fontWeight: "700", color: "#ffffff", marginBottom: 6 }}>
              {title}
            </Text>
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 20 }}>
              {subtitle}
            </Text>

            {stats && (
              <View
                style={{
                  marginTop: 12,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: 8,
                  alignSelf: "flex-start",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#ffffff" }}>{stats}</Text>
              </View>
            )}
          </View>

          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              width: 36,
              height: 36,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const QuickStatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: `${color}15`,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={{ fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 4 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 12, color: "#6b7280" }}>{label}</Text>
    </View>
  );
};

const InfoTip = ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: "#ecfeff",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons name={icon} size={16} color="#0f766e" />
      </View>
      <Text style={{ flex: 1, fontSize: 14, color: "#374151", lineHeight: 20 }}>{text}</Text>
    </View>
  );
};

export default function Home() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            // Navigate to SignIn screen and reset navigation stack
            navigation.reset({ 
              index: 0, 
              routes: [{ name: "SignIn" as any }] 
            });
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#064e3b" }}>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <LinearGradient
          colors={['#064e3b', '#166534', '#facc15']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Header */}
            <View
              style={{
                paddingTop: 20,
                paddingBottom: 30,
                paddingHorizontal: 20,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <View>
                  <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: "500" }}>
                    Welcome Back 👋
                  </Text>
                  <Text style={{ color: "#ffffff", fontSize: 28, fontWeight: "800", marginTop: 4 }}>
                    Pineapple Care
                  </Text>
                </View>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: "rgba(255,255,255,0.2)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="notifications-outline" size={22} color="#ffffff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSignOut}
                    activeOpacity={0.8}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: "rgba(255,255,255,0.2)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="log-out-outline" size={22} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={{ color: "rgba(255,255,255,0.95)", fontSize: 15, lineHeight: 22 }}>
                AI-powered detection and monitoring system for healthy pineapple cultivation
              </Text>
            </View>

        {/* Quick Stats */}
        <View style={{ paddingHorizontal: 14, marginTop: -30 }}>
          <View style={{ flexDirection: "row", marginBottom: 20 }}>
            <QuickStatCard icon="shield-checkmark" label="Scans Today" value="24" color="#059669" />
            <QuickStatCard icon="alert-circle" label="Alerts" value="3" color="#dc2626" />
            <QuickStatCard icon="leaf" label="Plants" value="156" color="#0284c7" />
          </View>
        </View>

        {/* Main Features */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#ffffff" }}>
              Main Features
            </Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#fef3c7" }}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          <FeatureCard
            title="Pest Detection"
            subtitle="Identify and diagnose pest infestations using advanced AI image recognition"
            icon="bug"
            gradient={["#dc2626", "#ef4444"]}
            stats="95% Accuracy"
            onPress={() => navigation.navigate("PestDetection")}
          />

          <FeatureCard
            title="Disease Detection"
            subtitle="Detect leaf and fruit diseases early with instant analysis and treatment plans"
            icon="medical"
            gradient={["#7c3aed", "#9333ea"]}
            stats="Smart Analysis"
            onPress={() => navigation.navigate("Disease")}
          />

          <FeatureCard
            title="Growth Tracking"
            subtitle="Monitor plant development stages with timeline tracking and growth insights"
            icon="analytics"
            gradient={["#0284c7", "#0ea5e9"]}
            stats="Real-time Updates"
            onPress={() => navigation.navigate("Growth")}
          />

          <FeatureCard
            title="Weather & Care Tips"
            subtitle="Get personalized care recommendations based on local weather conditions"
            icon="partly-sunny"
            gradient={["#f59e0b", "#fbbf24"]}
            stats="Daily Updates"
            onPress={() => navigation.navigate("Weather")}
          />
        </View>

        {/* Tips Section */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 8,
            backgroundColor: "rgba(255,255,255,0.95)",
            borderRadius: 20,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <Ionicons name="bulb" size={22} color="#fbbf24" />
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#064e3b", marginLeft: 8 }}>
              Pro Tips
            </Text>
          </View>

          <InfoTip
            icon="camera"
            text="Use clear, well-lit photos for accurate detection results"
          />
          <InfoTip
            icon="time"
            text="Scan your plants early morning for best photo quality"
          />
          <InfoTip
            icon="water"
            text="Regular monitoring helps catch issues before they spread"
          />
          <InfoTip
            icon="checkmark-circle"
            text="Follow recommended actions immediately for best recovery"
          />
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </LinearGradient>
    </View>

      {/* Bottom Navigation */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          paddingBottom: insets.bottom,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        }}
      >
        <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10 }}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={{ flex: 1, alignItems: "center", paddingHorizontal: 4 }}
            onPress={() => navigation.navigate("Home")}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: "#059669",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 4,
              }}
            >
              <Ionicons name="home" size={22} color="#ffffff" />
            </View>
            <Text style={{ fontSize: 10, fontWeight: "600", color: "#059669" }}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={{ flex: 1, alignItems: "center", paddingHorizontal: 4 }}
            onPress={() => navigation.navigate("PestDetection")}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: "#f3f4f6",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 4,
              }}
            >
              <Ionicons name="bug-outline" size={22} color="#6b7280" />
            </View>
            <Text style={{ fontSize: 10, fontWeight: "500", color: "#6b7280" }}>Pest</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={{ flex: 1, alignItems: "center", paddingHorizontal: 4 }}
            onPress={() => navigation.navigate("Disease")}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: "#f3f4f6",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 4,
              }}
            >
              <Ionicons name="medical-outline" size={22} color="#6b7280" />
            </View>
            <Text style={{ fontSize: 10, fontWeight: "500", color: "#6b7280" }}>Disease</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={{ flex: 1, alignItems: "center", paddingHorizontal: 4 }}
            onPress={() => navigation.navigate("Growth")}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: "#f3f4f6",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 4,
              }}
            >
              <Ionicons name="trending-up-outline" size={22} color="#6b7280" />
            </View>
            <Text style={{ fontSize: 10, fontWeight: "500", color: "#6b7280" }}>Growth</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={{ flex: 1, alignItems: "center", paddingHorizontal: 4 }}
            onPress={() => navigation.navigate("Profile")}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: "#f3f4f6",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 4,
              }}
            >
              <Ionicons name="person-outline" size={22} color="#6b7280" />
            </View>
            <Text style={{ fontSize: 10, fontWeight: "500", color: "#6b7280" }}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}