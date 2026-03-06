import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import { DetectionResult, HealthStatus } from "../types/detection";

let currentSound: Audio.Sound | null = null;

// Stop any playing alarm
export const stopAlarm = async () => {
  try {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }
  } catch (e) {
    console.log("Stop alarm error:", e);
  }
};

// Play alarm sound
export const playAlarm = async () => {
  try {
    // Stop previous sound first
    await stopAlarm();

    // ✅ IMPORTANT: Set audio mode (Fix for iOS silent mode)
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Load and play alarm sound
    const { sound } = await Audio.Sound.createAsync(
      require("../assets/sounds/alert.mp3"),
      {
        shouldPlay: true,
        volume: 1.0,
      }
    );

    currentSound = sound;

    await sound.playAsync();
  } catch (e) {
    console.log("Alarm error:", e);
  }
};

// Text to speech
export const speak = (text: string) => {
  try {
    Speech.stop();
    Speech.speak(text, {
      rate: 0.9,
      pitch: 1.05,
      language: "en",
    });
  } catch (e) {
    console.log("Speech error:", e);
  }
};

// Risk-based voice + alarm logic
export const speakByRisk = async (
  label: string,
  confidencePct: number
) => {
  const l = (label || "").toLowerCase();

  if (l === "mealybug") {
    speak(
      `High risk pest detected. Mealybug. Confidence ${confidencePct.toFixed(
        0
      )} percent. Immediate action required.`
    );
    await playAlarm();
    return;
  }

  if (l === "thrips") {
    speak(
      `Moderate risk pest detected. Thrips. Confidence ${confidencePct.toFixed(
        0
      )} percent. Please monitor the plant.`
    );
    await stopAlarm();
    return;
  }

  speak(
    `Low risk detected. Confidence ${confidencePct.toFixed(
      0
    )} percent. Continue regular monitoring.`
  );
  await stopAlarm();
};

// Growth-focused voice + alarm logic for pineapple growth detection
export const speakByGrowthAlert = async (detection: DetectionResult) => {
  const confidencePct = Math.max(0, Math.min(1, detection.confidence)) * 100;
  const stage = (detection.growth_stage || "vegetative").replace(/_/g, " ");
  const isStunted = Boolean(detection.stunted_growth?.isStunted);

  if (detection.health_status === HealthStatus.CRITICAL || isStunted) {
    const severity = detection.stunted_growth?.severity
      ? ` Severity ${detection.stunted_growth.severity}.`
      : "";
    speak(
      `Critical growth alert. Stage ${stage}. Confidence ${confidencePct.toFixed(
        0
      )} percent.${severity} Immediate intervention is recommended.`
    );
    await playAlarm();
    return;
  }

  if (detection.health_status === HealthStatus.WARNING) {
    speak(
      `Growth warning. Stage ${stage}. Confidence ${confidencePct.toFixed(
        0
      )} percent. Monitor this plant and follow recommendations.`
    );
    await stopAlarm();
    return;
  }

  speak(
    `Growth status healthy. Stage ${stage}. Confidence ${confidencePct.toFixed(
      0
    )} percent. Continue regular monitoring.`
  );
  await stopAlarm();
};