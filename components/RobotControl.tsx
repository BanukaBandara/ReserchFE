import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type RobotMode = "MANUAL" | "AUTO";
type SpeedLevel = 1 | 2 | 3;

const API_BASE = "http://172.20.10.9:3001"; // change to your robot server IP

const ControlButton = ({
  icon,
  label,
  onPress,
  backgroundColor,
  textColor = "#ffffff",
  disabled = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  backgroundColor: string;
  textColor?: string;
  disabled?: boolean;
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={{
        flex: 1,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          backgroundColor,
          borderRadius: 18,
          paddingVertical: 16,
          alignItems: "center",
          justifyContent: "center",
          minHeight: 88,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <Ionicons name={icon} size={24} color={textColor} />
        <Text
          style={{
            marginTop: 8,
            color: textColor,
            fontSize: 13,
            fontWeight: "700",
          }}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const InfoCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          backgroundColor: `${color}18`,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text
        style={{
          color: "#6b7280",
          fontSize: 12,
          marginBottom: 4,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: "#111827",
          fontSize: 18,
          fontWeight: "800",
        }}
      >
        {value}
      </Text>
    </View>
  );
};

export default function RobotControl() {
  const insets = useSafeAreaInsets();

  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastCommand, setLastCommand] = useState("None");
  const [mode, setMode] = useState<RobotMode>("MANUAL");
  const [speed, setSpeed] = useState<SpeedLevel>(2);

  const connectionText = useMemo(
    () => (isConnected ? "Connected" : "Disconnected"),
    [isConnected]
  );

  const sendCommand = async (
    command: string,
    extra?: Record<string, unknown>
  ) => {
    if (!isConnected) {
      Alert.alert("Robot Not Connected", "Please connect the robot first.");
      return;
    }

    try {
      setIsSending(true);

      const res = await fetch(`${API_BASE}/api/robot/command`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          command,
          mode,
          speed,
          ...extra,
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(`Server error (${res.status}): ${text}`);
      }

      setLastCommand(command);
    } catch (error: any) {
      Alert.alert(
        "Command Failed",
        error?.message || "Could not send robot command."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsSending(true);

      const res = await fetch(`${API_BASE}/api/robot/connect`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(`Connection failed (${res.status}): ${text}`);
      }

      setIsConnected(true);
      Alert.alert("Robot Connected", "Robot connection established.");
    } catch (error: any) {
      Alert.alert(
        "Connection Failed",
        error?.message || "Unable to connect to the robot."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsSending(true);

      await fetch(`${API_BASE}/api/robot/disconnect`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });

      setIsConnected(false);
      setLastCommand("None");
      Alert.alert("Robot Disconnected", "Robot connection closed.");
    } catch {
      setIsConnected(false);
      setLastCommand("None");
      Alert.alert("Robot Disconnected", "Robot connection closed.");
    } finally {
      setIsSending(false);
    }
  };

  const handleEmergencyStop = async () => {
    try {
      if (isConnected) {
        await sendCommand("EMERGENCY_STOP");
      }
    } finally {
      Alert.alert("Emergency Stop", "Emergency stop command sent.");
    }
  };

  const SpeedChip = ({
    label,
    value,
  }: {
    label: string;
    value: SpeedLevel;
  }) => {
    const active = speed === value;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setSpeed(value)}
        style={{
          flex: 1,
          marginHorizontal: 4,
        }}
      >
        <View
          style={{
            backgroundColor: active ? "#059669" : "#ffffff",
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
            borderWidth: 1.5,
            borderColor: active ? "#059669" : "#d1d5db",
          }}
        >
          <Text
            style={{
              color: active ? "#ffffff" : "#374151",
              fontWeight: "700",
              fontSize: 14,
            }}
          >
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const ModeChip = ({ value }: { value: RobotMode }) => {
    const active = mode === value;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setMode(value)}
        style={{ flex: 1, marginHorizontal: 4 }}
      >
        <View
          style={{
            backgroundColor: active ? "#0f766e" : "#ffffff",
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
            borderWidth: 1.5,
            borderColor: active ? "#0f766e" : "#d1d5db",
          }}
        >
          <Text
            style={{
              color: active ? "#ffffff" : "#374151",
              fontWeight: "700",
              fontSize: 14,
            }}
          >
            {value}
          </Text>
        </View>
      </TouchableOpacity>
    );
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
                Smart Field Robot
              </Text>
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 28,
                  fontWeight: "800",
                  marginTop: 4,
                }}
              >
                Robot Control
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.95)",
                  fontSize: 15,
                  lineHeight: 22,
                  marginTop: 10,
                }}
              >
                Control robot movement, robot arm actions, and field inspection
                operations from your mobile device.
              </Text>
            </View>

            <View style={{ flexDirection: "row", marginHorizontal: -6, marginBottom: 18 }}>
              <InfoCard
                title="Status"
                value={connectionText}
                icon="hardware-chip"
                color={isConnected ? "#10b981" : "#ef4444"}
              />
              <InfoCard
                title="Mode"
                value={mode}
                icon="settings"
                color="#0f766e"
              />
              <InfoCard
                title="Speed"
                value={`L${speed}`}
                icon="speedometer"
                color="#f59e0b"
              />
            </View>

            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: 18,
                padding: 16,
                marginBottom: 18,
              }}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 17,
                  fontWeight: "800",
                  marginBottom: 12,
                }}
              >
                Connection
              </Text>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={handleConnect}
                  style={{ flex: 1 }}
                  disabled={isSending}
                >
                  <View
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: 14,
                      paddingVertical: 14,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#064e3b",
                        fontSize: 15,
                        fontWeight: "800",
                      }}
                    >
                      Connect
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={handleDisconnect}
                  style={{ flex: 1 }}
                  disabled={isSending}
                >
                  <View
                    style={{
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderRadius: 14,
                      paddingVertical: 14,
                      alignItems: "center",
                      borderWidth: 1.5,
                      borderColor: "rgba(255,255,255,0.35)",
                    }}
                  >
                    <Text
                      style={{
                        color: "#ffffff",
                        fontSize: 15,
                        fontWeight: "800",
                      }}
                    >
                      Disconnect
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={{
                backgroundColor: "#ffffff",
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
                  marginBottom: 12,
                }}
              >
                Robot Mode
              </Text>

              <View style={{ flexDirection: "row", marginHorizontal: -4, marginBottom: 16 }}>
                <ModeChip value="MANUAL" />
                <ModeChip value="AUTO" />
              </View>

              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  color: "#111827",
                  marginBottom: 12,
                }}
              >
                Speed Control
              </Text>

              <View style={{ flexDirection: "row", marginHorizontal: -4 }}>
                <SpeedChip label="Low" value={1} />
                <SpeedChip label="Medium" value={2} />
                <SpeedChip label="High" value={3} />
              </View>
            </View>

            <View
              style={{
                backgroundColor: "#ffffff",
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
                Movement Control
              </Text>

              <View style={{ alignItems: "center", marginBottom: 12 }}>
                <View style={{ width: "34%" }}>
                  <ControlButton
                    icon="arrow-up"
                    label="Forward"
                    backgroundColor="#059669"
                    onPress={() => sendCommand("MOVE_FORWARD")}
                    disabled={isSending}
                  />
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                <ControlButton
                  icon="arrow-back"
                  label="Left"
                  backgroundColor="#0f766e"
                  onPress={() => sendCommand("TURN_LEFT")}
                  disabled={isSending}
                />
                <ControlButton
                  icon="stop-circle"
                  label="Stop"
                  backgroundColor="#dc2626"
                  onPress={() => sendCommand("STOP")}
                  disabled={isSending}
                />
                <ControlButton
                  icon="arrow-forward"
                  label="Right"
                  backgroundColor="#0f766e"
                  onPress={() => sendCommand("TURN_RIGHT")}
                  disabled={isSending}
                />
              </View>

              <View style={{ alignItems: "center" }}>
                <View style={{ width: "34%" }}>
                  <ControlButton
                    icon="arrow-down"
                    label="Backward"
                    backgroundColor="#059669"
                    onPress={() => sendCommand("MOVE_BACKWARD")}
                    disabled={isSending}
                  />
                </View>
              </View>
            </View>

            <View
              style={{
                backgroundColor: "#ffffff",
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
                Robot Arm Control
              </Text>

              <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                <ControlButton
                  icon="arrow-up-circle"
                  label="Arm Up"
                  backgroundColor="#7c3aed"
                  onPress={() => sendCommand("ARM_UP")}
                  disabled={isSending}
                />
                <ControlButton
                  icon="arrow-down-circle"
                  label="Arm Down"
                  backgroundColor="#7c3aed"
                  onPress={() => sendCommand("ARM_DOWN")}
                  disabled={isSending}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                <ControlButton
                  icon="lock-open"
                  label="Grip Open"
                  backgroundColor="#0284c7"
                  onPress={() => sendCommand("GRIP_OPEN")}
                  disabled={isSending}
                />
                <ControlButton
                  icon="lock-closed"
                  label="Grip Close"
                  backgroundColor="#0284c7"
                  onPress={() => sendCommand("GRIP_CLOSE")}
                  disabled={isSending}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <ControlButton
                  icon="hand-left"
                  label="Pick"
                  backgroundColor="#f59e0b"
                  onPress={() => sendCommand("PICK_ACTION")}
                  disabled={isSending}
                />
                <ControlButton
                  icon="hand-right"
                  label="Release"
                  backgroundColor="#f59e0b"
                  onPress={() => sendCommand("RELEASE_ACTION")}
                  disabled={isSending}
                />
              </View>
            </View>

            <View
              style={{
                backgroundColor: "#ffffff",
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
                Smart Actions
              </Text>

              <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                <ControlButton
                  icon="scan"
                  label="Start Scan"
                  backgroundColor="#0891b2"
                  onPress={() => sendCommand("START_SCAN")}
                  disabled={isSending}
                />
                <ControlButton
                  icon="pause-circle"
                  label="Pause Task"
                  backgroundColor="#6b7280"
                  onPress={() => sendCommand("PAUSE_TASK")}
                  disabled={isSending}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <ControlButton
                  icon="home"
                  label="Return Home"
                  backgroundColor="#16a34a"
                  onPress={() => sendCommand("RETURN_HOME")}
                  disabled={isSending}
                />
                <ControlButton
                  icon="refresh-circle"
                  label="Reset Arm"
                  backgroundColor="#9333ea"
                  onPress={() => sendCommand("RESET_ARM")}
                  disabled={isSending}
                />
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleEmergencyStop}
              disabled={isSending}
            >
              <LinearGradient
                colors={["#b91c1c", "#ef4444"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 18,
                  paddingVertical: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  marginBottom: 18,
                }}
              >
                <Ionicons name="warning" size={22} color="#ffffff" />
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 17,
                    fontWeight: "800",
                    marginLeft: 10,
                  }}
                >
                  Emergency Stop
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.16)",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Ionicons name="information-circle" size={20} color="#ffffff" />
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 16,
                    fontWeight: "800",
                    marginLeft: 8,
                  }}
                >
                  Current Robot Info
                </Text>
              </View>

              <Text
                style={{
                  color: "rgba(255,255,255,0.95)",
                  fontSize: 14,
                  lineHeight: 22,
                }}
              >
                Last command: {lastCommand}
              </Text>

              {isSending && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 10,
                  }}
                >
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 13,
                      marginLeft: 8,
                      fontWeight: "600",
                    }}
                  >
                    Sending command...
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </View>
  );
}