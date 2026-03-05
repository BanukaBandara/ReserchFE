import { DetectionResult } from "../types/detection";

// API Configuration
const API_BASE_URL = "http://192.168.8.181:3001"; // your PC IP

export class APIError extends Error {
  constructor(public message: string, public statusCode?: number) {
    super(message);
    this.name = "APIError";
  }
}

// Helper: safely parse JSON (even when server returns HTML/text)
const safeJson = async (response: Response) => {
  const text = await response.text();
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false, data: text };
  }
};

/**
 * Detect pineapple pest from an image (Model prediction)
 * Backend endpoint should be: POST /api/predict
 */
export const detectPestFromImage = async (
  imageUri: string,
  metadata?: {
    daysFromPlanting?: number;
    location?: string;
  }
): Promise<any> => {
  try {
    const formData = new FormData();

    const filename = imageUri.split("/").pop() || "photo.jpg";
    const extMatch = /\.(\w+)$/.exec(filename);
    const mimeType = extMatch ? `image/${extMatch[1]}` : "image/jpeg";

    formData.append("image", {
      uri: imageUri,
      name: filename,
      type: mimeType,
    } as any);

    // metadata (keep 0 as valid)
    if (metadata?.daysFromPlanting !== undefined) {
      formData.append("days_from_planting", String(metadata.daysFromPlanting));
    }
    if (metadata?.location) {
      formData.append("location", metadata.location);
    }

    const response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
        // IMPORTANT: do NOT set Content-Type for FormData in React Native
      },
    });

    const parsed = await safeJson(response);

    if (!response.ok) {
      const msg =
        parsed.ok && parsed.data?.error
          ? parsed.data.error
          : `Server returned ${response.status}: ${response.statusText}`;
      throw new APIError(msg, response.status);
    }

    return parsed.ok ? parsed.data : parsed.data;
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError(error instanceof Error ? error.message : "Failed to analyze image");
  }
};

/**
 * Generate voice alert for detection results
 */
export const generateVoiceAlert = async (
  detectionId: string,
  language: string = "en"
): Promise<{ message_text: string; audio_url?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/voice-alert/${detectionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ language }),
    });

    const parsed = await safeJson(response);

    if (!response.ok) {
      const msg =
        parsed.ok && parsed.data?.error
          ? parsed.data.error
          : `Failed to generate voice alert: ${response.statusText}`;
      throw new APIError(msg, response.status);
    }

    return parsed.ok ? parsed.data : parsed.data;
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError(error instanceof Error ? error.message : "Failed to generate voice alert");
  }
};

/**
 * Get detection history for a plant
 */
export const getDetectionHistory = async (plantId: string): Promise<DetectionResult[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/plants/${plantId}/detections`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const parsed = await safeJson(response);

    if (!response.ok) {
      const msg =
        parsed.ok && parsed.data?.error
          ? parsed.data.error
          : `Failed to fetch detection history: ${response.statusText}`;
      throw new APIError(msg, response.status);
    }

    return parsed.ok ? parsed.data.detections || [] : [];
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError(error instanceof Error ? error.message : "Failed to fetch detection history");
  }
};

/**
 * Save detection to backend
 */
export const saveDetection = async (detection: DetectionResult): Promise<DetectionResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/detections`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(detection),
    });

    const parsed = await safeJson(response);

    if (!response.ok) {
      const msg =
        parsed.ok && parsed.data?.error
          ? parsed.data.error
          : `Failed to save detection: ${response.statusText}`;
      throw new APIError(msg, response.status);
    }

    return parsed.ok ? parsed.data : parsed.data;
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new APIError(error instanceof Error ? error.message : "Failed to save detection");
  }
};