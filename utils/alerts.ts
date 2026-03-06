import * as Speech from "expo-speech";
import { DetectionResult, HealthStatus } from "../types/detection";

// Stop any playing alarm
export const stopAlarm = async () => {
  return;
};

// Play alarm sound
export const playAlarm = async () => {
  return;
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