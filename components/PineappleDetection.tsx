import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { APIError, detectPineappleGrowth } from "../services/apiService";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  addDetection,
  setCurrentDetection,
} from "../store/slices/detectionSlice";
import { addDetectionToPlant } from "../store/slices/plantSlice";
import { DetectionResult, GrowthStage } from "../types/detection";
import { RootStackParamList } from "../app/App";

const { width, height } = Dimensions.get("window");

type PineappleNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "PineappleDetection"
>;

interface CaptureMode {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const CAPTURE_MODES: CaptureMode[] = [
  {
    id: "camera",
    title: "Camera",
    description: "Take a fresh photo of the plant",
    icon: "camera",
    color: "#059669",
  },
  {
    id: "gallery",
    title: "Gallery",
    description: "Choose from existing photos",
    icon: "image",
    color: "#0891b2",
  },
];

const PineappleDetection: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "checking" | "connected" | "disconnected"
  >("checking");
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [isFeaturesExpanded, setIsFeaturesExpanded] = useState(false);
  const [featuresHeight] = useState(new Animated.Value(0));

  const dispatch = useAppDispatch();
  const navigation = useNavigation<PineappleNavProp>();
  const selectedPlantId = useAppSelector(
    (state) => state.plants.selectedPlantId
  );
  const selectedPlant = useAppSelector((state) =>
    state.plants.plants.find((p: any) => p.id === selectedPlantId)
  );

