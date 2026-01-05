import React, { useMemo, useState, useRef } from "react";
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
  Animated,
  Modal,
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

type HistoryItem = {
  id: string;
  imageUri: string;
  pest: string;
  confidence: number;
  timestamp: Date;
  risk: "Low" | "Medium" | "High";
};

const API_URL = "http://192.168.8.181:8000/predict";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PestDetection: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

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
        scientificName: string;
        description: string;
        symptoms: string[];
        risk: "Low" | "Medium" | "High";
        actions: string[];
        prevention: string[];
        biologicalControl: string[];
        chemicalControl: string[];
      }
    > = {
      mealybug: {
        title: "Mealybug",
        scientificName: "Dysmicoccus brevipes",
        description:
          "Mealybugs are sap-sucking insects that weaken pineapple plants and can spread diseases. They often appear as white cottony clusters and are vectors of pineapple mealybug wilt-associated virus (PMWaV).",
        symptoms: [
          "White cotton-like insects at leaf bases or joints",
          "Leaf yellowing and stunted growth",
          "Sticky honeydew secretion and black sooty mold",
          "Increased ant activity near plants",
          "Wilting of leaves despite adequate water",
          "Reduced fruit size and quality",
        ],
        risk: "High",
        actions: [
          "Immediately isolate affected plants to prevent spread",
          "Remove heavily infested plant parts and destroy them",
          "Control ant populations (they protect mealybugs)",
          "Apply targeted insecticides during early infestation",
        ],
        prevention: [
          "Use certified disease-free planting material",
          "Maintain proper field sanitation",
          "Ensure adequate plant spacing (30-45cm) for airflow",
          "Regular monitoring and early detection",
          "Remove weeds that harbor mealybugs",
        ],
        biologicalControl: [
          "Release parasitoid wasps (Anagyrus loecki, Acerophagus papayae)",
          "Encourage natural predators like ladybugs and lacewings",
          "Use entomopathogenic fungi (Beauveria bassiana)",
        ],
        chemicalControl: [
          "Systemic insecticides: Imidacloprid (soil drench)",
          "Contact sprays: Diazinon or Malathion",
          "Insecticidal soap for light infestations",
          "Rotate pesticides to prevent resistance",
        ],
      },
      thrips: {
        title: "Thrips",
        scientificName: "Thrips tabaci, Frankliniella occidentalis",
        description:
          "Thrips are tiny (1-2mm) insects that damage plant tissues by rasping and sucking. They can cause silvery patches, leaf distortion, and transmit viral diseases to pineapple plants.",
        symptoms: [
          "Silvering or bronzing appearance on leaves",
          "Tiny black fecal spots on leaves",
          "Distorted or curled young leaves",
          "Scarring on fruits and plant surfaces",
          "Reduced photosynthesis capacity",
          "Premature leaf drop in severe cases",
        ],
        risk: "Medium",
        actions: [
          "Take additional close-up photos for confirmation",
          "Install blue or yellow sticky traps for monitoring",
          "Reduce water stress through proper irrigation",
          "Apply appropriate insecticides if threshold exceeded",
        ],
        prevention: [
          "Maintain optimal plant nutrition (NPK balance)",
          "Avoid water stress conditions",
          "Remove alternative host plants and weeds",
          "Use reflective mulches to repel thrips",
          "Screen nursery structures with fine mesh",
        ],
        biologicalControl: [
          "Release predatory mites (Neoseiulus cucumeris)",
          "Use minute pirate bugs (Orius insidiosus)",
          "Apply neem oil or spinosad-based products",
          "Encourage beneficial insects with flowering plants",
        ],
        chemicalControl: [
          "Spinosad-based insecticides (organic option)",
          "Systemic neonicotinoids for severe outbreaks",
          "Abamectin for thrips control",
          "Avoid broad-spectrum insecticides (harm beneficials)",
        ],
      },
    };

    return (
      infoMap[label] || {
        title: result?.label || "Unknown",
        scientificName: "Classification pending",
        description:
          "This pest classification requires further analysis. Please capture a clearer image in good lighting conditions or consult with a local agricultural expert.",
        symptoms: ["Capture a clearer close-up image in good natural light"],
        risk: "Low" as const,
        actions: [
          "Retake photo with better lighting",
          "Focus on affected plant area",
          "Consult local agricultural extension office",
        ],
        prevention: ["Regular monitoring", "Good field hygiene"],
        biologicalControl: ["Encourage natural predators"],
        chemicalControl: ["Consult agricultural expert"],
      }
    );
  }, [result]);

  // Animation when result appears
  React.useEffect(() => {
    if (result) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
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
    setShowImageOptions(false);
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
    setShowImageOptions(false);
  };

  const predict = async () => {
    if (!imageUri) {
      Alert.alert("No Image", "Please capture or select an image first.");
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

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

      const endTime = Date.now();
      setProcessingTime(endTime - startTime);
      setResult(data);

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        imageUri,
        pest: data.label,
        confidence: data.confidence,
        timestamp: new Date(),
        risk: pestInfo.risk,
      };
      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 9)]);
    } catch (err: any) {
      Alert.alert("Prediction Failed", err?.message || "Network/Server error.");
    } finally {
      setIsLoading(false);
    }
  };

  const shareResult = async () => {
    if (!result) return;

    const msg =
      `🌿 Pineapple Pest Detection Report\n\n` +
      `Pest Identified: ${pestInfo.title}\n` +
      `Scientific Name: ${pestInfo.scientificName}\n` +
      `Confidence Level: ${confidencePct?.toFixed(1)}%\n` +
      `Risk Assessment: ${pestInfo.risk}\n` +
      `Detection Time: ${processingTime}ms\n\n` +
      `📋 Symptoms:\n${pestInfo.symptoms.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n` +
      `✅ Immediate Actions:\n${pestInfo.actions.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n\n` +
      `🛡️ Prevention:\n${pestInfo.prevention.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\n` +
      `Generated by Pineapple Pest Detection AI`;

    await Share.share({ message: msg });
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => navigation.reset({ index: 0, routes: [{ name: "SignIn" }] }),
        },
      ]
    );
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "High": return { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b", badge: "#dc2626" };
      case "Medium": return { bg: "#fef3c7", border: "#fcd34d", text: "#92400e", badge: "#f59e0b" };
      default: return { bg: "#d1fae5", border: "#6ee7b7", text: "#065f46", badge: "#10b981" };
    }
  };

  const riskColors = getRiskColor(pestInfo.risk);

  return (
    <View style={{ flex: 1, backgroundColor: "#064e3b" }}>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <LinearGradient
          colors={["#064e3b", "#166534", "#facc15"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          {/* Professional Header */}
          <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ 
                    backgroundColor: "rgba(255,255,255,0.25)", 
                    borderRadius: 12, 
                    width: 48, 
                    height: 48, 
                    alignItems: "center", 
                    justifyContent: "center" 
                  }}>
                    <Ionicons name="bug" size={26} color="#ffffff" />
                  </View>
                  <View>
                    <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "500" }}>
                      AI-Powered Detection
                    </Text>
                    <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 2 }}>
                      Pest Analyzer
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setShowHistory(true)}
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
                  <Ionicons name="time-outline" size={22} color="#ffffff" />
                  {history.length > 0 && (
                    <View style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      backgroundColor: "#ef4444",
                      borderRadius: 8,
                      width: 16,
                      height: 16,
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                        {history.length}
                      </Text>
                    </View>
                  )}
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

            <Text style={{ color: "rgba(255,255,255,0.95)", fontSize: 15, lineHeight: 22, marginTop: 12 }}>
              Upload a clear, well-lit image for accurate pest identification and instant treatment recommendations.
            </Text>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Stats Cards */}
            <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ 
                  flex: 1, 
                  backgroundColor: "rgba(255,255,255,0.95)", 
                  borderRadius: 14, 
                  padding: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  <Text style={{ color: "#111827", fontSize: 24, fontWeight: "800", marginTop: 8 }}>
                    {history.length}
                  </Text>
                  <Text style={{ color: "#6b7280", fontSize: 13, fontWeight: "500", marginTop: 2 }}>
                    Total Scans
                  </Text>
                </View>

                <View style={{ 
                  flex: 1, 
                  backgroundColor: "rgba(255,255,255,0.95)", 
                  borderRadius: 14, 
                  padding: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}>
                  <Ionicons name="flash" size={24} color="#f59e0b" />
                  <Text style={{ color: "#111827", fontSize: 24, fontWeight: "800", marginTop: 8 }}>
                    {processingTime ? `${processingTime}ms` : "—"}
                  </Text>
                  <Text style={{ color: "#6b7280", fontSize: 13, fontWeight: "500", marginTop: 2 }}>
                    Last Speed
                  </Text>
                </View>
              </View>
            </View>

            {/* Image Preview Card */}
            <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.12,
                  shadowRadius: 12,
                  elevation: 5,
                  overflow: "hidden",
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
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="image" size={20} color="#059669" />
                    <Text style={{ color: "#111827", fontWeight: "700", fontSize: 16 }}>
                      Image Analysis
                    </Text>
                  </View>
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
                    <View>
                      <Image
                        source={{ uri: imageUri }}
                        style={{ 
                          width: "100%", 
                          aspectRatio: 1, 
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: "#e5e7eb",
                        }}
                        resizeMode="cover"
                      />
                      {isLoading && (
                        <View style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: "rgba(0,0,0,0.7)",
                          borderRadius: 12,
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <ActivityIndicator size="large" color="#fff" />
                          <Text style={{ color: "#fff", marginTop: 12, fontSize: 15, fontWeight: "600" }}>
                            Analyzing Image...
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <TouchableOpacity 
                      onPress={() => setShowImageOptions(true)}
                      activeOpacity={0.8}
                    >
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
                        <View style={{
                          backgroundColor: "#059669",
                          borderRadius: 50,
                          width: 64,
                          height: 64,
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 16,
                        }}>
                          <Ionicons name="add" size={32} color="#fff" />
                        </View>
                        <Text style={{ color: "#111827", fontSize: 16, fontWeight: "600" }}>
                          Tap to Add Image
                        </Text>
                        <Text style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>
                          Camera or gallery
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            {imageUri && (
              <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
                <TouchableOpacity
                  onPress={predict}
                  activeOpacity={0.9}
                  disabled={isLoading}
                  style={{ marginBottom: 12 }}
                >
                  <LinearGradient
                    colors={isLoading ? ["#d1d5db", "#d1d5db"] : ["#059669", "#047857"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 14,
                      paddingVertical: 18,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      shadowColor: isLoading ? "transparent" : "#059669",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: isLoading ? 0 : 6,
                    }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Ionicons name="sparkles" size={22} color="#fff" />
                    )}
                    <Text style={{ color: "#fff", fontWeight: "700", marginLeft: 10, fontSize: 17 }}>
                      {isLoading ? "Analyzing Pest..." : "Analyze Pest"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowImageOptions(true)}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  <View
                    style={{
                      backgroundColor: isLoading ? "#f3f4f6" : "#fff",
                      borderRadius: 14,
                      paddingVertical: 16,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: isLoading ? "#e5e7eb" : "#059669",
                    }}
                  >
                    <Ionicons name="sync" size={20} color={isLoading ? "#9ca3af" : "#059669"} />
                    <Text style={{ 
                      color: isLoading ? "#9ca3af" : "#059669", 
                      fontWeight: "600", 
                      marginLeft: 8, 
                      fontSize: 15 
                    }}>
                      Change Image
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Detection Result */}
            {result && (
              <Animated.View 
                style={{ 
                  paddingHorizontal: 20, 
                  marginTop: 24,
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                }}
              >
                <View
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 18,
                    padding: 20,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 6,
                  }}
                >
                  {/* Result Header */}
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={{
                        backgroundColor: "#ecfdf5",
                        borderRadius: 12,
                        width: 40,
                        height: 40,
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                      </View>
                      <Text style={{ color: "#111827", fontWeight: "800", fontSize: 20 }}>
                        Detection Complete
                      </Text>
                    </View>

                    <TouchableOpacity onPress={shareResult} activeOpacity={0.8}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: "#f3f4f6",
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: 12,
                        }}
                      >
                        <Ionicons name="share-social" size={18} color="#374151" />
                        <Text style={{ color: "#374151", fontWeight: "600", marginLeft: 6, fontSize: 14 }}>
                          Share
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Pest Info Card */}
                  <View
                    style={{
                      marginTop: 20,
                      backgroundColor: riskColors.bg,
                      borderWidth: 2,
                      borderColor: riskColors.border,
                      borderRadius: 14,
                      padding: 18,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: riskColors.text, fontWeight: "800", fontSize: 22 }}>
                          {pestInfo.title}
                        </Text>
                        <Text style={{ color: riskColors.text, fontSize: 13, fontStyle: "italic", marginTop: 4, opacity: 0.8 }}>
                          {pestInfo.scientificName}
                        </Text>
                      </View>
                      <View style={{
                        backgroundColor: riskColors.badge,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                      }}>
                        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
                          {pestInfo.risk} Risk
                        </Text>
                      </View>
                    </View>

                    <View style={{ marginTop: 14, flexDirection: "row", gap: 16 }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons name="analytics" size={16} color={riskColors.text} />
                        <Text style={{ color: riskColors.text, fontWeight: "600", fontSize: 14, marginLeft: 6 }}>
                          Confidence: {confidencePct?.toFixed(1)}%
                        </Text>
                      </View>
                      {processingTime && (
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="speedometer" size={16} color={riskColors.text} />
                          <Text style={{ color: riskColors.text, fontWeight: "600", fontSize: 14, marginLeft: 6 }}>
                            {processingTime}ms
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Description */}
                  <View style={{ marginTop: 22 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                      <Ionicons name="information-circle" size={20} color="#059669" />
                      <Text style={{ color: "#111827", fontWeight: "700", fontSize: 17, marginLeft: 8 }}>
                        Description
                      </Text>
                    </View>
                    <Text style={{ color: "#4b5563", fontSize: 14, lineHeight: 22 }}>
                      {pestInfo.description}
                    </Text>
                  </View>

                  {/* Symptoms */}
                  <View style={{ marginTop: 22 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                      <Ionicons name="warning" size={20} color="#f59e0b" />
                      <Text style={{ color: "#111827", fontWeight: "700", fontSize: 17, marginLeft: 8 }}>
                        Symptoms to Watch For
                      </Text>
                    </View>
                    {pestInfo.symptoms.map((symptom, idx) => (
                      <View key={idx} style={{ flexDirection: "row", marginBottom: 10, alignItems: "flex-start" }}>
                        <View style={{
                          backgroundColor: "#10b981",
                          borderRadius: 10,
                          width: 20,
                          height: 20,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 10,
                          marginTop: 2,
                        }}>
                          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{idx + 1}</Text>
                        </View>
                        <Text style={{ color: "#4b5563", fontSize: 14, lineHeight: 22, flex: 1 }}>
                          {symptom}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Immediate Actions */}
                  <View style={{ marginTop: 22 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                      <Ionicons name="flash" size={20} color="#dc2626" />
                      <Text style={{ color: "#111827", fontWeight: "700", fontSize: 17, marginLeft: 8 }}>
                        Immediate Actions Required
                      </Text>
                    </View>
                    {pestInfo.actions.map((action, idx) => (
                      <View key={idx} style={{ flexDirection: "row", marginBottom: 10, alignItems: "flex-start" }}>
                        <View style={{
                          backgroundColor: "#dc2626",
                          borderRadius: 10,
                          width: 20,
                          height: 20,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 10,
                          marginTop: 2,
                        }}>
                          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{idx + 1}</Text>
                        </View>
                        <Text style={{ color: "#4b5563", fontSize: 14, lineHeight: 22, flex: 1 }}>
                          {action}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Prevention */}
                  <View style={{ marginTop: 22 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                      <Ionicons name="shield-checkmark" size={20} color="#3b82f6" />
                      <Text style={{ color: "#111827", fontWeight: "700", fontSize: 17, marginLeft: 8 }}>
                        Prevention Strategies
                      </Text>
                    </View>
                    {pestInfo.prevention.map((item, idx) => (
                      <View key={idx} style={{ flexDirection: "row", marginBottom: 10, alignItems: "flex-start" }}>
                        <Ionicons name="checkmark-circle" size={20} color="#3b82f6" style={{ marginRight: 8, marginTop: 2 }} />
                        <Text style={{ color: "#4b5563", fontSize: 14, lineHeight: 22, flex: 1 }}>
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Biological Control */}
                  <View style={{ marginTop: 22 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                      <Ionicons name="leaf" size={20} color="#10b981" />
                      <Text style={{ color: "#111827", fontWeight: "700", fontSize: 17, marginLeft: 8 }}>
                        Biological Control Methods
                      </Text>
                    </View>
                    {pestInfo.biologicalControl.map((item, idx) => (
                      <View key={idx} style={{ flexDirection: "row", marginBottom: 10, alignItems: "flex-start" }}>
                        <Ionicons name="leaf-outline" size={18} color="#10b981" style={{ marginRight: 8, marginTop: 2 }} />
                        <Text style={{ color: "#4b5563", fontSize: 14, lineHeight: 22, flex: 1 }}>
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Chemical Control */}
                  <View style={{ marginTop: 22 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                      <Ionicons name="flask" size={20} color="#8b5cf6" />
                      <Text style={{ color: "#111827", fontWeight: "700", fontSize: 17, marginLeft: 8 }}>
                        Chemical Control Options
                      </Text>
                    </View>
                    {pestInfo.chemicalControl.map((item, idx) => (
                      <View key={idx} style={{ flexDirection: "row", marginBottom: 10, alignItems: "flex-start" }}>
                        <Ionicons name="medical" size={18} color="#8b5cf6" style={{ marginRight: 8, marginTop: 2 }} />
                        <Text style={{ color: "#4b5563", fontSize: 14, lineHeight: 22, flex: 1 }}>
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Warning Footer */}
                  <View style={{
                    marginTop: 22,
                    backgroundColor: "#fef3c7",
                    borderLeftWidth: 4,
                    borderLeftColor: "#f59e0b",
                    padding: 14,
                    borderRadius: 10,
                  }}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                      <Ionicons name="alert-circle" size={20} color="#d97706" style={{ marginRight: 10, marginTop: 2 }} />
                      <Text style={{ color: "#92400e", fontSize: 13, lineHeight: 20, flex: 1 }}>
                        Always consult with a local agricultural expert before applying any treatments. 
                        Follow all safety guidelines and local regulations when using pesticides.
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>
        </LinearGradient>
      </View>

      {/* Image Options Modal */}
      <Modal
        visible={showImageOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageOptions(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowImageOptions(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity activeOpacity={1}>
            <View
              style={{
                backgroundColor: "#fff",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingBottom: insets.bottom + 20,
                paddingTop: 24,
                paddingHorizontal: 20,
              }}
            >
              <View style={{
                width: 40,
                height: 5,
                backgroundColor: "#e5e7eb",
                borderRadius: 10,
                alignSelf: "center",
                marginBottom: 20,
              }} />

              <Text style={{ fontSize: 22, fontWeight: "800", color: "#111827", marginBottom: 8 }}>
                Add Image
              </Text>
              <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
                Choose how you'd like to add your image
              </Text>

              <TouchableOpacity
                onPress={captureFromCamera}
                activeOpacity={0.8}
                style={{ marginBottom: 12 }}
              >
                <View
                  style={{
                    backgroundColor: "#f9fafb",
                    borderRadius: 16,
                    padding: 18,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: "#e5e7eb",
                  }}
                >
                  <View style={{
                    backgroundColor: "#059669",
                    borderRadius: 14,
                    width: 56,
                    height: 56,
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Ionicons name="camera" size={28} color="#fff" />
                  </View>
                  <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text style={{ fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 4 }}>
                      Take Photo
                    </Text>
                    <Text style={{ fontSize: 14, color: "#6b7280" }}>
                      Capture image using camera
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={pickFromGallery}
                activeOpacity={0.8}
                style={{ marginBottom: 12 }}
              >
                <View
                  style={{
                    backgroundColor: "#f9fafb",
                    borderRadius: 16,
                    padding: 18,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: "#e5e7eb",
                  }}
                >
                  <View style={{
                    backgroundColor: "#0284c7",
                    borderRadius: 14,
                    width: 56,
                    height: 56,
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Ionicons name="images" size={28} color="#fff" />
                  </View>
                  <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text style={{ fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 4 }}>
                      Choose from Gallery
                    </Text>
                    <Text style={{ fontSize: 14, color: "#6b7280" }}>
                      Select from your photos
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowImageOptions(false)}
                activeOpacity={0.8}
                style={{ marginTop: 8 }}
              >
                <View
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 16,
                    padding: 18,
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: "#e5e7eb",
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#6b7280" }}>
                    Cancel
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
          <View style={{ paddingTop: insets.top }}>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 16,
              backgroundColor: "#fff",
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
            }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: "#111827" }}>
                Detection History
              </Text>
              <TouchableOpacity onPress={() => setShowHistory(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 20 }}
          >
            {history.length === 0 ? (
              <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 60 }}>
                <View style={{
                  backgroundColor: "#e5e7eb",
                  borderRadius: 50,
                  width: 100,
                  height: 100,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}>
                  <Ionicons name="time-outline" size={50} color="#9ca3af" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8 }}>
                  No History Yet
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}>
                  Your pest detection history will appear here
                </Text>
              </View>
            ) : (
              history.map((item) => {
                const itemRiskColors = getRiskColor(item.risk);
                return (
                  <View
                    key={item.id}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 16,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      elevation: 3,
                    }}
                  >
                    <View style={{ flexDirection: "row", gap: 14 }}>
                      <Image
                        source={{ uri: item.imageUri }}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 12,
                          backgroundColor: "#f3f4f6",
                        }}
                        resizeMode="cover"
                      />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>
                            {item.pest}
                          </Text>
                          <View style={{
                            backgroundColor: itemRiskColors.badge,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                          }}>
                            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
                              {item.risk}
                            </Text>
                          </View>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                          <Ionicons name="analytics" size={14} color="#6b7280" />
                          <Text style={{ fontSize: 13, color: "#6b7280", marginLeft: 6 }}>
                            {(item.confidence * 100).toFixed(1)}% confidence
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="time-outline" size={14} color="#6b7280" />
                          <Text style={{ fontSize: 13, color: "#6b7280", marginLeft: 6 }}>
                            {item.timestamp.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default PestDetection