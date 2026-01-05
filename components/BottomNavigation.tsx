import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import Home from "./Home";
import PestDetection from "./PestDetection";
import DiseaseDetection from "./Disease";
import PineappleDetection from "./PineappleDetection";
//import Growth from "./Growth";

export type MainTabParamList = {
  Home: undefined;
  PestDetection: undefined;
  DiseaseDetection: undefined;
  PineappleDetection: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function BottomNavigation() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: "center",
        tabBarActiveTintColor: "#0f766e",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 6 },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home-outline";

          if (route.name === "Home") iconName = "home-outline";
          if (route.name === "PestDetection") iconName = "bug-outline";
          if (route.name === "Disease") iconName = "leaf-outline";
          if (route.name === "PineappleDetection")
            iconName = "trending-up-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} options={{ title: "Home" }} />
      <Tab.Screen
        name="PestDetection"
        component={PestDetection}
        options={{ title: "Pest Detection" }}
      />
      <Tab.Screen
        name="DiseaseDetection"
        component={DiseaseDetection}
        options={{ title: "Disease Detection" }}
      />
      <Tab.Screen
        name="Growth"
        component={PineappleDetection}
        options={{ title: "Plant Growth" }}
      />
    </Tab.Navigator>
  );
}
