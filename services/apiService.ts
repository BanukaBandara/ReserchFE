import { DetectionResult } from '../types/detection';

// API Configuration
const API_BASE_URL = 'http://192.168.8.181:3001'; // Change this to your server IP

export class APIError extends Error {
    constructor(
        public message: string,
        public statusCode?: number
    ) {
        super(message);
        this.name = 'APIError';
    }
}

/**
 * Test connection to the backend server
 */
// export const testConnection = async (): Promise<boolean> => {
//     try {
//         const response = await fetch(`${API_BASE_URL}/api/health`, {
//             method: 'GET',
//             timeout: 5000,
//         } as any);
//         return response.ok;
//     } catch (error) {
//         console.error('Connection test failed:', error);
//         return false;
//     }
// };

/**
 * Detect pineapple growth from an image
 */
export const detectPineappleGrowth = async (
    imageUri: string,
    metadata?: {
        daysFromPlanting?: number;
        location?: string;
    }
): Promise<any> => {
    try {
        // Create FormData for file upload
        const formData = new FormData();

        // Append image
        const filename = imageUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('image', {
            uri: imageUri,
            name: filename,
            type,
        } as any);

        // Append metadata if provided
        if (metadata?.daysFromPlanting) {
            formData.append('days_from_planting', metadata.daysFromPlanting.toString());
        }
        if (metadata?.location) {
            formData.append('location', metadata.location);
        }

        const response = await fetch(`${API_BASE_URL}/api/detect`, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new APIError(
                `Server returned ${response.status}: ${response.statusText}`,
                response.status
            );
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError(
            error instanceof Error ? error.message : 'Failed to analyze image'
        );
    }
};

/**
 * Generate voice alert for detection results
 */
export const generateVoiceAlert = async (
    detectionId: string,
    language: string = 'en'
): Promise<{ message_text: string; audio_url?: string }> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/voice-alert/${detectionId}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ language }),
            }
        );

        if (!response.ok) {
            throw new APIError(
                `Failed to generate voice alert: ${response.statusText}`,
                response.status
            );
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError(
            error instanceof Error ? error.message : 'Failed to generate voice alert'
        );
    }
};

/**
 * Get detection history for a plant
 */
export const getDetectionHistory = async (
    plantId: string
): Promise<DetectionResult[]> => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/plants/${plantId}/detections`,
            {
                method: 'GET',
            }
        );

        if (!response.ok) {
            throw new APIError(
                `Failed to fetch detection history: ${response.statusText}`,
                response.status
            );
        }

        const data = await response.json();
        return data.detections || [];
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError(
            error instanceof Error ? error.message : 'Failed to fetch detection history'
        );
    }
};

/**
 * Save detection to backend
 */
export const saveDetection = async (
    detection: DetectionResult
): Promise<DetectionResult> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/detections`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(detection),
        });

        if (!response.ok) {
            throw new APIError(
                `Failed to save detection: ${response.statusText}`,
                response.status
            );
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError(
            error instanceof Error ? error.message : 'Failed to save detection'
        );
    }
};
