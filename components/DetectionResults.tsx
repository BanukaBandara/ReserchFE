import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { generateVoiceAlert } from "../services/apiService";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { HealthStatus, HealthIssue } from "../types/detection";

const { width } = Dimensions.get("window");

const DetectionResults: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const detection = useAppSelector(
    (state) => state.detections.currentDetection
  );
  const plants = useAppSelector((state) => state.plants.plants);

  if (!detection) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500 text-lg">
          No detection data available
        </Text>
      </SafeAreaView>
    );
  }

  const healthColor =
    detection.health_status === HealthStatus.HEALTHY
      ? "#10b981"
      : detection.health_status === HealthStatus.WARNING
      ? "#f59e0b"
      : "#ef4444";

  const healthBgColor =
    detection.health_status === HealthStatus.HEALTHY
      ? "#d1fae5"
      : detection.health_status === HealthStatus.WARNING
      ? "#fef3c7"
      : "#fee2e2";

  const handlePlayVoiceAlert = async () => {
    try {
      const response = await generateVoiceAlert(detection.id, "en");
      // In a real app, you would play the audio here
      alert("Voice alert generated:\n" + response.message_text);
    } catch (error) {
      console.error("Error generating voice alert:", error);
    }
  };

  const handleAddToExistingPlant = () => {
    if (plants.length > 0) {
      navigation.navigate("PlantTracker");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Image */}
        <View className="bg-white">
          {detection.imageUri && (
            <Image
              source={{ uri: detection.imageUri }}
              className="w-full h-80"
              resizeMode="cover"
            />
          )}

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="absolute top-4 left-4 bg-black/50 rounded-full p-2"
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
        </View>

        <View className="p-4">
          {/* Primary Results Card */}
          <View className="bg-white rounded-3xl p-6 mb-4 shadow-md">
            {/* Growth Stage */}
            <View className="mb-6 pb-6 border-b border-gray-200">
              <Text className="text-gray-600 text-sm font-semibold mb-2">
                GROWTH STAGE
              </Text>
              <View className="flex-row items-center">
                <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mr-4">
                  <MaterialCommunityIcons
                    name="leaf"
                    size={32}
                    color="#0891b2"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-3xl font-bold text-gray-800">
                    {detection.growth_stage.charAt(0).toUpperCase() +
                      detection.growth_stage.slice(1)}
                  </Text>
                  <Text className="text-gray-500 mt-1">
                    Confidence: {(detection.confidence * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Health Status */}
            <View>
              <Text className="text-gray-600 text-sm font-semibold mb-2">
                HEALTH STATUS
              </Text>
              <View
                className="p-4 rounded-2xl flex-row items-center"
                style={{ backgroundColor: healthBgColor }}
              >
                <MaterialCommunityIcons
                  name={
                    detection.health_status === HealthStatus.HEALTHY
                      ? "heart"
                      : detection.health_status === HealthStatus.WARNING
                      ? "alert-circle"
                      : "heart-broken"
                  }
                  size={32}
                  color={healthColor}
                />
                <View className="ml-4 flex-1">
                  <Text
                    className="text-xl font-bold"
                    style={{ color: healthColor }}
                  >
                    {detection.health_status.toUpperCase()}
                  </Text>
                  <Text className="text-gray-700 mt-1">
                    {detection.health_status === HealthStatus.HEALTHY
                      ? "Plant appears healthy and developing well"
                      : detection.health_status === HealthStatus.WARNING
                      ? "Minor issues detected - monitor closely"
                      : "Critical issues detected - immediate action needed"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Health Issues */}
          {detection.health_issues && detection.health_issues.length > 0 && (
            <View className="bg-white rounded-3xl p-6 mb-4 shadow-md">
              <Text className="text-lg font-bold text-gray-800 mb-4">
                Health Issues Detected ({detection.health_issues.length})
              </Text>

              {detection.health_issues.map(
                (issue: HealthIssue, idx: number) => (
                  <HealthIssueCard key={idx} issue={issue} />
                )
              )}
            </View>
          )}

          {/* Stunted Growth Analysis */}
          {detection.stunted_growth && (
            <View className="bg-white rounded-3xl p-6 mb-4 shadow-md">
              <View className="flex-row items-center mb-4">
                <MaterialCommunityIcons
                  name="chart-line"
                  size={28}
                  color={
                    detection.stunted_growth.isStunted ? "#ef4444" : "#10b981"
                  }
                />
                <Text className="text-lg font-bold text-gray-800 ml-3">
                  Growth Analysis
                </Text>
              </View>

              {detection.stunted_growth.isStunted ? (
                <View className="bg-red-50 p-4 rounded-2xl">
                  <Text className="text-red-700 font-bold mb-2">
                    ⚠️ Stunted Growth Detected
                  </Text>
                  <Text className="text-red-600 text-sm mb-3">
                    Severity:{" "}
                    <Text className="font-bold">
                      {detection.stunted_growth.severity?.toUpperCase()}
                    </Text>
                  </Text>

                  {detection.stunted_growth.estimatedHeightDeficit && (
                    <Text className="text-red-600 text-sm mb-2">
                      Height Deficit: ~
                      {detection.stunted_growth.estimatedHeightDeficit}cm
                    </Text>
                  )}

                  <Text className="text-red-600 text-sm font-semibold mb-2">
                    Potential Causes:
                  </Text>
                  {detection.stunted_growth.potentialCauses?.map(
                    (cause: string, idx: number) => (
                      <Text
                        key={idx}
                        className="text-red-600 text-sm ml-2 mb-1"
                      >
                        • {cause}
                      </Text>
                    )
                  )}
                </View>
              ) : (
                <View className="bg-green-50 p-4 rounded-2xl">
                  <Text className="text-green-700 font-bold">
                    ✓ Growth is Normal
                  </Text>
                  <Text className="text-green-600 text-sm mt-1">
                    Plant is developing at expected rate for this stage
                  </Text>
                </View>
              )}

              {detection.stunted_growth.recommendations && (
                <View className="mt-4">
                  <Text className="text-gray-800 font-bold mb-2">
                    Recommendations:
                  </Text>
                  {detection.stunted_growth.recommendations.map(
                    (rec: string, idx: number) => (
                      <View key={idx} className="flex-row mb-2">
                        <Text className="text-blue-600 font-bold mr-2">→</Text>
                        <Text className="text-gray-700 flex-1">{rec}</Text>
                      </View>
                    )
                  )}
                </View>
              )}
            </View>
          )}

          {/* Nutrient Analysis */}
          {detection.nutrient_analysis && (
            <View className="bg-white rounded-3xl p-6 mb-4 shadow-md">
              <View className="flex-row items-center mb-4">
                <MaterialCommunityIcons
                  name="beaker"
                  size={28}
                  color="#f59e0b"
                />
                <Text className="text-lg font-bold text-gray-800 ml-3">
                  Nutrient Analysis
                </Text>
              </View>

              {detection.nutrient_analysis.primaryDeficiency &&
                detection.nutrient_analysis.primaryDeficiency !== "none" && (
                  <View className="bg-yellow-50 p-4 rounded-2xl mb-4">
                    <Text className="text-yellow-700 font-bold mb-2">
                      Primary Deficiency:{" "}
                      {detection.nutrient_analysis.primaryDeficiency.toUpperCase()}
                    </Text>
                    <Text className="text-yellow-600 text-sm mb-3">
                      Estimated Recovery: ~
                      {detection.nutrient_analysis.estimatedRecoveryDays} days
                      with treatment
                    </Text>

                    <Text className="text-gray-800 font-bold mb-2">
                      Symptoms:
                    </Text>
                    {detection.nutrient_analysis.symptoms?.map(
                      (symptom: string, idx: number) => (
                        <Text key={idx} className="text-gray-700 text-sm mb-1">
                          • {symptom}
                        </Text>
                      )
                    )}

                    <Text className="text-gray-800 font-bold mt-3 mb-2">
                      Treatment:
                    </Text>
                    {detection.nutrient_analysis.treatments?.map(
                      (treatment: string, idx: number) => (
                        <Text key={idx} className="text-gray-700 text-sm mb-1">
                          • {treatment}
                        </Text>
                      )
                    )}
                  </View>
                )}

              {detection.nutrient_analysis.secondaryDeficiencies &&
                detection.nutrient_analysis.secondaryDeficiencies.length >
                  0 && (
                  <View>
                    <Text className="text-gray-800 font-bold mb-2">
                      Secondary Deficiencies:
                    </Text>
                    {detection.nutrient_analysis.secondaryDeficiencies.map(
                      (def: string, idx: number) => (
                        <View
                          key={idx}
                          className="bg-orange-50 p-3 rounded-xl mb-2"
                        >
                          <Text className="text-orange-700 font-semibold">
                            {def.toUpperCase()}
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                )}
            </View>
          )}

          {/* Recommendations */}
          {detection.recommendations &&
            detection.recommendations.length > 0 && (
              <View className="bg-white rounded-3xl p-6 mb-4 shadow-md">
                <Text className="text-lg font-bold text-gray-800 mb-4">
                  Recommendations ({detection.recommendations.length})
                </Text>

                {detection.recommendations.map((rec: string, idx: number) => (
                  <View key={idx} className="bg-blue-50 p-3 rounded-xl mb-3">
                    <View className="flex-row">
                      <Text className="text-blue-600 font-bold mr-3">→</Text>
                      <Text className="text-gray-700 flex-1">{rec}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

          {/* Action Items */}
          {detection.action_items && detection.action_items.length > 0 && (
            <View className="bg-white rounded-3xl p-6 mb-4 shadow-md">
              <Text className="text-lg font-bold text-gray-800 mb-4">
                Action Items
              </Text>

              {detection.action_items.map((action: string, idx: number) => (
                <View
                  key={idx}
                  className="flex-row items-center bg-purple-50 p-3 rounded-xl mb-3"
                >
                  <MaterialCommunityIcons
                    name="checkbox-marked-circle"
                    size={20}
                    color="#7c3aed"
                  />
                  <Text className="text-gray-700 flex-1 ml-3">{action}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Voice Alert Button */}
          <TouchableOpacity
            onPress={handlePlayVoiceAlert}
            className="bg-indigo-600 py-4 rounded-2xl flex-row items-center justify-center mb-4"
          >
            <MaterialCommunityIcons
              name="volume-high"
              size={24}
              color="white"
            />
            <Text className="text-white text-lg font-bold ml-2">
              Play Voice Alert
            </Text>
          </TouchableOpacity>

          {/* Save to Plant */}
          {!detection.plantId && (
            <View className="bg-white rounded-3xl p-6 mb-4 shadow-md">
              <Text className="text-lg font-bold text-gray-800 mb-4">
                Save This Analysis
              </Text>
              <TouchableOpacity
                onPress={handleAddToExistingPlant}
                className="bg-green-600 py-4 rounded-2xl mb-3"
              >
                <Text className="text-white text-lg font-bold text-center">
                  Add to Existing Plant
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("PlantTracker")}
                className="bg-blue-600 py-4 rounded-2xl"
              >
                <Text className="text-white text-lg font-bold text-center">
                  Create New Plant Record
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const HealthIssueCard: React.FC<{ issue: any }> = ({ issue }) => {
  const severityColor =
    issue.severity === "mild"
      ? "#f59e0b"
      : issue.severity === "moderate"
      ? "#ff9e4a"
      : "#ef4444";

  const severityBg =
    issue.severity === "mild"
      ? "#fef3c7"
      : issue.severity === "moderate"
      ? "#fed7aa"
      : "#fee2e2";

  return (
    <View
      className="bg-gray-50 p-4 rounded-2xl mb-3 border-l-4"
      style={{ borderLeftColor: severityColor }}
    >
      <Text className="font-bold text-gray-800 mb-1">{issue.type}</Text>
      <Text className="text-gray-600 text-sm mb-2">{issue.description}</Text>
      <View className="flex-row items-center mb-2">
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: severityBg }}
        >
          <Text style={{ color: severityColor }} className="text-xs font-bold">
            {issue.severity.toUpperCase()}
          </Text>
        </View>
        <Text className="text-gray-600 text-sm ml-2">
          Affected: {issue.affectedArea}% of plant
        </Text>
      </View>
      <View className="bg-white p-3 rounded-lg">
        <Text className="text-sm text-gray-700">{issue.recommendation}</Text>
      </View>
    </View>
  );
};

export default DetectionResults;
