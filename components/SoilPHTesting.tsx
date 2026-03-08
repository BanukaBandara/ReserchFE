import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SoilCondition = "Poor" | "Moderate" | "Good" | "Excellent";

const getPHStatus = (ph: number) => {
  if (ph < 5.5) {
    return {
      label: "Strongly Acidic",
      color: "#dc2626",
      advice: "Soil is too acidic. Consider liming based on agronomy advice.",
    };
  }
  if (ph < 6.0) {
    return {
      label: "Moderately Acidic",
      color: "#f59e0b",
      advice: "Slightly acidic. Monitor and adjust if needed.",
    };
  }
  if (ph <= 7.0) {
    return {
      label: "Optimal for Pineapple",
      color: "#10b981",
      advice: "Soil pH is suitable for pineapple growth.",
    };
  }
  if (ph <= 7.5) {
    return {
      label: "Slightly Alkaline",
      color: "#f59e0b",
      advice: "Slightly alkaline. Monitor nutrient uptake carefully.",
    };
  }
  return {
    label: "Highly Alkaline",
    color: "#dc2626",
    advice: "Soil is too alkaline. Consider corrective soil management.",
  };
};

const getMoistureStatus = (moisture: number) => {
  if (moisture < 25) {
    return {
      label: "Too Dry",
      color: "#dc2626",
      advice: "Increase irrigation. Soil moisture is low.",
    };
  }
  if (moisture < 45) {
    return {
      label: "Moderate",
      color: "#f59e0b",
      advice: "Moisture is acceptable but should be monitored.",
    };
  }
  if (moisture <= 70) {
    return {
      label: "Good",
      color: "#10b981",
      advice: "Soil moisture is in a healthy range.",
    };
  }
  return {
    label: "Too Wet",
    color: "#0284c7",
    advice: "Reduce watering and improve drainage if needed.",
  };
};

const getTemperatureStatus = (temp: number) => {
  if (temp < 18) {
    return {
      label: "Cool",
      color: "#0284c7",
      advice: "Soil temperature is low for active growth.",
    };
  }
  if (temp <= 30) {
    return {
      label: "Optimal",
      color: "#10b981",
      advice: "Soil temperature is good for plant activity.",
    };
  }
  return {
    label: "High",
    color: "#dc2626",
    advice: "High soil temperature may stress roots.",
  };
};

const getECStatus = (ec: number) => {
  if (ec < 0.2) {
    return {
      label: "Low Nutrient Level",
      color: "#f59e0b",
      advice: "Nutrient/salt level appears low. Check fertilizer plan.",
    };
  }
  if (ec <= 1.5) {
    return {
      label: "Normal",
      color: "#10b981",
      advice: "Electrical conductivity is within a good range.",
    };
  }
  return {
    label: "High Salinity",
    color: "#dc2626",
    advice: "Possible salinity issue. Check water and fertilizer input.",
  };
};

const getOverallCondition = (
  ph: number,
  moisture: number,
  temp: number,
  ec: number
): { label: SoilCondition; color: string; summary: string } => {
  let score = 0;

  if (ph >= 5.5 && ph <= 7.0) score += 1;
  if (moisture >= 45 && moisture <= 70) score += 1;
  if (temp >= 18 && temp <= 30) score += 1;
  if (ec >= 0.2 && ec <= 1.5) score += 1;

  if (score === 4) {
    return {
      label: "Excellent",
      color: "#10b981",
      summary: "All major soil parameters are in a healthy range.",
    };
  }
  if (score === 3) {
    return {
      label: "Good",
      color: "#22c55e",
      summary: "Most soil conditions are suitable with minor attention needed.",
    };
  }
  if (score === 2) {
    return {
      label: "Moderate",
      color: "#f59e0b",
      summary: "Some soil parameters need improvement.",
    };
  }
  return {
    label: "Poor",
    color: "#dc2626",
    summary: "Soil condition needs urgent correction and monitoring.",
  };
};

