import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import Home from './Home';
import Pd from './Disease';
import Profile from './Profile';
import { RootStackParamList } from './types'; // ✅ import type properly

const Tab = createBottomTabNavigator<RootStackParamList>();

const BottomNavigation: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#166534',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ecfdf5',
          borderTopWidth: 0,
          elevation: 10,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse-outline';

          if (route.name === 'Home') iconName = 'home-outline';
          else if (route.name === 'Disease') iconName = 'leaf-outline';
          else if (route.name === 'Profile') iconName = 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} options={{ title: 'Home' }} />
      <Tab.Screen name="Disease" component={Pd} options={{ title: 'Disease' }} />
      <Tab.Screen name="Profile" component={Profile} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

export default BottomNavigation;
