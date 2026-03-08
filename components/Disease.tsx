import React, { useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Speech from "expo-speech";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";

const API_BASE = "http://172.20.10.9:3001";
const DISEASE_API_URL = `${API_BASE}/api/disease/predict`;

type Severity = "Low" | "Medium" | "High";

type Prediction = {
  disease: string;
  confidence: number;
  severity: Severity;
  notes: string[];
};

type HistoryItem = {
  id: string;
  imageUri: string;
  disease: string;
  confidence: number;
  severity: Severity;
  timestamp: Date;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type DiseaseInfo = {
  displayName: string;
  keywords: string[];
  earlyStage: string[];
  immediateActions: string[];
  prevention: string[];
  treatment: string[];
};

const norm = (s: string) => s.toLowerCase().replace(/[\s_\-]+/g, "");

const friendlyLabel = (raw: string, info: DiseaseInfo | null): string =>
  info
    ? info.displayName
    : raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const getSeverityColors = (sev: Severity) => {
  switch (sev) {
    case "High":
      return {
        bg: "#fee2e2",
        border: "#fca5a5",
        text: "#991b1b",
        badge: "#dc2626",
      };
    case "Medium":
      return {
        bg: "#fef3c7",
        border: "#fcd34d",
        text: "#92400e",
        badge: "#f59e0b",
      };
    default:
      return {
        bg: "#d1fae5",
        border: "#6ee7b7",
        text: "#065f46",
        badge: "#10b981",
      };
  }
};

const normalizeConfidence = (c: number): number => {
  if (typeof c !== "number" || Number.isNaN(c)) return 0;
  return c > 1 ? c / 100 : c;
};

const severityFromConfidence = (c: number): Severity => {
  if (c >= 0.8) return "High";
  if (c >= 0.6) return "Medium";
  return "Low";
};

const DISEASES: DiseaseInfo[] = [
  {
    displayName: "Fruit Fasciation",
    keywords: ["fruitfasciation", "fasciation", "fruitfasciationdisorder"],
    earlyStage: [
      "Look for flattened, ribbon-like fruit stems in young plants.",
      "Watch for abnormal widening or fusing of shoots at early growth stages.",
      "Young fruits may show unusual elongated or multi-lobed shapes.",
      "Inspect newly formed fruits for irregular ridges or grooves.",
    ],
    immediateActions: [
      "Remove and destroy all visibly fasciated fruits and stems immediately.",
      "Disinfect all pruning tools after each cut to prevent spread.",
      "Isolate affected rows and increase monitoring frequency.",
      "Report unusual clusters to your agronomist for expert confirmation.",
    ],
    prevention: [
      "Maintain strict field hygiene at all times.",
      "Remove infected plant debris promptly.",
      "Avoid mechanical injury to young fruits during cultivation.",
    ],
    treatment: [
      "Prune all infected fruits to prevent further spread.",
      "Monitor the affected area closely for recurring symptoms.",
      "Consult an agronomist for corrective and chemical measures.",
    ],
  },
  {
    displayName: "Fruit Rot",
    keywords: ["fruitrot", "fruitrotdisease"],
    earlyStage: [
      "Check for water-soaked, soft spots on the fruit surface.",
      "Look for slight brown or dark discoloration near the base of the fruit.",
      "Early infection may appear as faint white or grey mold on the skin.",
      "Smell the fruit base because early rot can produce a faint fermented odor.",
    ],
    immediateActions: [
      "Remove affected fruits immediately and dispose of them away from the field.",
      "Reduce irrigation to lower moisture levels around fruit bases.",
      "Apply a recommended fungicide spray to nearby healthy fruits.",
      "Improve canopy airflow by spacing plants or removing excess leaves.",
    ],
    prevention: [
      "Avoid overhead irrigation and keep fruits as dry as possible.",
      "Ensure good air circulation between plants.",
      "Remove and destroy decayed fruits regularly.",
    ],
    treatment: [
      "Remove and destroy all infected fruits.",
      "Use fungicide sprays as recommended by local experts.",
      "Maintain strict field sanitation throughout the season.",
    ],
  },
  {
    displayName: "Mealybug Wilt",
    keywords: ["mealybug", "mealybugwilt", "mealybugwiltdisease"],
    earlyStage: [
      "Look for tiny white cottony masses at the base of leaves.",
      "Inspect leaf axils and under-leaf surfaces for white powdery deposits.",
      "Early wilting begins at leaf tips and yellowing may appear first.",
      "Check for ant trails near plants because ants often protect mealybugs.",
    ],
    immediateActions: [
      "Apply targeted insecticide immediately to affected leaf bases.",
      "Set up ant bait stations to break the ant-mealybug relationship.",
      "Remove and bag heavily infested lower leaves to reduce population.",
      "Introduce or encourage natural predators like ladybugs in the field.",
    ],
    prevention: [
      "Inspect plants regularly, especially leaf axils, for early mealybug signs.",
      "Encourage natural predators as part of integrated pest management.",
      "Avoid spreading infestation through contaminated tools or clothing.",
    ],
    treatment: [
      "Apply appropriate systemic or contact insecticides.",
      "Remove and destroy heavily infested plants.",
      "Use organic or chemical control based on infestation severity.",
    ],
  },
  {
    displayName: "Root Rot",
    keywords: ["rootrot", "rootrotdisease"],
    earlyStage: [
      "Pull a lower leaf firmly because easy detachment is an early warning sign.",
      "Inspect roots for brown or black discoloration instead of healthy white or cream.",
      "Plant may appear wilted despite adequate soil moisture.",
      "Look for stunted growth compared to neighboring healthy plants.",
    ],
    immediateActions: [
      "Stop irrigation immediately and allow the soil to dry out.",
      "Carefully uproot the affected plant and inspect the root system.",
      "Trim all rotted roots back to healthy tissue using sterile tools.",
      "Drench the root zone with a recommended fungicide before replanting.",
    ],
    prevention: [
      "Improve soil drainage and avoid areas prone to waterlogging.",
      "Avoid overwatering and water only when necessary.",
      "Plant in well-aerated, well-draining soils.",
    ],
    treatment: [
      "Remove infected roots and replant with healthy material.",
      "Apply fungicides to the root zone if necessary.",
      "Monitor plant health closely and regularly after treatment.",
    ],
  },
];

const findDisease = (label: string): DiseaseInfo | null => {
  const key = norm(label);
  for (const d of DISEASES) {
    if (key.includes(norm(d.displayName)) || norm(d.displayName).includes(key)) {
      return d;
    }
    for (const kw of d.keywords) {
      if (key.includes(kw) || kw.includes(key)) return d;
    }
  }
  return null;
};

const Section = ({
  sectionKey,
  icon,
  title,
  headerBg,
  headerBorder,
  headerText,
  bodyBg,
  bodyBorder,
  bulletColor,
  itemText,
  items,
  numbered,
  openSections,
  toggleSection,
}: {
  sectionKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  headerBg: string;
  headerBorder: string;
  headerText: string;
  bodyBg: string;
  bodyBorder: string;
  bulletColor: string;
  itemText: string;
  items: string[];
  numbered: boolean;
  openSections: Record<string, boolean>;
  toggleSection: (key: string) => void;
}) => {
  const open = !!openSections[sectionKey];

  return (
    <View style={{ marginTop: 14 }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => toggleSection(sectionKey)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: headerBg,
          borderWidth: 1.5,
          borderColor: headerBorder,
          borderRadius: 14,
          borderBottomLeftRadius: open ? 0 : 14,
          borderBottomRightRadius: open ? 0 : 14,
          padding: 14,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Ionicons name={icon} size={18} color={headerText} />
          <Text
            style={{
              color: headerText,
              fontWeight: "700",
              fontSize: 15,
              flex: 1,
              marginLeft: 8,
            }}
          >
            {title}
          </Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={headerText}
        />
      </TouchableOpacity>

      {open && (
        <View
          style={{
            backgroundColor: bodyBg,
            borderWidth: 1,
            borderTopWidth: 0,
            borderColor: bodyBorder,
            borderBottomLeftRadius: 14,
            borderBottomRightRadius: 14,
            padding: 14,
          }}
        >
          {items.map((item, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: idx < items.length - 1 ? 10 : 0,
              }}
            >
              {numbered ? (
                <View
                  style={{
                    backgroundColor: bulletColor,
                    borderRadius: 11,
                    width: 22,
                    height: 22,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                    marginTop: 1,
                    flexShrink: 0,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    {idx + 1}
                  </Text>
                </View>
              ) : (
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={bulletColor}
                  style={{ marginRight: 8, marginTop: 1 }}
                />
              )}

              <Text
                style={{
                  color: itemText,
                  fontSize: 13,
                  lineHeight: 20,
                  flex: 1,
                }}
              >
                {item}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const DiseaseDetection: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const diseaseInfo = useMemo(
    () => (prediction ? findDisease(prediction.disease) : null),
    [prediction]
  );

  const diseaseName = useMemo(
    () => (prediction ? friendlyLabel(prediction.disease, diseaseInfo) : ""),
    [prediction, diseaseInfo]
  );

  const confidencePct = useMemo(
    () => (prediction ? Math.round(prediction.confidence * 100) : 0),
    [prediction]
  );

  React.useEffect(() => {
    if (prediction) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 55,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [prediction, fadeAnim, scaleAnim]);

  React.useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const stopSpeaking = () => {
    Speech.stop();
  };

  const speakDiseaseResult = async () => {
    if (!prediction) {
      Alert.alert("No Result", "Please analyze an image first.");
      return;
    }

    const earlySigns = diseaseInfo?.earlyStage?.slice(0, 3).join(". ") || "";
    const immediateActions =
      diseaseInfo?.immediateActions?.slice(0, 3).join(". ") || "";
    const prevention = diseaseInfo?.prevention?.slice(0, 2).join(". ") || "";

    const textToSpeak =
      `Disease detected. ${diseaseName || "Unknown disease"}. ` +
      `Confidence level ${confidencePct} percent. ` +
      `Risk level ${prediction.severity}. ` +
      (earlySigns ? `Early signs include: ${earlySigns}. ` : "") +
      (immediateActions
        ? `Immediate actions required: ${immediateActions}. `
        : "") +
      (prevention ? `Prevention tips: ${prevention}. ` : "") +
      `Please consult an agricultural expert before treatment.`;

    try {
      await Speech.stop();
      Speech.speak(textToSpeak, {
        language: "en-US",
        pitch: 1.0,
        rate: 0.9,
      });
    } catch {
      Alert.alert("Voice Error", "Unable to play text to speech.");
    }
  };

  const resetForNewImage = () => {
    Speech.stop();
    setPrediction(null);
    setOpenSections({});
  };

  const requestCameraPermission = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission Required", "Please allow camera access.");
      return false;
    }
    return true;
  };

  const requestGalleryPermission = async () => {
    const { granted } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission Required", "Please allow gallery access.");
      return false;
    }
    return true;
  };

  const pickFromCamera = async () => {
    const ok = await requestCameraPermission();
    if (!ok) return;

    resetForNewImage();

    const res = await ImagePicker.launchCameraAsync({
      quality: 0.9,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
      setShowImageOptions(false);
    }
  };

  const pickFromGallery = async () => {
    const ok = await requestGalleryPermission();
    if (!ok) return;

    resetForNewImage();

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
      setShowImageOptions(false);
    }
  };

  const analyzeImage = async () => {
    if (!imageUri) {
      Alert.alert("No Image", "Please capture or select an image first.");
      return;
    }

    setIsAnalyzing(true);
    resetForNewImage();

    try {
      const filename = imageUri.split("/").pop() || "photo.jpg";
      const ext = filename.split(".").pop()?.toLowerCase();
      const mime = ext === "png" ? "image/png" : "image/jpeg";

      const form = new FormData();
      form.append(
        "image",
        { uri: imageUri, name: filename, type: mime } as any
      );

      const res = await fetch(DISEASE_API_URL, {
        method: "POST",
        body: form,
        headers: { Accept: "application/json" },
      });

      const text = await res.text();
      let data: any = {};

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Non-JSON response: ${text}`);
      }

      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      const c01 = normalizeConfidence(Number(data.confidence));

      const result: Prediction = {
        disease: String(data.disease || data.label || "Unknown"),
        confidence: c01,
        severity: (data.severity as Severity) || severityFromConfidence(c01),
        notes: Array.isArray(data.notes) ? data.notes.map(String) : [],
      };

      setPrediction(result);
      setOpenSections({
        early: true,
        immediate: true,
        prevention: true,
        treatment: true,
      });

      setHistory((prev) => [
        {
          id: Date.now().toString(),
          imageUri,
          disease: result.disease,
          confidence: result.confidence,
          severity: result.severity,
          timestamp: new Date(),
        },
        ...prev.slice(0, 19),
      ]);
    } catch (err: any) {
      Alert.alert(
        "Analysis Failed",
        err?.message || "Failed to analyze. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Do you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () =>
          navigation.reset({ index: 0, routes: [{ name: "SignIn" }] }),
      },
    ]);
  };

  const severityColors = getSeverityColors(prediction?.severity || "Low");

  return (
    <View style={{ flex: 1, backgroundColor: "#064e3b" }}>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <LinearGradient
          colors={["#064e3b", "#166534", "#facc15"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 18,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1, marginRight: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "rgba(255,255,255,0.25)",
                      borderRadius: 12,
                      width: 48,
                      height: 48,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 8,
                    }}
                  >
                    <Ionicons name="medical" size={26} color="#ffffff" />
                  </View>
                  <View>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.9)",
                        fontSize: 13,
                        fontWeight: "500",
                      }}
                    >
                      AI-Powered Detection
                    </Text>
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 24,
                        fontWeight: "800",
                        marginTop: 2,
                      }}
                    >
                      Disease Analyzer
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: "row" }}>
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
                    marginRight: 8,
                  }}
                >
                  <Ionicons name="time-outline" size={22} color="#ffffff" />
                  {history.length > 0 && (
                    <View
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        backgroundColor: "#ef4444",
                        borderRadius: 8,
                        width: 16,
                        height: 16,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: "700",
                        }}
                      >
                        {history.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLogout}
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

            <Text
              style={{
                color: "rgba(255,255,255,0.95)",
                fontSize: 15,
                lineHeight: 22,
                marginTop: 12,
              }}
            >
              Upload a clear, well-lit image for accurate disease diagnosis and
              instant treatment guidance.
            </Text>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
              <View style={{ flexDirection: "row" }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: 14,
                    padding: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                    marginRight: 6,
                  }}
                >
                  <Ionicons name="medkit" size={24} color="#059669" />
                  <Text
                    style={{
                      color: "#111827",
                      fontSize: 24,
                      fontWeight: "800",
                      marginTop: 8,
                    }}
                  >
                    {history.length}
                  </Text>
                  <Text
                    style={{
                      color: "#6b7280",
                      fontSize: 13,
                      fontWeight: "500",
                      marginTop: 2,
                    }}
                  >
                    Total Scans
                  </Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderRadius: 14,
                    padding: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 3,
                    marginLeft: 6,
                  }}
                >
                  <Ionicons name="analytics" size={24} color="#f59e0b" />
                  <Text
                    style={{
                      color: "#111827",
                      fontSize: 24,
                      fontWeight: "800",
                      marginTop: 8,
                    }}
                  >
                    {prediction ? `${confidencePct}%` : "—"}
                  </Text>
                  <Text
                    style={{
                      color: "#6b7280",
                      fontSize: 13,
                      fontWeight: "500",
                      marginTop: 2,
                    }}
                  >
                    Last Confidence
                  </Text>
                </View>
              </View>
            </View>

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
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="image" size={20} color="#059669" />
                    <Text
                      style={{
                        color: "#111827",
                        fontWeight: "700",
                        fontSize: 16,
                        marginLeft: 8,
                      }}
                    >
                      Image Analysis
                    </Text>
                  </View>

                  {!!imageUri && (
                    <TouchableOpacity
                      onPress={() => {
                        Speech.stop();
                        setImageUri(null);
                        setPrediction(null);
                        setOpenSections({});
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          color: "#7c3aed",
                          fontWeight: "600",
                          fontSize: 14,
                        }}
                      >
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
                          aspectRatio: 1.1,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: "#e5e7eb",
                        }}
                        resizeMode="cover"
                      />

                      {isAnalyzing && (
                        <View
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0,0,0,0.7)",
                            borderRadius: 12,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ActivityIndicator size="large" color="#fff" />
                          <Text
                            style={{
                              color: "#fff",
                              marginTop: 12,
                              fontSize: 15,
                              fontWeight: "600",
                            }}
                          >
                            Analyzing Disease...
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
                          aspectRatio: 1.1,
                          borderRadius: 12,
                          backgroundColor: "#f9fafb",
                          borderWidth: 2,
                          borderColor: "#e5e7eb",
                          borderStyle: "dashed",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: "#059669",
                            borderRadius: 50,
                            width: 64,
                            height: 64,
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 16,
                          }}
                        >
                          <Ionicons name="add" size={32} color="#fff" />
                        </View>
                        <Text
                          style={{
                            color: "#111827",
                            fontSize: 16,
                            fontWeight: "600",
                          }}
                        >
                          Tap to Add Image
                        </Text>
                        <Text
                          style={{
                            color: "#9ca3af",
                            fontSize: 13,
                            marginTop: 4,
                          }}
                        >
                          Camera or gallery
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {imageUri && (
              <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
                <TouchableOpacity
                  onPress={analyzeImage}
                  activeOpacity={0.9}
                  disabled={isAnalyzing}
                  style={{ marginBottom: 12 }}
                >
                  <LinearGradient
                    colors={
                      isAnalyzing
                        ? ["#d1d5db", "#d1d5db"]
                        : ["#7c3aed", "#9333ea"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 14,
                      paddingVertical: 18,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      shadowColor: isAnalyzing ? "transparent" : "#7c3aed",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: isAnalyzing ? 0 : 6,
                    }}
                  >
                    {isAnalyzing ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Ionicons name="sparkles" size={22} color="#fff" />
                    )}
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                        marginLeft: 10,
                        fontSize: 17,
                      }}
                    >
                      {isAnalyzing ? "Analyzing Disease..." : "Analyze Disease"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowImageOptions(true)}
                  activeOpacity={0.8}
                  disabled={isAnalyzing}
                >
                  <View
                    style={{
                      backgroundColor: isAnalyzing ? "#f3f4f6" : "#fff",
                      borderRadius: 14,
                      paddingVertical: 16,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: isAnalyzing ? "#e5e7eb" : "#7c3aed",
                    }}
                  >
                    <Ionicons
                      name="sync"
                      size={20}
                      color={isAnalyzing ? "#9ca3af" : "#7c3aed"}
                    />
                    <Text
                      style={{
                        color: isAnalyzing ? "#9ca3af" : "#7c3aed",
                        fontWeight: "600",
                        marginLeft: 8,
                        fontSize: 15,
                      }}
                    >
                      Change Image
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {prediction && (
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
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                        marginRight: 10,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: "#f3e8ff",
                          borderRadius: 12,
                          width: 40,
                          height: 40,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 10,
                        }}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#7c3aed"
                        />
                      </View>
                      <Text
                        style={{
                          color: "#111827",
                          fontWeight: "800",
                          fontSize: 20,
                        }}
                      >
                        Detection Complete
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row" }}>
                      <TouchableOpacity
                        onPress={speakDiseaseResult}
                        activeOpacity={0.8}
                        style={{ marginRight: 8 }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#f3f4f6",
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderRadius: 12,
                          }}
                        >
                          <Ionicons
                            name="volume-high"
                            size={18}
                            color="#374151"
                          />
                          <Text
                            style={{
                              color: "#374151",
                              fontWeight: "600",
                              marginLeft: 6,
                              fontSize: 13,
                            }}
                          >
                            Speak
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={stopSpeaking} activeOpacity={0.8}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#fef2f2",
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderRadius: 12,
                          }}
                        >
                          <Ionicons
                            name="stop-circle"
                            size={18}
                            color="#b91c1c"
                          />
                          <Text
                            style={{
                              color: "#b91c1c",
                              fontWeight: "600",
                              marginLeft: 6,
                              fontSize: 13,
                            }}
                          >
                            Stop
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View
                    style={{
                      marginTop: 20,
                      backgroundColor: severityColors.bg,
                      borderWidth: 2,
                      borderColor: severityColors.border,
                      borderRadius: 14,
                      padding: 18,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: severityColors.text,
                            fontWeight: "800",
                            fontSize: 22,
                          }}
                        >
                          {diseaseName}
                        </Text>
                        <Text
                          style={{
                            color: severityColors.text,
                            fontSize: 13,
                            marginTop: 4,
                            opacity: 0.85,
                          }}
                        >
                          AI disease prediction result
                        </Text>
                      </View>

                      <View
                        style={{
                          backgroundColor: severityColors.badge,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 20,
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "700",
                            fontSize: 12,
                          }}
                        >
                          {prediction.severity} Risk
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        marginTop: 14,
                        flexDirection: "row",
                        flexWrap: "wrap",
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Ionicons
                          name="analytics"
                          size={16}
                          color={severityColors.text}
                        />
                        <Text
                          style={{
                            color: severityColors.text,
                            fontWeight: "600",
                            fontSize: 14,
                            marginLeft: 6,
                          }}
                        >
                          Confidence: {confidencePct}%
                        </Text>
                      </View>
                    </View>
                  </View>

                  {diseaseInfo ? (
                    <>
                      <Section
                        sectionKey="early"
                        icon="eye-outline"
                        title="How to Identify — Early Stage Signs"
                        headerBg="#fef3c7"
                        headerBorder="#fcd34d"
                        headerText="#92400e"
                        bodyBg="#fffbeb"
                        bodyBorder="#fde68a"
                        bulletColor="#f59e0b"
                        itemText="#78350f"
                        items={diseaseInfo.earlyStage}
                        numbered={true}
                        openSections={openSections}
                        toggleSection={toggleSection}
                      />

                      <Section
                        sectionKey="immediate"
                        icon="flash"
                        title="Immediate Actions Required"
                        headerBg="#fee2e2"
                        headerBorder="#fca5a5"
                        headerText="#991b1b"
                        bodyBg="#fff1f2"
                        bodyBorder="#fecaca"
                        bulletColor="#dc2626"
                        itemText="#991b1b"
                        items={diseaseInfo.immediateActions}
                        numbered={true}
                        openSections={openSections}
                        toggleSection={toggleSection}
                      />

                      <Section
                        sectionKey="prevention"
                        icon="shield-checkmark-outline"
                        title="Prevention Strategies"
                        headerBg="#d1fae5"
                        headerBorder="#6ee7b7"
                        headerText="#065f46"
                        bodyBg="#f0fdf4"
                        bodyBorder="#a7f3d0"
                        bulletColor="#10b981"
                        itemText="#065f46"
                        items={diseaseInfo.prevention}
                        numbered={false}
                        openSections={openSections}
                        toggleSection={toggleSection}
                      />

                      <Section
                        sectionKey="treatment"
                        icon="flask-outline"
                        title="Treatment Steps"
                        headerBg="#ede9fe"
                        headerBorder="#c4b5fd"
                        headerText="#5b21b6"
                        bodyBg="#f5f3ff"
                        bodyBorder="#ddd6fe"
                        bulletColor="#8b5cf6"
                        itemText="#5b21b6"
                        items={diseaseInfo.treatment}
                        numbered={true}
                        openSections={openSections}
                        toggleSection={toggleSection}
                      />
                    </>
                  ) : (
                    <View
                      style={{
                        backgroundColor: "#f9fafb",
                        borderRadius: 12,
                        padding: 18,
                        marginTop: 14,
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name="help-circle-outline"
                        size={40}
                        color="#9ca3af"
                      />
                      <Text
                        style={{
                          color: "#374151",
                          fontWeight: "700",
                          fontSize: 15,
                          marginTop: 12,
                          textAlign: "center",
                        }}
                      >
                        Disease Not in Reference Guide
                      </Text>
                      <Text
                        style={{
                          color: "#6b7280",
                          fontSize: 13,
                          marginTop: 6,
                          textAlign: "center",
                          lineHeight: 20,
                        }}
                      >
                        Consult a local agricultural expert for diagnosis and
                        treatment of "{diseaseName}".
                      </Text>
                    </View>
                  )}

                  {prediction.notes.length > 0 && (
                    <View
                      style={{
                        marginTop: 18,
                        paddingTop: 14,
                        borderTopWidth: 1,
                        borderTopColor: "#e5e7eb",
                      }}
                    >
                      <Text
                        style={{
                          color: "#111827",
                          fontWeight: "700",
                          fontSize: 16,
                          marginBottom: 10,
                        }}
                      >
                        Additional Notes
                      </Text>
                      {prediction.notes.map((n, idx) => (
                        <View
                          key={idx}
                          style={{
                            flexDirection: "row",
                            marginBottom: 8,
                            alignItems: "flex-start",
                          }}
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={18}
                            color="#16a34a"
                            style={{ marginTop: 1 }}
                          />
                          <Text
                            style={{
                              color: "#374151",
                              fontSize: 13,
                              marginLeft: 10,
                              flex: 1,
                              lineHeight: 20,
                            }}
                          >
                            {n}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View
                    style={{
                      marginTop: 18,
                      backgroundColor: "#fef3c7",
                      borderLeftWidth: 4,
                      borderLeftColor: "#f59e0b",
                      padding: 14,
                      borderRadius: 10,
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "flex-start" }}
                    >
                      <Ionicons
                        name="alert-circle"
                        size={20}
                        color="#d97706"
                        style={{ marginRight: 10, marginTop: 2 }}
                      />
                      <Text
                        style={{
                          color: "#92400e",
                          fontSize: 13,
                          lineHeight: 20,
                          flex: 1,
                        }}
                      >
                        AI-assisted diagnosis. Always consult a certified
                        agronomist before applying any treatments.
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
              <View
                style={{
                  width: 40,
                  height: 5,
                  backgroundColor: "#e5e7eb",
                  borderRadius: 10,
                  alignSelf: "center",
                  marginBottom: 20,
                }}
              />

              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                Add Image
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  marginBottom: 24,
                }}
              >
                Choose how you'd like to add your image
              </Text>

              <TouchableOpacity
                onPress={pickFromCamera}
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
                  <View
                    style={{
                      backgroundColor: "#059669",
                      borderRadius: 14,
                      width: 56,
                      height: 56,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="camera" size={28} color="#fff" />
                  </View>
                  <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: "700",
                        color: "#111827",
                        marginBottom: 4,
                      }}
                    >
                      Take Photo
                    </Text>
                    <Text style={{ fontSize: 14, color: "#6b7280" }}>
                      Capture image using camera
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color="#9ca3af"
                  />
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
                  <View
                    style={{
                      backgroundColor: "#0284c7",
                      borderRadius: 14,
                      width: 56,
                      height: 56,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="images" size={28} color="#fff" />
                  </View>
                  <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: "700",
                        color: "#111827",
                        marginBottom: 4,
                      }}
                    >
                      Choose from Gallery
                    </Text>
                    <Text style={{ fontSize: 14, color: "#6b7280" }}>
                      Select from your photos
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color="#9ca3af"
                  />
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
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#6b7280",
                    }}
                  >
                    Cancel
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
          <View style={{ paddingTop: insets.top }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 16,
                backgroundColor: "#fff",
                borderBottomWidth: 1,
                borderBottomColor: "#e5e7eb",
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: "#111827",
                }}
              >
                Detection History
              </Text>
              <TouchableOpacity
                onPress={() => setShowHistory(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: 20,
              paddingBottom: insets.bottom + 20,
            }}
          >
            {history.length === 0 ? (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 60,
                }}
              >
                <View
                  style={{
                    backgroundColor: "#e5e7eb",
                    borderRadius: 50,
                    width: 100,
                    height: 100,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}
                >
                  <Ionicons name="time-outline" size={50} color="#9ca3af" />
                </View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: 8,
                  }}
                >
                  No History Yet
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#6b7280",
                    textAlign: "center",
                  }}
                >
                  Your disease detection history will appear here
                </Text>
              </View>
            ) : (
              history.map((item) => {
                const sc = getSeverityColors(item.severity);
                const info = findDisease(item.disease);
                const name = friendlyLabel(item.disease, info);

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
                    <View style={{ flexDirection: "row" }}>
                      <Image
                        source={{ uri: item.imageUri }}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 12,
                          backgroundColor: "#f3f4f6",
                          marginRight: 14,
                        }}
                        resizeMode="cover"
                      />
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 6,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "700",
                              color: "#111827",
                              flex: 1,
                              marginRight: 8,
                            }}
                          >
                            {name}
                          </Text>
                          <View
                            style={{
                              backgroundColor: sc.badge,
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 12,
                            }}
                          >
                            <Text
                              style={{
                                color: "#fff",
                                fontSize: 11,
                                fontWeight: "700",
                              }}
                            >
                              {item.severity}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <Ionicons
                            name="analytics"
                            size={14}
                            color="#6b7280"
                          />
                          <Text
                            style={{
                              fontSize: 13,
                              color: "#6b7280",
                              marginLeft: 6,
                            }}
                          >
                            {(item.confidence * 100).toFixed(1)}% confidence
                          </Text>
                        </View>

                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color="#6b7280"
                          />
                          <Text
                            style={{
                              fontSize: 13,
                              color: "#6b7280",
                              marginLeft: 6,
                            }}
                          >
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

export default DiseaseDetection;