import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from "@react-navigation/stack";
import { Provider } from 'react-redux';
import { store, useAppDispatch } from '../store/store';
import { restoreAuthFromStorage } from '../store/slices/authSlice';
import Splash from '../components/Splash';
import SignIn from '@/components/SignIn';
import SignUp from '@/components/SignUp';
import Home from '@/components/Home';
import Profile from '@/components/Profile';
//import Wall from '@/components/Wall';
//import AddPost from '@/components/AddPost';
//import Notify from '@/components/Notify';

const Stack = createStackNavigator();

const AuthInitializer: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(restoreAuthFromStorage());
  }, [dispatch]);

  return null;
};

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <AuthInitializer />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="Splash"
          component={Splash}
        />
        <Stack.Screen
          name="SignIn"
          component={SignIn}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUp}
        />
        <Stack.Screen
          name="Home"
          component={Home}
        />
        <Stack.Screen
          name="Profile"
          component={Profile}
        />
       
        
      
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}