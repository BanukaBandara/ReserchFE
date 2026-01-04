import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  Dimensions,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

type PredictionResponse = {
  label: string;
  confidence: number;
};

const API_URL = "http://192.168.8.181:8000/predict";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PestDetection: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const confidencePct = useMemo(() => {
    if (!result) return null;
    const c = result.confidence > 1 ? result.confidence / 100 : result.confidence;
    return Math.max(0, Math.min(1, c)) * 100;
  }, [result]);

  const pestInfo = useMemo(() => {
    const label = (result?.label || "").toLowerCase();

    const infoMap: Record<
      string,
      {
        title: string;
        description: string;
        symptoms: string[];
        risk: "Low" | "Medium" | "High";
        actions: string[];
      }
    > = {
      mealybug: {
        title: "Mealybug",
        description:
          "Mealybugs are sap-sucking insects that weaken pineapple plants and can spread diseases. They often appear as white cottony clusters.",
        symptoms: [
          "White cotton-like insects at leaf bases or joints",
          "Leaf yellowing / stunted growth",
          "Sticky honeydew and black sooty mold",
          "Increased ant activity near plants",
        ],
        risk: "High",
        actions: [
          "Remove heavily infested plant parts (if safe).",
          "Control ants (they protect mealybugs).",
          "Use integrated pest management (IPM) methods.",
          "Improve field sanitation and spacing for airflow.",
        ],
      },
      thrips: {
        title: "Thrips",
        description:
          "Thrips are tiny insects that damage plant tissues by rasping and sucking. They can cause silvery patches and leaf distortion.",
        symptoms: [
          "Silvering/bronzing on leaves",
          "Tiny black spots (thrips droppings)",
          "Distorted young leaves",
          "Scarring on plant surfaces",
        ],
        risk: "Medium",
        actions: [
          "Take another close-up photo for confirmation if needed.",
          "Use sticky traps for monitoring.",
          "Reduce water stress and maintain good nutrition.",
          "Consider IPM (biological control + targeted treatments).",
        ],
      },
    };

    return (
      infoMap[label] || {
        title: result?.label || "Unknown",
        description:
          "This pest class is not yet described in the app. Add details in pestInfo map.",
        symptoms: ["Capture a clearer close-up image in good light."],
        risk: "Low",
        actions: ["Retake photo", "Verify manually", "Add pest details in code"],
      }
    );
  }, [result]);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Camera permission is needed to take photos.");
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Gallery permission is needed to select photos.");
      return false;
    }
    return true;
  };

  const pickFromGallery = async () => {
    const ok = await requestGalleryPermission();
    if (!ok) return;

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (picked.canceled) return;
    const uri = picked.assets[0]?.uri;
    if (!uri) return;

    setImageUri(uri);
    setResult(null);
  };

  const captureFromCamera = async () => {
    const ok = await requestCameraPermission();
    if (!ok) return;

    const captured = await ImagePicker.launchCameraAsync({
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (captured.canceled) return;
    const uri = captured.assets[0]?.uri;
    if (!uri) return;

    setImageUri(uri);
    setResult(null);
  };

  const predict = async () => {
    if (!imageUri) {
      Alert.alert("No Image", "Please capture or select an image first.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      const filename = imageUri.split("/").pop() || "photo.jpg";
      const ext = filename.split(".").pop()?.toLowerCase();
      const mime =
        ext === "png" ? "image/png" :
        ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
        "image/jpeg";

      formData.append("file", {
        uri: imageUri,
        name: filename,
        type: mime,
      } as any);

      const res = await fetch(API_URL, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error (${res.status}): ${text}`);
      }

      const data = (await res.json()) as PredictionResponse;
      if (data.confidence > 1) data.confidence = data.confidence / 100;

      setResult(data);
    } catch (err: any) {
      Alert.alert("Prediction Failed", err?.message || "Network/Server error.");
    } finally {
      setIsLoading(false);
    }
  };

  const shareResult = async () => {
    if (!result) return;

    const msg =
      `Pineapple Pest Detection Result\n\n` +
      `Pest: ${pestInfo.title}\n` +
      `Confidence: ${confidencePct?.toFixed(1)}%\n\n` +
      `Risk: ${pestInfo.risk}\n` +
      `Symptoms:\n- ${pestInfo.symptoms.join("\n- ")}\n\n` +
      `Recommended Actions:\n- ${pestInfo.actions.join("\n- ")}`;

    await Share.share({ message: msg });
  };

  const handleSignOut = () => {
    navigation.reset({ index: 0, routes: [{ name: "SignIn" }] });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "High": return { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" };
      case "Medium": return { bg: "#fef3c7", border: "#fcd34d", text: "#92400e" };
      default: return { bg: "#d1fae5", border: "#6ee7b7", text: "#065f46" };
    }
  };

  const riskColors = getRiskColor(pestInfo.risk);

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <View style={{ paddingTop: insets.top, flex: 1 }}>
        {/* Professional Header */}
        <LinearGradient
          colors={["#064e3b", "#047857", "#059669"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700", letterSpacing: 0.5 }}>
                Pest Detection
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, marginTop: 6 }}>
                AI-powered pest identification system
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSignOut}
              activeOpacity={0.8}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.3)",
              }}
            >
              <Ionicons name="log-out-outline" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 6, fontSize: 13 }}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Section */}
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: "#f3f4f6",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: "#111827", fontWeight: "600", fontSize: 16 }}>
                  Image Preview
                </Text>
                {!!imageUri && (
                  <TouchableOpacity
                    onPress={() => {
                      setImageUri(null);
                      setResult(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: "#059669", fontWeight: "600", fontSize: 14 }}>
                      Clear
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ padding: 16 }}>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={{
                      width: "100%",
                      aspectRatio: 1,
                      borderRadius: 12,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      aspectRatio: 1,
                      borderRadius: 12,
                      backgroundColor: "#f9fafb",
                      borderWidth: 2,
                      borderColor: "#e5e7eb",
                      borderStyle: "dashed",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="image-outline" size={48} color="#9ca3af" />
                    <Text style={{ color: "#6b7280", marginTop: 12, fontSize: 15, fontWeight: "500" }}>
                      No image selected
                    </Text>
                    <Text style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>
                      Use camera or gallery below
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={captureFromCamera}
                activeOpacity={0.8}
                disabled={isLoading}
                style={{ flex: 1 }}
              >
                <View
                  style={{
                    backgroundColor: isLoading ? "#d1d5db" : "#059669",
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    shadowColor: "#059669",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isLoading ? 0 : 0.3,
                    shadowRadius: 4,
                    elevation: isLoading ? 0 : 4,
                  }}
                >
                  <Ionicons name="camera" size={20} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 8, fontSize: 15 }}>
                    Camera
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={pickFromGallery}
                activeOpacity={0.8}
                disabled={isLoading}
                style={{ flex: 1 }}
              >
                <View
                  style={{
                    backgroundColor: isLoading ? "#d1d5db" : "#0284c7",
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    shadowColor: "#0284c7",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isLoading ? 0 : 0.3,
                    shadowRadius: 4,
                    elevation: isLoading ? 0 : 4,
                  }}
                >
                  <Ionicons name="images" size={20} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 8, fontSize: 15 }}>
                    Gallery
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={predict}
              activeOpacity={0.9}
              disabled={isLoading || !imageUri}
              style={{ marginTop: 12 }}
            >
              <View
                style={{
                  backgroundColor: isLoading || !imageUri ? "#d1d5db" : "#1f2937",
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: isLoading || !imageUri ? 0 : 0.2,
                  shadowRadius: 6,
                  elevation: isLoading || !imageUri ? 0 : 5,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="sparkles" size={20} color="#fff" />
                )}
                <Text style={{ color: "#fff", fontWeight: "700", marginLeft: 10, fontSize: 16 }}>
                  {isLoading ? "Analyzing..." : "Run Detection"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Results Section */}
          {result && (
            <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                {/* Result Header */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ color: "#111827", fontWeight: "700", fontSize: 20 }}>
                    Detection Result
                  </Text>

                  <TouchableOpacity onPress={shareResult} activeOpacity={0.8}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#f3f4f6",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 10,
                      }}
                    >
                      <Ionicons name="share-social" size={16} color="#374151" />
                      <Text style={{ color: "#374151", fontWeight: "600", marginLeft: 6, fontSize: 13 }}>
                        Share
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Pest Info Card */}
                <View
                  style={{
                    marginTop: 16,
                    backgroundColor: riskColors.bg,
                    borderWidth: 1,
                    borderColor: riskColors.border,
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <Text style={{ color: riskColors.text, fontWeight: "700", fontSize: 18 }}>
                    {pestInfo.title}
                  </Text>
                  <View style={{ flexDirection: "row", marginTop: 8, flexWrap: "wrap" }}>
                    <Text style={{ color: riskColors.text, fontWeight: "600", fontSize: 14 }}>
                      Confidence: {confidencePct?.toFixed(1)}%
                    </Text>
                    <Text style={{ color: riskColors.text, marginHorizontal: 8 }}>•</Text>
                    <Text style={{ color: riskColors.text, fontWeight: "600", fontSize: 14 }}>
                      Risk: {pestInfo.risk}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <View style={{ marginTop: 20 }}>
                  <Text style={{ color: "#111827", fontWeight: "600", fontSize: 16, marginBottom: 8 }}>
                    Description
                  </Text>
                  <Text style={{ color: "#4b5563", fontSize: 14, lineHeight: 22 }}>
                    {pestInfo.description}
                  </Text>
                </View>

                {/* Symptoms */}
                <View style={{ marginTop: 20 }}>
                  <Text style={{ color: "#111827", fontWeight: "600", fontSize: 16, marginBottom: 8 }}>
                    Symptoms
                  </Text>
                  {pestInfo.symptoms.map((symptom, idx) => (
                    <View key={idx} style={{ flexDirection: "row", marginBottom: 8 }}>
                      <Text style={{ color: "#059669", marginRight: 8, fontWeight: "600" }}>•</Text>
                      <Text style={{ color: "#4b5563", fontSize: 14, lineHeight: 22, flex: 1 }}>
                        {symptom}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Actions */}
                <View style={{ marginTop: 20 }}>
                  <Text style={{ color: "#111827", fontWeight: "600", fontSize: 16, marginBottom: 8 }}>
                    Recommended Actions
                  </Text>
                  {pestInfo.actions.map((action, idx) => (
                    <View key={idx} style={{ flexDirection: "row", marginBottom: 8 }}>
                      <Text style={{ color: "#059669", marginRight: 8, fontWeight: "600" }}>
                        {idx + 1}.
                      </Text>
                      <Text style={{ color: "#4b5563", fontSize: 14, lineHeight: 22, flex: 1 }}>
                        {action}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default PestDetection;