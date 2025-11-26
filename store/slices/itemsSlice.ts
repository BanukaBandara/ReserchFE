import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { environment } from '../../environment/environment'; // Adjust path as needed

// Types
export type FetchItemsParams = {
  page?: number;
  category?: string;
  status?: string;
  location?: string;
  search?: string;
};

type Item = {
  _id: string;
  name: string;
  description?: string;
  category: string;
  status: "lost" | "found";
  location: string;
  createdAt: string;
  date: string;
  photos?: string[];
  isResolved?: boolean;
  userId?: {
    username?: string;
  };
  contactInfo?: string;
};

interface FetchItemsResponse {
  items: Item[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasMore: boolean;
    itemsPerPage: number;
  };
}

interface ItemsState {
  items: Item[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasMore: boolean;
    itemsPerPage: number;
  };
  filters: {
    category: string;
    status: string;
    location: string;
    search: string;
  };
}

// Define the root state type to access auth state
interface RootState {
  auth: {
    token: string | null;
    isAuthenticated: boolean;
  };
  items: ItemsState;
}

// Async thunk for fetching items
export const fetchItems = createAsyncThunk<
  FetchItemsResponse & { page: number; isLoadMore: boolean },
  FetchItemsParams,
  { 
    rejectValue: string;
    state: RootState;
  }
>(
  'items/fetchItems',
  async (params: FetchItemsParams = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const token = state.auth.token;

      // Check if user is authenticated
      if (!token) {
        return rejectWithValue('Authentication token not found');
      }

      const {
        page = 1,
        category = 'all',
        status = 'all',
        location = '',
        search = ''
      } = params;

      const queryParams: Record<string, string> = {
        page: page.toString(),
        ...(category !== 'all' && { category }),
        ...(status !== 'all' && { status }),
        ...(location && { location }),
        ...(search && { search }),
      };

      const response = await axios.get(
        `${environment.API_BASE_URL}api/item`,
        {
          params: queryParams,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('Fetch Items Response:', response.data.items);

      const data = response.data;
      return { ...data, page, isLoadMore: page > 1 };
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          errorMessage = error.response.data?.message || `Error: ${error.response.status}`;
        } else if (error.request) {
          // Request was made but no response received
          errorMessage = 'Network error - please check your connection';
        } else {
          // Something else happened
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

const initialState: ItemsState = {
  items: [],
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasMore: false,
    itemsPerPage: 5
  },
  filters: {
    category: 'all',
    status: 'all',
    location: '',
    search: ''
  }
};

const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ItemsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.currentPage = 1; // Reset to first page when filters change
    },
    clearFilters: (state) => {
      state.filters = {
        category: 'all',
        status: 'all',
        location: '',
        search: ''
      };
      state.pagination.currentPage = 1;
    },
    resetItems: (state) => {
      state.items = [];
      state.pagination.currentPage = 1;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        const { items, pagination, page, isLoadMore } = action.payload;
        
        if (isLoadMore) {
          // Append items for load more
          state.items = [...state.items, ...items];
        } else {
          // Replace items for new search/filter
          state.items = items;
        }
        
        state.pagination = pagination;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'An error occurred';
      });
  }
});

export const { setFilters, clearFilters, resetItems } = itemsSlice.actions;
export default itemsSlice.reducer;