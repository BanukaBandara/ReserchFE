import {
  DetectionResult,
  GrowthStage,
  HealthStatus,
  HealthIssue,
} from "../types/detection";

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

const normalizeConfidence = (value: unknown): number => {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  const normalized = value > 1 ? value / 100 : value;
  return Math.max(0, Math.min(1, normalized));
};

const validGrowthStages: GrowthStage[] = [
  "seedling",
  "vegetative",
  "pre_flowering",
  "flowering",
  "fruiting",
  "mature",
];

const normalizeGrowthStage = (value: unknown): GrowthStage => {
  if (typeof value !== "string") return "vegetative";
  const normalized = value.toLowerCase().replace(/[\s-]+/g, "_") as GrowthStage;
  return validGrowthStages.includes(normalized) ? normalized : "vegetative";
};

const normalizeHealthStatus = (value: unknown): HealthStatus => {
  if (typeof value !== "string") return HealthStatus.HEALTHY;
  const normalized = value.toLowerCase();
  if (normalized === HealthStatus.CRITICAL) return HealthStatus.CRITICAL;
  if (normalized === HealthStatus.WARNING) return HealthStatus.WARNING;
  return HealthStatus.HEALTHY;
};

const toHealthIssues = (value: unknown): HealthIssue[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((issue) => issue && typeof issue === "object")
    .map((issue: any) => ({
      type: typeof issue.type === "string" ? issue.type : "Unknown issue",
      description:
        typeof issue.description === "string"
          ? issue.description
          : "No description provided",
      severity:
        issue.severity === "severe" || issue.severity === "moderate"
          ? issue.severity
          : "mild",
      affectedArea:
        typeof issue.affectedArea === "number" && !Number.isNaN(issue.affectedArea)
          ? issue.affectedArea
          : 0,
      recommendation:
        typeof issue.recommendation === "string"
          ? issue.recommendation
          : "Monitor plant condition and recheck soon.",
    }));
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
};

const buildImageFormData = (
  imageUri: string,
  extra?: Record<string, string | number | undefined>
) => {
  const formData = new FormData();
  const filename = imageUri.split("/").pop() || "photo.jpg";
  const extMatch = /\.(\w+)$/.exec(filename);
  const mimeType = extMatch ? `image/${extMatch[1]}` : "image/jpeg";

  formData.append("image", {
    uri: imageUri,
    name: filename,
    type: mimeType,
  } as any);

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    }
  }

  return formData;
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
 * Detect pineapple growth stage / health from image.
 * Tries multiple backend routes for compatibility with different server versions.
 */
export const detectPineappleGrowth = async (
  imageUri: string,
  metadata?: {
    farmerId?: string;
    region?: string;
    language?: string;
    daysFromPlanting?: number;
    location?: string;
  }
): Promise<any> => {
  const endpoints = [
    "/api/growth/predict",
    "/api/growth-predict",
    "/api/predict-growth",
    "/api/pineapple-growth/predict",
    "/api/predict",
  ];

  const formData = buildImageFormData(imageUri, {
    farmer_id: metadata?.farmerId,
    region: metadata?.region,
    language: metadata?.language || "en",
    days_from_planting: metadata?.daysFromPlanting,
    location: metadata?.location,
  });

  let lastError: APIError | null = null;

  for (const path of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      const parsed = await safeJson(response);

      if (!response.ok) {
        if (response.status === 404 || response.status === 405) {
          continue;
        }

        const msg =
          parsed.ok && parsed.data?.error
            ? parsed.data.error
            : `Server returned ${response.status}: ${response.statusText}`;
        throw new APIError(msg, response.status);
      }

      return parsed.ok ? parsed.data : parsed.data;
    } catch (error) {
      if (error instanceof APIError) {
        lastError = error;
      } else {
        lastError = new APIError(
          error instanceof Error ? error.message : "Failed to analyze pineapple growth"
        );
      }
    }
  }

  if (lastError) throw lastError;
  throw new APIError("Failed to analyze pineapple growth");
};

/**
 * Converts backend growth prediction payload to app DetectionResult.
 */