const SensorCard = ({
  title,
  value,
  unit,
  icon,
  color,
  status,
}: {
  title: string;
  value: string;
  unit: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  status: string;
}) => (
  <View
    style={{
      backgroundColor: "#fff",
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    }}
  >
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            backgroundColor: `${color}20`,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>
            {title}
          </Text>
          <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
            {status}
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 22, fontWeight: "800", color: "#111827" }}>
        {value}
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#6b7280" }}>
          {" "}
          {unit}
        </Text>
      </Text>
    </View>
  </View>
);

export default function SoilPHTesting() {
  const insets = useSafeAreaInsets();

  const [sensorConnected, setSensorConnected] = useState(false);
  const [ph, setPh] = useState("5.8");
  const [moisture, setMoisture] = useState("52");
  const [temperature, setTemperature] = useState("26");
  const [ec, setEc] = useState("0.8");

  const phValue = Number(ph) || 0;
  const moistureValue = Number(moisture) || 0;
  const tempValue = Number(temperature) || 0;
  const ecValue = Number(ec) || 0;

  const phStatus = useMemo(() => getPHStatus(phValue), [phValue]);
  const moistureStatus = useMemo(
    () => getMoistureStatus(moistureValue),
    [moistureValue]
  );
  const tempStatus = useMemo(
    () => getTemperatureStatus(tempValue),
    [tempValue]
  );
  const ecStatus = useMemo(() => getECStatus(ecValue), [ecValue]);
  const overall = useMemo(
    () => getOverallCondition(phValue, moistureValue, tempValue, ecValue),
    [phValue, moistureValue, tempValue, ecValue]
  );

  const handleConnectSensor = () => {
    setSensorConnected(true);
    Alert.alert("Sensor Connected", "Soil sensor connected successfully.");
  };

  const handleReadSensor = () => {
    if (!sensorConnected) {
      Alert.alert("Sensor Not Connected", "Please connect the sensor first.");
      return;
    }

    const randomPH = (5 + Math.random() * 2).toFixed(1);
    const randomMoisture = (35 + Math.random() * 35).toFixed(0);
    const randomTemp = (20 + Math.random() * 10).toFixed(0);
    const randomEC = (0.2 + Math.random() * 1.4).toFixed(2);

    setPh(randomPH);
    setMoisture(randomMoisture);
    setTemperature(randomTemp);
    setEc(randomEC);

    Alert.alert("Sensor Reading Complete", "Latest soil values updated.");
  };

  const handleReset = () => {
    setSensorConnected(false);
    setPh("5.8");
    setMoisture("52");
    setTemperature("26");
    setEc("0.8");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#064e3b" }}>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <LinearGradient
          colors={["#064e3b", "#166534", "#facc15"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              padding: 20,
              paddingBottom: insets.bottom + 30,
            }}
          >
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 14,
                  fontWeight: "500",
                }}
              >
                Smart Soil Monitoring
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 28,
                  fontWeight: "800",
                  marginTop: 4,
                }}
              >
                Soil pH Testing
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.95)",
                  fontSize: 15,
                  lineHeight: 22,
                  marginTop: 10,
                }}
              >
                Check soil sensor values and get live soil condition analysis for
                healthier pineapple cultivation.
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: 18,
                padding: 16,
                marginBottom: 18,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    backgroundColor: sensorConnected
                      ? "rgba(16,185,129,0.2)"
                      : "rgba(239,68,68,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons
                    name={sensorConnected ? "hardware-chip" : "hardware-chip-outline"}
                    size={22}
                    color={sensorConnected ? "#10b981" : "#ef4444"}
                  />
                </View>
                <View>
                  <Text
                    style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}
                  >
                    Sensor Status
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.9)",
                      fontSize: 13,
                      marginTop: 2,
                    }}
                  >
                    {sensorConnected ? "Connected" : "Disconnected"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleConnectSensor}
                activeOpacity={0.85}
                style={{
                  backgroundColor: "#fff",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{ color: "#064e3b", fontWeight: "700", fontSize: 13 }}
                >
                  Connect
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: 18,
                marginBottom: 18,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  color: "#111827",
                  marginBottom: 16,
                }}
              >
                Sensor Inputs
              </Text>

              <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
                Soil pH
              </Text>
              <TextInput
                value={ph}
                onChangeText={setPh}
                keyboardType="decimal-pad"
                placeholder="Enter pH"
                style={{
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  marginBottom: 12,
                  fontSize: 15,
                  color: "#111827",
                }}
              />

              <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
                Moisture %
              </Text>
              <TextInput
                value={moisture}
                onChangeText={setMoisture}
                keyboardType="numeric"
                placeholder="Enter moisture"
                style={{
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  marginBottom: 12,
                  fontSize: 15,
                  color: "#111827",
                }}
              />

              <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
                Soil Temperature °C
              </Text>
              <TextInput
                value={temperature}
                onChangeText={setTemperature}
                keyboardType="numeric"
                placeholder="Enter soil temperature"
                style={{
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  marginBottom: 12,
                  fontSize: 15,
                  color: "#111827",
                }}
              />

              <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
                EC (mS/cm)
              </Text>
              <TextInput
                value={ec}
                onChangeText={setEc}
                keyboardType="decimal-pad"
                placeholder="Enter EC value"
                style={{
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  marginBottom: 16,
                  fontSize: 15,
                  color: "#111827",
                }}
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={handleReadSensor}
                  activeOpacity={0.9}
                  style={{ flex: 1 }}
                >
                  <LinearGradient
                    colors={["#059669", "#047857"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 14,
                      paddingVertical: 14,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: 15,
                      }}
                    >
                      Read Sensor
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleReset}
                  activeOpacity={0.9}
                  style={{
                    flex: 1,
                    borderWidth: 2,
                    borderColor: "#d1d5db",
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 14,
                    backgroundColor: "#fff",
                  }}
                >
                  <Text
                    style={{
                      color: "#374151",
                      fontWeight: "700",
                      fontSize: 15,
                    }}
                  >
                    Reset
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: 18,
                marginBottom: 18,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  color: "#111827",
                  marginBottom: 14,
                }}
              >
                Overall Soil Condition
              </Text>

              <View
                style={{
                  backgroundColor: `${overall.color}18`,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1.5,
                  borderColor: overall.color,
                }}
              >
                <Text
                  style={{
                    color: overall.color,
                    fontSize: 22,
                    fontWeight: "800",
                    marginBottom: 6,
                  }}
                >
                  {overall.label}
                </Text>
                <Text
                  style={{
                    color: "#374151",
                    fontSize: 14,
                    lineHeight: 22,
                  }}
                >
                  {overall.summary}
                </Text>
              </View>
            </View>

            <SensorCard
              title="Soil pH"
              value={ph}
              unit=""
              icon="flask"
              color={phStatus.color}
              status={phStatus.label}
            />
            <Text
              style={{
                color: "#fff",
                fontSize: 13,
                marginBottom: 14,
                lineHeight: 20,
              }}
            >
              {phStatus.advice}
            </Text>

            <SensorCard
              title="Moisture"
              value={moisture}
              unit="%"
              icon="water"
              color={moistureStatus.color}
              status={moistureStatus.label}
            />
            <Text
              style={{
                color: "#fff",
                fontSize: 13,
                marginBottom: 14,
                lineHeight: 20,
              }}
            >
              {moistureStatus.advice}
            </Text>

            <SensorCard
              title="Soil Temperature"
              value={temperature}
              unit="°C"
              icon="thermometer"
              color={tempStatus.color}
              status={tempStatus.label}
            />
            <Text
              style={{
                color: "#fff",
                fontSize: 13,
                marginBottom: 14,
                lineHeight: 20,
              }}
            >
              {tempStatus.advice}
            </Text>

            <SensorCard
              title="Electrical Conductivity"
              value={ec}
              unit="mS/cm"
              icon="flash"
              color={ecStatus.color}
              status={ecStatus.label}
            />
            <Text
              style={{
                color: "#fff",
                fontSize: 13,
                marginBottom: 14,
                lineHeight: 20,
              }}
            >
              {ecStatus.advice}
            </Text>
          </ScrollView>
        </LinearGradient>
      </View>
    </View>
  );
}