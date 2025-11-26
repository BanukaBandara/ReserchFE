import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  _id: string;
  email: string;
  name?: string;
  username: string;
  type: string; 
  registrationId: string; 
  createdAt?: string; 

}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  user: null,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    // Login success
    loginSuccess: (state, action: PayloadAction<{ token: string; user: User }>) => {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isLoading = false;
      state.error = null;
    },
    
    // Login failure
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.isLoading = false;
      state.error = action.payload;
    },
    
    // Logout
    logout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.isLoading = false;
      state.error = null;
    },
    
    // Update user data
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Restore auth state (for app initialization)
    restoreAuth: (state, action: PayloadAction<{ token: string; user: User }>) => {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const {
  setLoading,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  clearError,
  restoreAuth,
} = authSlice.actions;

// Async thunks for handling authentication with AsyncStorage
export const persistLogin = (token: string, user: User) => async (dispatch: any) => {
  try {
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(user));
    dispatch(loginSuccess({ token, user }));
  } catch (error) {
    console.error('Error persisting login data:', error);
  }
};

export const persistLogout = () => async (dispatch: any) => {
  try {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
    dispatch(logout());
  } catch (error) {
    console.error('Error removing login data:', error);
    dispatch(logout()); // Still logout even if AsyncStorage fails
  }
};

export const restoreAuthFromStorage = () => async (dispatch: any) => {
  try {
    dispatch(setLoading(true));
    const token = await AsyncStorage.getItem('authToken');
    const userDataString = await AsyncStorage.getItem('userData');
    
    if (token && userDataString) {
      const user = JSON.parse(userDataString);
      dispatch(restoreAuth({ token, user }));
    } else {
      dispatch(setLoading(false));
    }
  } catch (error) {
    console.error('Error restoring auth from storage:', error);
    dispatch(setLoading(false));
  }
};

export default authSlice.reducer;