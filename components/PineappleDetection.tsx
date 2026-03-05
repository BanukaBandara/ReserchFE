import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import React, { useState, useRef } from "react";
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
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { APIError, detectPineappleGrowth } from "../services/apiService";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { addDetection, setCurrentDetection } from "../store/slices/detectionSlice";
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
  gradient: string[];
}

const CAPTURE_MODES: CaptureMode[] = [
  {
    id: "camera",
    title: "Camera",
    description: "Capture a real-time photo for instant analysis",
    icon: "camera",
    color: "#059669",
    gradient: ["#059669", "#047857"],
  },
  {
    id: "gallery",
    title: "Gallery",
    description: "Select an existing photo from your library",
    icon: "image",
    color: "#0891b2",
    gradient: ["#0891b2", "#0e7490"],
  },
];

const FEATURES = [
  {
    icon: "leaf",
    title: "Growth Stage Detection",
    description: "AI-powered identification of plant development phases",
    color: "#059669",
  },
  {
    icon: "hospital-box",
    title: "Health Monitoring",
    description: "Early detection of diseases and nutrient deficiencies",
    color: "#dc2626",
  },
  {
    icon: "chart-timeline-variant",
    title: "Growth Analytics",
    description: "Track development patterns and identify stunted growth",
    color: "#f59e0b",
  },
  {
    icon: "bell-ring",
    title: "Smart Notifications",
    description: "Multilingual alerts for timely plant care actions",
    color: "#8b5cf6",
  },
];

