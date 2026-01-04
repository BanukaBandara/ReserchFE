import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
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
} from "react-native";
import {
  APIError,
  detectPineappleGrowth,
  testConnection,
} from "../services/apiService";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  addDetection,
  setCurrentDetection,
} from "../store/slices/detectionSlice";
import { addDetectionToPlant } from "../store/slices/plantSlice";
import { DetectionResult, GrowthStage } from "../types/detection";

const { width, height } = Dimensions.get("window");

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
  {
    id: "multiple",
    title: "Multiple",
    description: "Analyze multiple plants at once",
    icon: "layers",
    color: "#7c3aed",
  },
];

const PineappleDetection: React.FC = () => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [showAnalyzing, setShowAnalyzing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "checking" | "connected" | "disconnected"
  >("checking");
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const selectedPlantId = useAppSelector(
    (state) => state.plants.selectedPlantId
  );
  const selectedPlant = useAppSelector((state) =>
    state.plants.plants.find((p: any) => p.id === selectedPlantId)
  );

  // Check connection on mount
  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    setConnectionStatus("checking");
    const connected = await testConnection();
    setConnectionStatus(connected ? "connected" : "disconnected");
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
      setSelectedImages([imageUri]);
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
      setSelectedImages([imageUri]);
      analyzeImage(imageUri);
    }
  };

  const pickMultipleImages = async () => {
    setShowCaptureModal(false);
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      ...({
        allowsMultiple: true,
      } as any),
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setSelectedImages(uris);
      Alert.alert(
        "Multiple Images Selected",
        `${uris.length} images selected. Analyze all at once?`,
        [
          { text: "Cancel", onPress: () => setSelectedImages([]) },
          {
            text: "Analyze All",
            onPress: () => analyzeMultipleImages(uris),
            style: "default",
          },
        ]
      );
    }
  };

  const analyzeImage = async (imageUri: string) => {
    if (connectionStatus !== "connected") {
      Alert.alert(
        "Connection Error",
        "Server is not reachable. Please check:\n\n1. Server is running\n2. Correct IP in apiService.ts\n3. Phone and server on same network"
      );
      return;
    }

    setLoading(true);
    setShowAnalyzing(true);

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
      setShowAnalyzing(false);
    }
  };

  const analyzeMultipleImages = async (imageUris: string[]) => {
    if (imageUris.length === 0) return;

    setLoading(true);
    setShowAnalyzing(true);

    try {
      for (let i = 0; i < imageUris.length; i++) {
        await analyzeImage(imageUris[i]);
      }
    } finally {
      setLoading(false);
      setShowAnalyzing(false);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setSelectedImages([]);
    setSelectedMode(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-gradient-to-b from-green-600 to-green-700 px-4 py-6">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-white text-2xl font-bold">Growth Detector</Text>
          <TouchableOpacity
            onPress={checkServerConnection}
            className="flex-row items-center bg-white/20 px-3 py-2 rounded-lg"
          >
            <View
              className={`w-2 h-2 rounded-full mr-2 ${
                connectionStatus === "connected" ? "bg-green-300" : "bg-red-300"
              }`}
            />
            <Text className="text-white text-xs font-medium">
              {connectionStatus === "checking"
                ? "Checking..."
                : connectionStatus === "connected"
                ? "Online"
                : "Offline"}
            </Text>
          </TouchableOpacity>
        </View>
        <Text className="text-green-100">
          {selectedPlant
            ? `Analyzing: ${selectedPlant.name}`
            : "Select a plant or add image"}
        </Text>
      </View>

      {/* Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {selectedImages.length === 0 ? (
          <View className="p-4">
            {/* Capture Modes */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-800 mb-4">
                How do you want to analyze?
              </Text>

              {CAPTURE_MODES.map((mode: CaptureMode) => (
                <TouchableOpacity
                  key={mode.id}
                  onPress={() => {
                    setSelectedMode(mode.id);
                    setShowCaptureModal(true);
                  }}
                  className="bg-white p-4 rounded-2xl mb-3 flex-row items-center border border-gray-200 shadow-sm"
                  activeOpacity={0.7}
                >
                  <View
                    className="w-14 h-14 rounded-xl items-center justify-center mr-4"
                    style={{ backgroundColor: `${mode.color}20` }}
                  >
                    <MaterialCommunityIcons
                      name={mode.icon as any}
                      size={28}
                      color={mode.color}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-800">
                      {mode.title}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1">
                      {mode.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>

            {/* Features */}
            <View className="bg-white rounded-2xl p-4 border border-gray-200">
              <Text className="text-lg font-bold text-gray-800 mb-4">
                Advanced Features
              </Text>

              <FeatureItem
                icon="leaf-circle"
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
              />
            </View>
          </View>
        ) : (
          <View className="p-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-800">
                Selected Images ({selectedImages.length})
              </Text>
              {!loading && (
                <TouchableOpacity onPress={clearAllImages}>
                  <Text className="text-red-600 font-semibold">Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {selectedImages.map((uri: string, index: number) => (
              <View
                key={index}
                className="relative bg-gray-200 rounded-2xl overflow-hidden mb-4"
              >
                <Image
                  source={{ uri }}
                  className="w-full h-64"
                  resizeMode="cover"
                />
                {!loading && (
                  <TouchableOpacity
                    onPress={() => removeImage(index)}
                    className="absolute top-3 right-3 bg-red-500 rounded-full p-2"
                  >
                    <Ionicons name="close" size={20} color="white" />
                  </TouchableOpacity>
                )}
                <View className="absolute bottom-0 left-0 right-0 bg-black/50 px-3 py-2">
                  <Text className="text-white text-xs">
                    Image {index + 1} of {selectedImages.length}
                  </Text>
                </View>
              </View>
            ))}

            {loading && (
              <View className="bg-blue-50 p-6 rounded-2xl items-center">
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="text-blue-700 mt-4 text-lg font-bold">
                  Analyzing...
                </Text>
                <Text className="text-blue-600 mt-2 text-center text-sm">
                  Our AI is examining growth stages, health issues, and nutrient
                  levels
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Button */}
      {selectedImages.length > 0 && !loading && (
        <View className="bg-white border-t border-gray-200 p-4">
          <TouchableOpacity
            onPress={() => analyzeMultipleImages(selectedImages)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 py-4 rounded-2xl flex-row items-center justify-center"
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="brain" size={24} color="white" />
            <Text className="text-white text-lg font-bold ml-2">
              Analyze {selectedImages.length}{" "}
              {selectedImages.length === 1 ? "Image" : "Images"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Capture Options Modal */}
      <Modal
        visible={showCaptureModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCaptureModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold mb-6 text-center text-gray-800">
              {CAPTURE_MODES.find((m) => m.id === selectedMode)?.title ||
                "Select Source"}
            </Text>

            {selectedMode === "camera" && (
              <>
                <TouchableOpacity
                  onPress={takePhoto}
                  className="bg-green-600 py-4 rounded-2xl flex-row items-center justify-center mb-3"
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="camera"
                    size={24}
                    color="white"
                  />
                  <Text className="text-white text-lg font-semibold ml-3">
                    Take Photo
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {selectedMode === "gallery" && (
              <>
                <TouchableOpacity
                  onPress={pickFromGallery}
                  className="bg-blue-600 py-4 rounded-2xl flex-row items-center justify-center mb-3"
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="image"
                    size={24}
                    color="white"
                  />
                  <Text className="text-white text-lg font-semibold ml-3">
                    Choose from Gallery
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {selectedMode === "multiple" && (
              <>
                <TouchableOpacity
                  onPress={pickMultipleImages}
                  className="bg-purple-600 py-4 rounded-2xl flex-row items-center justify-center mb-3"
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="layers"
                    size={24}
                    color="white"
                  />
                  <Text className="text-white text-lg font-semibold ml-3">
                    Select Multiple Images
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              onPress={() => {
                setShowCaptureModal(false);
                setSelectedMode(null);
              }}
              className="bg-gray-200 py-4 rounded-2xl"
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
}> = ({ icon, title, description }) => (
  <View className="flex-row items-start mb-4 pb-4 border-b border-gray-200">
    <View className="w-12 h-12 rounded-xl bg-green-100 items-center justify-center mr-3">
      <MaterialCommunityIcons name={icon as any} size={24} color="#059669" />
    </View>
    <View className="flex-1">
      <Text className="font-bold text-gray-800">{title}</Text>
      <Text className="text-sm text-gray-600 mt-1">{description}</Text>
    </View>
  </View>
);

export default PineappleDetection;
