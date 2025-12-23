import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';

import { store, useAppDispatch } from '../store/store';
import { restoreAuthFromStorage } from '../store/slices/authSlice';

import Splash from '../components/Splash';
import SignIn from '../components/SignIn';
import SignUp from '../components/SignUp';
import Home from '../components/Home';
import Profile from '../components/Profile';
import Disease from '../components/Disease';

/* ---------- TYPES ---------- */
export type RootStackParamList = {
  Splash: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Home: undefined;
  Profile: undefined;
  Disease: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

/* ---------- AUTH INITIALIZER ---------- */
const AuthInitializer: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(restoreAuthFromStorage());
  }, [dispatch]);

  return null;
};

/* ---------- NAVIGATOR ---------- */
const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      {/* MUST be outside Stack.Navigator */}
      <AuthInitializer />

      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="SignIn" component={SignIn} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Disease" component={Disease} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

/* ---------- APP ROOT ---------- */
export default function App() {
  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}