export const toDetectionResultFromGrowthPredict = (
  response: any,
  imageUri: string,
  plantId?: string,
  timestamp: string = new Date().toISOString()
): DetectionResult => {
  const stuntedSource = response?.stunted_growth || response?.stuntedGrowth || {};
  const hasStuntedFlag =
    stuntedSource?.isStunted === true ||
    stuntedSource?.is_stunted === true ||
    stuntedSource?.stunted === true;

  const normalizedSeverity =
    stuntedSource?.severity === "mild" ||
    stuntedSource?.severity === "moderate" ||
    stuntedSource?.severity === "severe"
      ? stuntedSource.severity
      : undefined;

  const normalizedHealthIssues = toHealthIssues(response?.health_issues);
  const label = typeof response?.label === "string" ? response.label.toLowerCase() : "";
  const confidence = normalizeConfidence(response?.confidence);

  const fallbackHealthStatus =
    label === "mealybug" || label === "thrips"
      ? HealthStatus.WARNING
      : HealthStatus.HEALTHY;

  const fallbackHealthIssue: HealthIssue[] =
    label === "mealybug" || label === "thrips"
      ? [
          {
            type: label,
            description: `Possible ${label} signs detected from image classifier output.`,
            severity: label === "mealybug" ? "severe" : "moderate",
            affectedArea: 0,
            recommendation: "Inspect affected leaves closely and apply recommended treatment.",
          },
        ]
      : [];

  const recommendations = toStringArray(response?.recommendations);
  const actionItems = toStringArray(response?.action_items);

  const mappedHealthStatus = response?.health_status
    ? normalizeHealthStatus(response.health_status)
    : fallbackHealthStatus;

  const finalHealthStatus =
    mappedHealthStatus === HealthStatus.HEALTHY && hasStuntedFlag
      ? HealthStatus.WARNING
      : mappedHealthStatus;

  return {
    id:
      typeof response?.id === "string"
        ? response.id
        : `det_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    success: response?.success !== false,
    growth_stage: normalizeGrowthStage(response?.growth_stage),
    confidence,
    health_status: finalHealthStatus,
    health_issues:
      normalizedHealthIssues.length > 0 ? normalizedHealthIssues : fallbackHealthIssue,
    stunted_growth: {
      isStunted: hasStuntedFlag,
      severity: normalizedSeverity,
      estimatedHeightDeficit:
        typeof stuntedSource?.estimatedHeightDeficit === "number"
          ? stuntedSource.estimatedHeightDeficit
          : typeof stuntedSource?.estimated_height_deficit === "number"
          ? stuntedSource.estimated_height_deficit
          : undefined,
      potentialCauses: toStringArray(
        stuntedSource?.potentialCauses || stuntedSource?.potential_causes
      ),
      recommendations: toStringArray(stuntedSource?.recommendations),
    },
    nutrient_analysis: {
      primaryDeficiency:
        typeof response?.nutrient_analysis?.primaryDeficiency === "string"
          ? response.nutrient_analysis.primaryDeficiency
          : undefined,
      estimatedRecoveryDays:
        typeof response?.nutrient_analysis?.estimatedRecoveryDays === "number"
          ? response.nutrient_analysis.estimatedRecoveryDays
          : undefined,
      symptoms: toStringArray(response?.nutrient_analysis?.symptoms),
      treatments: toStringArray(response?.nutrient_analysis?.treatments),
      secondaryDeficiencies: toStringArray(
        response?.nutrient_analysis?.secondaryDeficiencies
      ),
    },
    all_predictions:
      response?.all_predictions && typeof response.all_predictions === "object"
        ? response.all_predictions
        : undefined,
    recommendations:
      recommendations.length > 0
        ? recommendations
        : ["Continue regular monitoring and keep records of growth progress."],
    action_items:
      actionItems.length > 0
        ? actionItems
        : ["Capture another image in 7 days to compare development."],
    timestamp,
    imageUri,
    plantId,
    daysFromPlanting:
      typeof response?.daysFromPlanting === "number"
        ? response.daysFromPlanting
        : undefined,
  };
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