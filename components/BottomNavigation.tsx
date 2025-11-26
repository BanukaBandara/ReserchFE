import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSelector } from '../store/store';
import { environment } from '@/environment/environment';
import axios from 'axios';
import { RootStackParamList } from './types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BottomNavigation: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { token } = useAppSelector((state) => state.auth);
  const [notificationCount, setNotificationCount] = useState(0);

  const navItems: Array<{
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconOutline: keyof typeof Ionicons.glyphMap;
    route: keyof RootStackParamList;
  }> = [
      {
        name: 'Home',
        icon: 'home',
        iconOutline: 'home-outline',
        route: 'Home'
      },
      {
        name: 'Wall',
        icon: 'search',
        iconOutline: 'search-outline',
        route: 'Wall'
      },
      {
        name: 'Add',
        icon: 'add-circle',
        iconOutline: 'add-circle-outline',
        route: 'AddPost'
      },
      {
        name: 'Profile',
        icon: 'person',
        iconOutline: 'person-outline',
        route: 'Profile'
      },
      {
        name: 'Notifications',
        icon: 'notifications',
        iconOutline: 'notifications-outline',
        route: 'Notify'
      }
    ];

  // Fetch notification count
  const fetchNotificationCount = async () => {
    if (!token) return;

    try {
      const response = await axios.get(
        `${environment.API_BASE_URL}api/notifications/count`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setNotificationCount(response.data.unreadCount || 0);
        console.log('Fetched notification count:', response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
      setNotificationCount(0);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotificationCount();

      const interval = setInterval(fetchNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    if (route.name === 'Notify') {
      setNotificationCount(0);
    }
  }, [route.name]);

  const handleNavPress = (item: typeof navItems[0]) => {
    if (item.route !== route.name) {
      navigation.navigate(item.route);
      console.log(`Navigate to ${item.route}`);

      // If navigating to notifications, reset the count
      if (item.route === 'Notify') {
        setNotificationCount(0);
      }
    }
  };

  const isActive = (routeName: string) => route.name === routeName;

  const renderNavItem = (item: typeof navItems[0], index: number) => {
    const active = isActive(item.route);
    const isNotificationItem = item.route === 'Notify';

    return (
      <TouchableOpacity
        key={index}
        onPress={() => handleNavPress(item)}
        className="items-center justify-center py-2 px-2"
        style={{
          transform: [{ scale: active ? 1.05 : 1 }],
        }}
      >
        <View className="relative">
          <Ionicons
            name={active ? item.icon : item.iconOutline}
            size={24}
            color={active ? '#0891b2' : '#9CA3AF'}
          />

          {/* Notification Badge */}
          {isNotificationItem && notificationCount > 0 && (
            <View
              className="absolute -top-2 -right-2 bg-red-500 rounded-full min-w-5 h-5 items-center justify-center px-1"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <Text
                className="text-white text-xs font-bold"
                style={{ fontSize: notificationCount > 99 ? 9 : 11 }}
              >
                {notificationCount > 99 ? '99+' : notificationCount}
              </Text>
            </View>
          )}

          {active && (
            <View
              className="absolute -bottom-1 left-1/2 w-1 h-1 bg-cyan-500 rounded-full"
              style={{ transform: [{ translateX: -2 }] }}
            />
          )}
        </View>
        <Text
          className={`text-xs mt-1 font-semibold tracking-wide ${active ? 'text-cyan-600' : 'text-gray-400'
            }`}
          numberOfLines={1}
        >
          {item.name === 'Notifications' ? 'Notify' : item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      className="absolute bottom-0 left-0 right-0"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        paddingBottom: 20,
      }}
    >
      {/* Subtle top border with gradient */}
      <LinearGradient
        colors={['rgba(8, 145, 178, 0.1)', 'rgba(34, 211, 238, 0.05)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ height: 1 }}
      />

      <View
        className="flex-row items-end justify-center px-2 py-3"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 12,
        }}
      >
        {/* Left side buttons */}
        <View className="flex-row flex-1 justify-around items-center pl-2">
          {navItems.slice(0, 2).map((item, index) => renderNavItem(item, index))}
        </View>

        {/* Center Add button */}
        <View className="mx-4 -mt-6">
          <TouchableOpacity
            onPress={() => handleNavPress(navItems[2])}
            className="items-center justify-center"
            style={{
              transform: [{ scale: isActive('AddPost') ? 1.1 : 1 }],
            }}
          >
            <View className="relative">
              <LinearGradient
                colors={['#0891b2', '#0891b2', '#06b6d4', '#22d3ee']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-14 h-14 rounded-full items-center justify-center"
                style={{
                  shadowColor: '#0891b2',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Ionicons
                  name="add"
                  size={28}
                  color="white"
                />
              </LinearGradient>

              {/* Outer ring for active state */}
              {isActive('AddPost') && (
                <View
                  className="absolute inset-0 rounded-full border-2 border-cyan-300"
                  style={{
                    transform: [{ scale: 1.15 }],
                    opacity: 0.6
                  }}
                />
              )}

              {/* Inner glow effect */}
              <View
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  transform: [{ scale: 0.7 }],
                }}
              />
            </View>

            <Text className="text-xs text-cyan-600 font-semibold mt-1 tracking-wide">
              Add
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right side buttons */}
        <View className="flex-row flex-1 justify-around items-center pr-2">
          {navItems.slice(3, 5).map((item, index) => renderNavItem(item, index + 3))}
        </View>
      </View>
    </View>
  );
};

export default BottomNavigation;