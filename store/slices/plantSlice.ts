import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DetectionResult, Plant } from '../../types/detection';

interface PlantState {
    plants: Plant[];
    selectedPlantId: string | null;
    loading: boolean;
    error: string | null;
    lastSyncTime: string | null;
}

const initialState: PlantState = {
    plants: [],
    selectedPlantId: null,
    loading: false,
    error: null,
    lastSyncTime: null,
};

const STORAGE_KEY = '@pineapple_plants_data';

// Async thunks for persistence
export const loadPlants = createAsyncThunk('plants/loadPlants', async () => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading plants:', error);
        return [];
    }
});

export const savePlantsToStorage = createAsyncThunk(
    'plants/savePlantsToStorage',
    async (plants: Plant[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
            return plants;
        } catch (error) {
            console.error('Error saving plants:', error);
            throw error;
        }
    }
);

const plantSlice = createSlice({
    name: 'plants',
    initialState,
    reducers: {
        addPlant: (state, action: PayloadAction<Plant>) => {
            state.plants.push(action.payload);
            state.error = null;
        },

        updatePlant: (state, action: PayloadAction<Plant>) => {
            const index = state.plants.findIndex((p) => p.id === action.payload.id);
            if (index !== -1) {
                state.plants[index] = action.payload;
                state.error = null;
            }
        },

        deletePlant: (state, action: PayloadAction<string>) => {
            state.plants = state.plants.filter((p) => p.id !== action.payload);
            if (state.selectedPlantId === action.payload) {
                state.selectedPlantId = null;
            }
            state.error = null;
        },

        selectPlant: (state, action: PayloadAction<string | null>) => {
            state.selectedPlantId = action.payload;
        },

        addDetectionToPlant: (
            state,
            action: PayloadAction<{ plantId: string; detection: DetectionResult }>
        ) => {
            const plant = state.plants.find((p) => p.id === action.payload.plantId);
            if (plant) {
                plant.detectionHistory.unshift(action.payload.detection);
                plant.currentStage = action.payload.detection.growth_stage;
                plant.currentHealthStatus = action.payload.detection.health_status;
                plant.lastAnalysisDate = action.payload.detection.timestamp;
                plant.hasActiveAlerts = action.payload.detection.health_status !== 'healthy';

                // Update alert count
                plant.alertCount = plant.detectionHistory.filter(
                    (d) => d.health_status !== 'healthy'
                ).length;

                state.error = null;
            }
        },

        updatePlantNotes: (
            state,
            action: PayloadAction<{ plantId: string; notes: string }>
        ) => {
            const plant = state.plants.find((p) => p.id === action.payload.plantId);
            if (plant) {
                plant.notes = action.payload.notes;
            }
        },

        clearPlants: (state) => {
            state.plants = [];
            state.selectedPlantId = null;
        },

        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },

    extraReducers: (builder) => {
        builder
            // Load plants
            .addCase(loadPlants.pending, (state) => {
                state.loading = true;
            })
            .addCase(loadPlants.fulfilled, (state, action) => {
                state.loading = false;
                state.plants = action.payload;
                state.lastSyncTime = new Date().toISOString();
            })
            .addCase(loadPlants.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to load plants';
            })

            // Save plants
            .addCase(savePlantsToStorage.pending, (state) => {
                state.loading = true;
            })
            .addCase(savePlantsToStorage.fulfilled, (state, action) => {
                state.loading = false;
                state.plants = action.payload;
                state.lastSyncTime = new Date().toISOString();
                state.error = null;
            })
            .addCase(savePlantsToStorage.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to save plants';
            });
    },
});

export const {
    addPlant,
    updatePlant,
    deletePlant,
    selectPlant,
    addDetectionToPlant,
    updatePlantNotes,
    clearPlants,
    setError,
} = plantSlice.actions;

export default plantSlice.reducer;
