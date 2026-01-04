export enum HealthStatus {
    HEALTHY = 'healthy',
    WARNING = 'warning',
    CRITICAL = 'critical',
}

export type GrowthStage =
    | 'seedling'
    | 'vegetative'
    | 'pre_flowering'
    | 'flowering'
    | 'fruiting'
    | 'mature';

export type FilterType = 'all' | 'healthy' | 'warning' | 'critical';
export type SortType = 'newest' | 'oldest' | 'healthiest' | 'critical';

export interface HealthIssue {
    type: string;
    description: string;
    severity: 'mild' | 'moderate' | 'severe';
    affectedArea: number;
    recommendation: string;
}

export interface StuntedGrowthAnalysis {
    isStunted: boolean;
    severity?: 'mild' | 'moderate' | 'severe';
    estimatedHeightDeficit?: number;
    potentialCauses?: string[];
    recommendations?: string[];
}

export interface NutrientAnalysis {
    primaryDeficiency?: string;
    estimatedRecoveryDays?: number;
    symptoms?: string[];
    treatments?: string[];
    secondaryDeficiencies?: string[];
}

export interface DetectionResult {
    id: string;
    success: boolean;
    growth_stage: GrowthStage;
    confidence: number;
    health_status: HealthStatus;
    health_issues: HealthIssue[];
    stunted_growth: StuntedGrowthAnalysis;
    nutrient_analysis: NutrientAnalysis;
    all_predictions?: Record<string, any>;
    recommendations: string[];
    action_items: string[];
    timestamp: string;
    imageUri: string;
    plantId?: string;
    daysFromPlanting?: number;
}

export interface Plant {
    id: string;
    name: string;
    location: string;
    detectionHistory: DetectionResult[];
    createdAt: string;
    updatedAt: string;
}
