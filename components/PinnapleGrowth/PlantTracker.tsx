import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { v4 as uuidv4 } from "react-native-uuid";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  addPlant,
  deletePlant,
  loadPlants,
  selectPlant,
} from "../../store/slices/plantSlice";
import { GrowthStage, HealthStatus, Plant } from "../../types/detection";

const { width } = Dimensions.get("window");

const PlantTracker: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();

  const plants = useAppSelector((state) => state.plants.plants);
  const selectedPlantId = useAppSelector(
    (state) => state.plants.selectedPlantId
  );
  const selectedPlant = plants.find((p) => p.id === selectedPlantId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [plantName, setPlantName] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  // Load plants on mount
  useFocusEffect(
    React.useCallback(() => {
      dispatch(loadPlants() as any);
    }, [dispatch])
  );

  const handleAddPlant = () => {
    if (!plantName.trim()) {
      Alert.alert("Error", "Please enter a plant name");
      return;
    }

    const newPlant: Plant = {
      id: uuidv4() as string,
      name: plantName,
      location: location || "Unknown",
      dateAdded: new Date().toISOString(),
      currentStage: GrowthStage.SEEDLING,
      currentHealthStatus: HealthStatus.HEALTHY,
      detectionHistory: [],
      notes: notes,
      hasActiveAlerts: false,
      alertCount: 0,
    };

    dispatch(addPlant(newPlant));
    dispatch(selectPlant(newPlant.id));

    // Reset form
    setPlantName("");
    setLocation("");
    setNotes("");
    setShowAddModal(false);

    Alert.alert("Success", "Plant added successfully!");
  };

  const handleDeletePlant = (id: string) => {
    Alert.alert(
      "Delete Plant",
      "Are you sure you want to delete this plant record?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            dispatch(deletePlant(id));
            if (selectedPlantId === id) {
              dispatch(selectPlant(null));
            }
          },
        },
      ]
    );
  };

  const getHealthBadgeColor = (status: HealthStatus) => {
    switch (status) {
      case HealthStatus.HEALTHY:
        return { bg: "#d1fae5", text: "#065f46" };
      case HealthStatus.WARNING:
        return { bg: "#fef3c7", text: "#92400e" };
      case HealthStatus.CRITICAL:
        return { bg: "#fee2e2", text: "#7f1d1d" };
      default:
        return { bg: "#f3f4f6", text: "#374151" };
    }
  };

  const getGrowthColor = (stage: GrowthStage) => {
    const colors: Record<GrowthStage, string> = {
      [GrowthStage.SEEDLING]: "#3b82f6",
      [GrowthStage.VEGETATIVE]: "#10b981",
      [GrowthStage.FLOWERING]: "#f59e0b",
      [GrowthStage.FRUITING]: "#ec4899",
      [GrowthStage.MATURE]: "#6366f1",
    };
    return colors[stage] || "#6b7280";
  };

  const getStageIcon = (stage: GrowthStage) => {
    const icons: Record<GrowthStage, string> = {
      [GrowthStage.SEEDLING]: "sprout",
      [GrowthStage.VEGETATIVE]: "leaf",
      [GrowthStage.FLOWERING]: "flower",
      [GrowthStage.FRUITING]: "fruit-grapes",
      [GrowthStage.MATURE]: "crown",
    };
    return icons[stage] || "leaf";
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {!selectedPlant ? (
        <View className="flex-1">
          {/* Header */}
          <View className="bg-white px-4 py-4 border-b border-gray-200">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-gray-800">
                  Plant Tracker
                </Text>
                <Text className="text-gray-600 mt-1">
                  {plants.length} plant{plants.length !== 1 ? "s" : ""} being
                  monitored
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                className="bg-green-600 w-12 h-12 rounded-full items-center justify-center"
              >
                <Ionicons name="add" size={28} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Plants List */}
          {plants.length === 0 ? (
            <View className="flex-1 items-center justify-center px-4">
              <MaterialCommunityIcons
                name="flower-petal"
                size={80}
                color="#d1d5db"
              />
              <Text className="text-xl font-bold text-gray-600 mt-4">
                No Plants Yet
              </Text>
              <Text className="text-gray-500 text-center mt-2 mb-6">
                Add your first pineapple plant to start monitoring growth and
                health
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                className="bg-green-600 px-8 py-3 rounded-full"
              >
                <Text className="text-white font-bold">Add First Plant</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              className="flex-1 p-4"
              showsVerticalScrollIndicator={false}
            >
              {plants.map((plant) => (
                <TouchableOpacity
                  key={plant.id}
                  onPress={() => {
                    dispatch(selectPlant(plant.id));
                    setShowDetailModal(true);
                  }}
                  className="bg-white rounded-3xl p-4 mb-4 shadow-sm border border-gray-200"
                  activeOpacity={0.7}
                >
                  {/* Plant Header */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-xl font-bold text-gray-800">
                        {plant.name}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="location" size={14} color="#6b7280" />
                        <Text className="text-gray-600 text-sm ml-1">
                          {plant.location}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeletePlant(plant.id)}
                      className="p-2"
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={20}
                        color="#ef4444"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Status Cards */}
                  <View className="flex-row gap-2 mb-3">
                    {/* Growth Stage */}
                    <View
                      className="flex-1 p-3 rounded-2xl"
                      style={{
                        backgroundColor: getHealthBadgeColor(
                          plant.currentHealthStatus
                        ).bg,
                      }}
                    >
                      <Text className="text-xs font-semibold text-gray-600 mb-1">
                        Stage
                      </Text>
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons
                          name={getStageIcon(plant.currentStage)}
                          size={20}
                          color={getGrowthColor(plant.currentStage)}
                        />
                        <Text
                          className="text-sm font-bold ml-1"
                          style={{ color: getGrowthColor(plant.currentStage) }}
                        >
                          {plant.currentStage.charAt(0).toUpperCase() +
                            plant.currentStage.slice(1)}
                        </Text>
                      </View>
                    </View>

                    {/* Health Status */}
                    <View
                      className="flex-1 p-3 rounded-2xl"
                      style={{
                        backgroundColor: getHealthBadgeColor(
                          plant.currentHealthStatus
                        ).bg,
                      }}
                    >
                      <Text className="text-xs font-semibold text-gray-600 mb-1">
                        Health
                      </Text>
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons
                          name={
                            plant.currentHealthStatus === HealthStatus.HEALTHY
                              ? "heart"
                              : plant.currentHealthStatus ===
                                HealthStatus.WARNING
                              ? "alert-circle"
                              : "heart-broken"
                          }
                          size={20}
                          color={
                            getHealthBadgeColor(plant.currentHealthStatus).text
                          }
                        />
                        <Text
                          className="text-sm font-bold ml-1"
                          style={{
                            color: getHealthBadgeColor(
                              plant.currentHealthStatus
                            ).text,
                          }}
                        >
                          {plant.currentHealthStatus.charAt(0).toUpperCase() +
                            plant.currentHealthStatus.slice(1)}
                        </Text>
                      </View>
                    </View>

                    {/* Detections */}
                    <View className="flex-1 p-3 rounded-2xl bg-blue-100">
                      <Text className="text-xs font-semibold text-gray-600 mb-1">
                        Analysis
                      </Text>
                      <Text className="text-2xl font-bold text-blue-700">
                        {plant.detectionHistory.length}
                      </Text>
                    </View>
                  </View>

                  {/* Alerts */}
                  {plant.hasActiveAlerts && (
                    <View className="bg-red-50 border border-red-200 p-3 rounded-xl">
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons
                          name="alert-circle"
                          size={20}
                          color="#dc2626"
                        />
                        <Text className="text-red-700 font-bold ml-2">
                          {plant.alertCount} active{" "}
                          {plant.alertCount === 1 ? "alert" : "alerts"}
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Add Plant Modal */}
          <Modal
            visible={showAddModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowAddModal(false)}
          >
            <View className="flex-1 justify-end bg-black/50">
              <View className="bg-white rounded-t-3xl p-6 pt-8">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-2xl font-bold text-gray-800">
                    Add New Plant
                  </Text>
                  <TouchableOpacity onPress={() => setShowAddModal(false)}>
                    <Ionicons name="close" size={28} color="gray" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View className="mb-4">
                    <Text className="text-gray-800 font-bold mb-2">
                      Plant Name *
                    </Text>
                    <TextInput
                      className="border border-gray-300 rounded-xl p-3"
                      placeholder="e.g., Pineapple Plant #1"
                      value={plantName}
                      onChangeText={setPlantName}
                    />
                  </View>

                  <View className="mb-4">
                    <Text className="text-gray-800 font-bold mb-2">
                      Location
                    </Text>
                    <TextInput
                      className="border border-gray-300 rounded-xl p-3"
                      placeholder="e.g., Field A, Row 5"
                      value={location}
                      onChangeText={setLocation}
                    />
                  </View>

                  <View className="mb-6">
                    <Text className="text-gray-800 font-bold mb-2">Notes</Text>
                    <TextInput
                      className="border border-gray-300 rounded-xl p-3"
                      placeholder="Add any notes about the plant..."
                      multiline
                      numberOfLines={4}
                      value={notes}
                      onChangeText={setNotes}
                      textAlignVertical="top"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleAddPlant}
                    className="bg-green-600 py-4 rounded-xl mb-3"
                  >
                    <Text className="text-white text-lg font-bold text-center">
                      Add Plant
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowAddModal(false)}
                    className="bg-gray-200 py-4 rounded-xl"
                  >
                    <Text className="text-gray-700 text-lg font-bold text-center">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      ) : (
        <PlantDetailView
          plant={selectedPlant}
          onBack={() => dispatch(selectPlant(null))}
        />
      )}
    </SafeAreaView>
  );
};

const PlantDetailView: React.FC<{ plant: Plant; onBack: () => void }> = ({
  plant,
  onBack,
}) => {
  const navigation = useNavigation<any>();

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="bg-white border-b border-gray-200 p-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={onBack} className="p-2 mr-2">
            <Ionicons name="chevron-back" size={28} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-800">
              {plant.name}
            </Text>
            <Text className="text-gray-600 mt-1">{plant.location}</Text>
          </View>
        </View>
      </View>

      {/* Plant Info */}
      <View className="p-4">
        {/* Quick Stats */}
        <View className="bg-white rounded-3xl p-6 mb-4 shadow-sm">
          <View className="flex-row justify-between mb-4">
            <StatCard label="Stage" value={plant.currentStage} icon="leaf" />
            <StatCard
              label="Health"
              value={plant.currentHealthStatus}
              icon="heart"
            />
            <StatCard
              label="Analysis"
              value={plant.detectionHistory.length.toString()}
              icon="chart-line"
            />
          </View>

          <View className="border-t border-gray-200 pt-4">
            <Text className="text-gray-600 text-sm mb-2">Added</Text>
            <Text className="text-gray-800 font-bold">
              {new Date(plant.dateAdded).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Detection History */}
        {plant.detectionHistory.length > 0 && (
          <View className="bg-white rounded-3xl p-6 mb-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-800">
                Analysis History
              </Text>
              <View className="bg-blue-100 px-3 py-1 rounded-full">
                <Text className="text-blue-700 text-sm font-bold">
                  {plant.detectionHistory.length}
                </Text>
              </View>
            </View>

            {plant.detectionHistory.slice(0, 3).map((detection, idx) => (
              <View
                key={idx}
                className="flex-row items-center justify-between py-3 border-b border-gray-200"
              >
                <View className="flex-1">
                  <Text className="text-gray-800 font-semibold">
                    {detection.growth_stage.charAt(0).toUpperCase() +
                      detection.growth_stage.slice(1)}
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    {new Date(detection.timestamp).toLocaleDateString()}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="bg-green-100 px-3 py-1 rounded-full">
                    <Text className="text-green-700 text-sm font-bold">
                      {(detection.confidence * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {plant.detectionHistory.length > 3 && (
              <TouchableOpacity className="mt-4">
                <Text className="text-blue-600 font-bold text-center">
                  View All Analyses
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Notes */}
        {plant.notes && (
          <View className="bg-white rounded-3xl p-6 mb-4 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-3">Notes</Text>
            <Text className="text-gray-700">{plant.notes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <TouchableOpacity
          onPress={() => navigation.navigate("PineappleDetection")}
          className="bg-green-600 py-4 rounded-2xl mb-4"
        >
          <Text className="text-white text-lg font-bold text-center">
            Analyze Plant Now
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="bg-blue-600 py-4 rounded-2xl">
          <Text className="text-white text-lg font-bold text-center">
            View Growth Analytics
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: string }> = ({
  label,
  value,
  icon,
}) => (
  <View className="flex-1 items-center">
    <MaterialCommunityIcons name={icon as any} size={24} color="#059669" />
    <Text className="text-gray-600 text-sm mt-2">{label}</Text>
    <Text className="text-gray-800 font-bold mt-1 capitalize">{value}</Text>
  </View>
);

export default PlantTracker;