  // Toggle Advanced Features Dropdown
  const toggleFeatures = () => {
    const toValue = isFeaturesExpanded ? 0 : 1;

    Animated.timing(featuresHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();

    setIsFeaturesExpanded(!isFeaturesExpanded);
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera permission is required to take photos.",
        [{ text: "Settings", onPress: () => {} }, { text: "Cancel" }]
      );
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Gallery permission is required to select photos.",
        [{ text: "Settings", onPress: () => {} }, { text: "Cancel" }]
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    setShowCaptureModal(false);
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setSelectedImage(imageUri);
      analyzeImage(imageUri);
    }
  };

  const pickFromGallery = async () => {
    setShowCaptureModal(false);
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setSelectedImage(imageUri);
      analyzeImage(imageUri);
    }
  };

  const analyzeImage = async (imageUri: string) => {
    // if (connectionStatus !== "connected") {
    //   Alert.alert(
    //     "Connection Error",
    //     "Server is not reachable. Please check:\n\n1. Server is running\n2. Correct IP in apiService.ts\n3. Phone and server on same network"
    //   );
    //   return;
    // }

    setLoading(true);

    try {
      const response = await detectPineappleGrowth(imageUri, {
        daysFromPlanting: selectedPlant?.detectionHistory.length,
        location: selectedPlant?.location,
      });

      const detectionResult: DetectionResult = {
        id: `detection_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        success: true,
        growth_stage: response.growth_stage as GrowthStage,
        confidence: response.confidence,
        health_status: response.health_status as any,
        health_issues: response.health_issues || [],
        stunted_growth: response.stunted_growth,
        nutrient_analysis: response.nutrient_analysis,
        all_predictions: response.all_predictions || {},
        recommendations: response.recommendations || [],
        action_items: response.action_items || [],
        timestamp: new Date().toISOString(),
        imageUri: imageUri,
        plantId: selectedPlantId || undefined,
        daysFromPlanting: selectedPlant?.detectionHistory.length,
      };

      dispatch(addDetection(detectionResult));
      dispatch(setCurrentDetection(detectionResult));

      if (selectedPlantId) {
        dispatch(
          addDetectionToPlant({
            plantId: selectedPlantId,
            detection: detectionResult,
          })
        );
      }

      navigation.navigate("DetectionResults");
    } catch (error: any) {
      console.error("Detection error:", error);

      if (error instanceof APIError) {
        Alert.alert("Analysis Failed", error.message, [
          { text: "Retry", onPress: () => analyzeImage(imageUri) },
          { text: "Cancel" },
        ]);
      } else {
        Alert.alert("Error", "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setSelectedMode(null);
  };

  const maxHeight = featuresHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 350], // Adjust based on content height
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Enhanced Header */}
      <View className="bg-emerald-600 px-4 py-6 shadow-lg">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold flex-1 ml-2">
            Plant Detection
          </Text>
        </View>
        <View className="bg-white/20 rounded-lg px-3 py-2">
          <Text className="text-emerald-50 text-sm">
            {selectedPlant
              ? `📍 ${selectedPlant.name}`
              : "Select plant or add image to analyze"}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {!selectedImage ? (
          <View className="p-4">
            {/* Capture Modes */}
            <View className="mb-6">
              <Text className="text-xl font-bold text-gray-800 mb-4">
                How do you want to analyze?
              </Text>

              {CAPTURE_MODES.map((mode: CaptureMode) => (
                <TouchableOpacity
                  key={mode.id}
                  onPress={() => {
                    setSelectedMode(mode.id);
                    setShowCaptureModal(true);
                  }}
                  className="bg-white p-5 rounded-2xl mb-3 flex-row items-center border-2 border-gray-100 shadow-sm active:border-emerald-400"
                  activeOpacity={0.7}
                >
                  <View
                    className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
                    style={{ backgroundColor: `${mode.color}15` }}
                  >
                    <MaterialCommunityIcons
                      name={mode.icon as any}
                      size={32}
                      color={mode.color}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">
                      {mode.title}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1">
                      {mode.description}
                    </Text>
                  </View>
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${mode.color}20` }}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={mode.color}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Collapsible Advanced Features */}
            <View className="bg-white rounded-3xl border border-emerald-100 shadow-sm mb-4 overflow-hidden">
              {/* Header - Always Visible */}
              <TouchableOpacity
                onPress={toggleFeatures}
                className="flex-row items-center justify-between p-6"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center flex-1">
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={28}
                    color="#059669"
                  />
                  <Text className="text-lg font-bold text-gray-800 ml-3">
                    Advanced Features
                  </Text>
                </View>
                <Ionicons
                  name={isFeaturesExpanded ? "chevron-up" : "chevron-down"}
                  size={24}
                  color="#059669"
                />
              </TouchableOpacity>

              {/* Collapsible Content */}
              <Animated.View style={{ height: maxHeight, overflow: "hidden" }}>
                <View className="px-6 pb-6">
                  <FeatureItem
                    icon="leaf"
                    title="Growth Stage Detection"
                    description="Identifies current plant development stage"
                  />
                  <FeatureItem
                    icon="heart-alert"
                    title="Health Monitoring"
                    description="Detects diseases and nutrient issues"
                  />
                  <FeatureItem
                    icon="chart-line"
                    title="Stunted Growth Alert"
                    description="Identifies growth problems early"
                  />
                  <FeatureItem
                    icon="volume-high"
                    title="Voice Alerts"
                    description="Get alerts in your local language"
                    isLast={true}
                  />
                </View>
              </Animated.View>
            </View>
          </View>
        ) : (
          <View className="p-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-800">
                Selected Image
              </Text>
              {!loading && (
                <TouchableOpacity
                  onPress={clearImage}
                  className="bg-red-100 px-3 py-1 rounded-lg"
                >
                  <Text className="text-red-600 font-semibold text-sm">
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="relative bg-gray-200 rounded-2xl overflow-hidden mb-4 shadow-sm">
              <Image
                source={{ uri: selectedImage }}
                className="w-full h-64"
                resizeMode="cover"
              />
              {!loading && (
                <TouchableOpacity
                  onPress={clearImage}
                  className="absolute top-3 right-3 bg-red-500 rounded-full p-2 shadow-lg"
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              )}
            </View>

            {loading && (
              <View className="bg-emerald-50 p-8 rounded-3xl items-center border border-emerald-200">
                <ActivityIndicator size="large" color="#059669" />
                <Text className="text-emerald-700 mt-4 text-lg font-bold">
                  Analyzing Plant...
                </Text>
                <Text className="text-emerald-600 mt-2 text-center text-sm">
                  Our AI is examining growth stages, health issues, and nutrient
                  levels
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Capture Options Modal */}
      <Modal
        visible={showCaptureModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCaptureModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 pt-8">
            <Text className="text-2xl font-bold mb-6 text-center text-gray-800">
              {CAPTURE_MODES.find((m) => m.id === selectedMode)?.title ||
                "Select Source"}
            </Text>

            {selectedMode === "camera" && (
              <TouchableOpacity
                onPress={takePhoto}
                className="bg-emerald-600 py-4 rounded-2xl flex-row items-center justify-center mb-3 shadow-md"
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="camera" size={24} color="white" />
                <Text className="text-white text-lg font-semibold ml-3">
                  Take Photo
                </Text>
              </TouchableOpacity>
            )}

            {selectedMode === "gallery" && (
              <TouchableOpacity
                onPress={pickFromGallery}
                className="bg-cyan-600 py-4 rounded-2xl flex-row items-center justify-center mb-3 shadow-md"
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="image" size={24} color="white" />
                <Text className="text-white text-lg font-semibold ml-3">
                  Choose from Gallery
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => {
                setShowCaptureModal(false);
                setSelectedMode(null);
              }}
              className="bg-gray-100 py-4 rounded-2xl border border-gray-200"
              activeOpacity={0.8}
            >
              <Text className="text-gray-700 text-lg font-semibold text-center">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const FeatureItem: React.FC<{
  icon: string;
  title: string;
  description: string;
  isLast?: boolean;
}> = ({ icon, title, description, isLast = false }) => (
  <View
    className={`flex-row items-start mb-5 pb-5 ${
      !isLast ? "border-b border-gray-200" : ""
    }`}
  >
    <View className="w-12 h-12 rounded-xl bg-emerald-100 items-center justify-center mr-4 flex-shrink-0">
      <MaterialCommunityIcons name={icon as any} size={24} color="#059669" />
    </View>
    <View className="flex-1">
      <Text className="font-bold text-gray-800">{title}</Text>
      <Text className="text-sm text-gray-600 mt-1">{description}</Text>
    </View>
  </View>
);

export default PineappleDetection;
