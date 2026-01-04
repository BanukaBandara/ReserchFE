import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DetectionResult, FilterType, SortType } from '../../types/detection';

interface DetectionState {
    detections: DetectionResult[];
    currentDetection: DetectionResult | null;
    filter: FilterType;
    sortBy: SortType;
    loading: boolean;
    error: string | null;
    lastSyncTime: string | null;
}

const initialState: DetectionState = {
    detections: [],
    currentDetection: null,
    filter: 'all',
    sortBy: 'newest',
    loading: false,
    error: null,
    lastSyncTime: null,
};

const STORAGE_KEY = '@pineapple_detections_data';

// Async thunks
export const loadDetections = createAsyncThunk(
    'detections/loadDetections',
    async () => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading detections:', error);
            return [];
        }
    }
);

export const saveDetectionsToStorage = createAsyncThunk(
    'detections/saveDetectionsToStorage',
    async (detections: DetectionResult[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(detections));
            return detections;
        } catch (error) {
            console.error('Error saving detections:', error);
            throw error;
        }
    }
);

const detectionSlice = createSlice({
    name: 'detections',
    initialState,
    reducers: {
        addDetection: (state, action: PayloadAction<DetectionResult>) => {
            state.detections.unshift(action.payload);
            state.currentDetection = action.payload;
            state.error = null;
        },

        setCurrentDetection: (
            state,
            action: PayloadAction<DetectionResult | null>
        ) => {
            state.currentDetection = action.payload;
        },

        deleteDetection: (state, action: PayloadAction<string>) => {
            state.detections = state.detections.filter(
                (d) => d.id !== action.payload
            );
            if (state.currentDetection?.id === action.payload) {
                state.currentDetection = null;
            }
            state.error = null;
        },

        updateDetection: (state, action: PayloadAction<DetectionResult>) => {
            const index = state.detections.findIndex(
                (d) => d.id === action.payload.id
            );
            if (index !== -1) {
                state.detections[index] = action.payload;
                if (state.currentDetection?.id === action.payload.id) {
                    state.currentDetection = action.payload;
                }
            }
        },

        setFilter: (state, action: PayloadAction<FilterType>) => {
            state.filter = action.payload;
        },

        setSortBy: (state, action: PayloadAction<SortType>) => {
            state.sortBy = action.payload;
        },

        clearDetections: (state) => {
            state.detections = [];
            state.currentDetection = null;
            state.error = null;
        },

        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },

    extraReducers: (builder) => {
        builder
            // Load detections
            .addCase(loadDetections.pending, (state) => {
                state.loading = true;
            })
            .addCase(loadDetections.fulfilled, (state, action) => {
                state.loading = false;
                state.detections = action.payload;
                state.lastSyncTime = new Date().toISOString();
            })
            .addCase(loadDetections.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to load detections';
            })

            // Save detections
            .addCase(saveDetectionsToStorage.pending, (state) => {
                state.loading = true;
            })
            .addCase(saveDetectionsToStorage.fulfilled, (state, action) => {
                state.loading = false;
                state.detections = action.payload;
                state.lastSyncTime = new Date().toISOString();
                state.error = null;
            })
            .addCase(saveDetectionsToStorage.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to save detections';
            });
    },
});

export const {
    addDetection,
    setCurrentDetection,
    deleteDetection,
    updateDetection,
    setFilter,
    setSortBy,
    clearDetections,
    setError,
} = detectionSlice.actions;

export default detectionSlice.reducer;