const PineappleDetection: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [isFeaturesExpanded, setIsFeaturesExpanded] = useState(false);
  
  const featuresHeight = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const dispatch = useAppDispatch();
  const navigation = useNavigation<PineappleNavProp>();

  const selectedPlantId = useAppSelector(
    (state) => state.plants.selectedPlantId
  );
  const selectedPlant = useAppSelector((state) =>
    state.plants.plants.find((p: any) => p.id === selectedPlantId)
  );

  const toggleFeatures = () => {
    const toValue = isFeaturesExpanded ? 0 : 1;

    Animated.spring(featuresHeight, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();

    setIsFeaturesExpanded(!isFeaturesExpanded);
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera Access Required",
        "Please enable camera access in your device settings to capture photos for plant analysis.",
        [
          { text: "Open Settings", onPress: () => {} },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Gallery Access Required",
        "Please enable photo library access in your device settings to select images.",
        [
          { text: "Open Settings", onPress: () => {} },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return false;
    }
    return true;
  };

  const analyzeImage = async (imageUri: string) => {
    setLoading(true);

    try {
      const response = await detectPineappleGrowth(imageUri, {
        daysFromPlanting: selectedPlant?.detectionHistory.length,
        location: selectedPlant?.location,
      });

      const detectionResult: DetectionResult = {
        id: `detection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
        Alert.alert(
          "Analysis Failed",
          error.message,
          [
            { text: "Try Again", onPress: () => analyzeImage(imageUri) },
            { text: "Cancel", style: "cancel" },
          ]
        );
      } else {
        Alert.alert(
          "Unexpected Error",
          "An error occurred during analysis. Please try again.",
          [{ text: "OK" }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    setShowCaptureModal(false);
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
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
      quality: 0.9,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setSelectedImage(imageUri);
      analyzeImage(imageUri);
    }
  };

  const clearImage = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedImage(null);
      setSelectedMode(null);
      fadeAnim.setValue(1);
    });
  };

  const maxHeight = featuresHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });

  return (
    <LinearGradient
      colors={["#064e3b", "#047857", "#10b981"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Professional Header */}
        <View className="px-5 pt-4 pb-6">
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-11 h-11 rounded-full bg-white/20 items-center justify-center active:bg-white/30"
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View className="flex-1 items-center">
              <Text className="text-white text-2xl font-bold tracking-tight">
                Plant Analysis
              </Text>
            </View>
            
            <View className="w-11" />
          </View>

          {selectedPlant && (
            <View className="bg-white/15 backdrop-blur-lg rounded-2xl px-4 py-3 border border-white/20">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-white/30 items-center justify-center mr-3">
                  <MaterialCommunityIcons name="sprout" size={20} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-white/70 text-xs font-medium uppercase tracking-wide">
                    Current Plant
                  </Text>
                  <Text className="text-white text-base font-semibold mt-0.5">
                    {selectedPlant.name}
                  </Text>
                </View>
                <View className="bg-emerald-400 px-3 py-1 rounded-full">
                  <Text className="text-emerald-900 text-xs font-bold">Active</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {!selectedImage ? (
            <View className="px-5">
              {/* Analysis Methods Section */}
              <View className="mb-6">
                <Text className="text-white text-lg font-bold mb-2 tracking-tight">
                  Choose Analysis Method
                </Text>
                <Text className="text-white/70 text-sm mb-5">
                  Select how you'd like to capture your plant image
                </Text>

                {CAPTURE_MODES.map((mode: CaptureMode) => (
                  <TouchableOpacity
                    key={mode.id}
                    onPress={() => {
                      setSelectedMode(mode.id);
                      setShowCaptureModal(true);
                    }}
                    className="mb-4"
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={['#ffffff', '#f9fafb']}
                      className="rounded-2xl p-5 shadow-lg"
                      style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                        elevation: 5,
                      }}
                    >
                      <View className="flex-row items-center">
                        <LinearGradient
                          colors={mode.gradient}
                          className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
                        >
                          <MaterialCommunityIcons
                            name={mode.icon as any}
                            size={28}
                            color="white"
                          />
                        </LinearGradient>
                        
                        <View className="flex-1 mr-3">
                          <Text className="text-gray-900 text-lg font-bold mb-1">
                            {mode.title}
                          </Text>
                          <Text className="text-gray-600 text-sm leading-5">
                            {mode.description}
                          </Text>
                        </View>
                        
                        <View className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center">
                          <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={mode.color}
                          />
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Advanced Features Section */}
              <View className="bg-white rounded-3xl overflow-hidden shadow-lg mb-4">
                <TouchableOpacity
                  onPress={toggleFeatures}
                  className="flex-row items-center justify-between p-5 bg-gradient-to-r from-emerald-50 to-white"
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 items-center justify-center mr-4">
                      <MaterialCommunityIcons
                        name="star-four-points"
                        size={24}
                        color="white"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 text-lg font-bold">
                        Advanced Features
                      </Text>
                      <Text className="text-gray-600 text-xs mt-0.5">
                        AI-powered plant analysis
                      </Text>
                    </View>
                  </View>
                  <View className={`transform ${isFeaturesExpanded ? 'rotate-180' : 'rotate-0'}`}>
                    <Ionicons
                      name="chevron-down"
                      size={24}
                      color="#059669"
                    />
                  </View>
                </TouchableOpacity>

                <Animated.View style={{ height: maxHeight, overflow: "hidden" }}>
                  <View className="px-5 pb-5">
                    {FEATURES.map((feature, index) => (
                      <FeatureItem
                        key={index}
                        icon={feature.icon}
                        title={feature.title}
                        description={feature.description}
                        color={feature.color}
                        isLast={index === FEATURES.length - 1}
                      />
                    ))}
                  </View>
                </Animated.View>
              </View>

              {/* Info Card */}
              <View className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                <View className="flex-row items-start">
                  <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center mr-3 flex-shrink-0">
                    <Ionicons name="information" size={20} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-blue-900 font-semibold mb-1">
                      Pro Tip
                    </Text>
                    <Text className="text-blue-700 text-sm leading-5">
                      For best results, capture photos in natural daylight and ensure the entire plant is visible in the frame.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <Animated.View style={{ opacity: fadeAnim }} className="px-5">
              {/* Image Preview Header */}
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-white text-lg font-bold">
                    Selected Image
                  </Text>
                  <Text className="text-white/70 text-sm mt-0.5">
                    {loading ? "Analyzing..." : "Ready for analysis"}
                  </Text>
                </View>
                {!loading && (
                  <TouchableOpacity
                    onPress={clearImage}
                    className="bg-red-500 px-4 py-2 rounded-xl flex-row items-center shadow-md"
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={16} color="white" />
                    <Text className="text-white font-semibold text-sm ml-2">
                      Remove
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Image Container */}
              <View className="relative bg-white rounded-3xl overflow-hidden shadow-2xl mb-6">
                <Image
                  source={{ uri: selectedImage }}
                  className="w-full h-80"
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  className="absolute bottom-0 left-0 right-0 h-20 justify-end p-4"
                >
                  <Text className="text-white text-sm font-medium">
                    📸 Captured for analysis
                  </Text>
                </LinearGradient>
              </View>

              {/* Analysis Status */}
              {loading && (
                <View className="bg-white rounded-3xl p-6 shadow-lg">
                  <View className="items-center">
                    <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center mb-4">
                      <ActivityIndicator size="large" color="#059669" />
                    </View>
                    <Text className="text-gray-900 text-xl font-bold mb-2">
                      Analyzing Your Plant
                    </Text>
                    <Text className="text-gray-600 text-center text-sm leading-6 px-4">
                      Our advanced AI is examining growth stages, identifying health issues, and analyzing nutrient levels
                    </Text>
                    
                    {/* Analysis Steps */}
                    <View className="w-full mt-6 space-y-3">
                      {[
                        "Detecting growth stage",
                        "Analyzing plant health",
                        "Checking nutrient levels",
                        "Generating recommendations"
                      ].map((step, i) => (
                        <View key={i} className="flex-row items-center">
                          <View className="w-2 h-2 rounded-full bg-emerald-500 mr-3" />
                          <Text className="text-gray-700 text-sm">{step}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </Animated.View>
          )}
        </ScrollView>

        {/* Capture Modal */}
        <Modal
          visible={showCaptureModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCaptureModal(false)}
        >
          <View className="flex-1 justify-end bg-black/60">
            <View className="bg-white rounded-t-3xl px-6 pt-8 pb-10">
              <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-6" />
              
              <Text className="text-gray-900 text-2xl font-bold mb-3 text-center">
                {CAPTURE_MODES.find((m) => m.id === selectedMode)?.title}
              </Text>
              <Text className="text-gray-600 text-center mb-8 text-sm">
                Choose your preferred capture method
              </Text>

              {selectedMode === "camera" && (
                <TouchableOpacity
                  onPress={takePhoto}
                  activeOpacity={0.9}
                  className="mb-3"
                >
                  <LinearGradient
                    colors={["#059669", "#047857"]}
                    className="py-4 rounded-2xl flex-row items-center justify-center shadow-md"
                  >
                    <MaterialCommunityIcons name="camera" size={24} color="white" />
                    <Text className="text-white text-lg font-bold ml-3">
                      Open Camera
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {selectedMode === "gallery" && (
                <TouchableOpacity
                  onPress={pickFromGallery}
                  activeOpacity={0.9}
                  className="mb-3"
                >
                  <LinearGradient
                    colors={["#0891b2", "#0e7490"]}
                    className="py-4 rounded-2xl flex-row items-center justify-center shadow-md"
                  >
                    <MaterialCommunityIcons name="image" size={24} color="white" />
                    <Text className="text-white text-lg font-bold ml-3">
                      Choose from Gallery
                    </Text>
                  </LinearGradient>
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
    </LinearGradient>
  );
};

const FeatureItem: React.FC<{
  icon: string;
  title: string;
  description: string;
  color: string;
  isLast?: boolean;
}> = ({ icon, title, description, color, isLast = false }) => (
  <View
    className={`flex-row items-start py-4 ${
      !isLast ? "border-b border-gray-100" : ""
    }`}
  >
    <View
      className="w-12 h-12 rounded-xl items-center justify-center mr-4 flex-shrink-0"
      style={{ backgroundColor: `${color}15` }}
    >
      <MaterialCommunityIcons name={icon as any} size={24} color={color} />
    </View>
    <View className="flex-1 pt-1">
      <Text className="font-bold text-gray-900 text-base mb-1">{title}</Text>
      <Text className="text-sm text-gray-600 leading-5">{description}</Text>
    </View>
  </View>
);

export default PineappleDetection;