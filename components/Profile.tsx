import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from './types';
import { useAppSelector } from '../store/store';

type ProfileNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'Profile'
>;

const MyProfile: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ProfileNavProp>();

  const { user } = useAppSelector((state) => state.auth);

  const initialName =
    user?.name || user?.fullName || user?.email?.split('@')[0] || '';
  const initialEmail = user?.email || '';
  const initialPhone = (user as any)?.phone || '';
  const initialFarm = (user as any)?.farmName || (user as any)?.location || '';

  const [fullName, setFullName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [farmLocation, setFarmLocation] = useState(initialFarm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFullName(initialName);
    setEmail(initialEmail);
    setPhone(initialPhone);
    setFarmLocation(initialFarm);
  }, [initialName, initialEmail, initialPhone, initialFarm]);

  const initials = (fullName || initialEmail || 'Pineapple')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');

  const handleSave = async () => {
    // TODO: wire this to your backend / Redux updateProfile action
    setIsSaving(true);
    try {
      // Fake delay for UX
      setTimeout(() => {
        setIsSaving(false);
        Alert.alert('Profile Saved', 'Your profile details have been updated.');
      }, 600);
    } catch (e) {
      setIsSaving(false);
      Alert.alert('Error', 'Could not save your profile. Please try again.');
    }
  };

  const handleChangePassword = () => {
    // You can navigate to a ChangePassword screen later
    Alert.alert(
      'Change Password',
      'This will open a screen to change your password. Implement API here later.'
    );
  };

  return (
    <View className="flex-1 bg-emerald-900">
      <View
        className="flex-1"
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <LinearGradient
          colors={['#064e3b', '#166534', '#facc15']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="flex-1"
        >
          {/* HEADER BAR */}
          <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-emerald-900/40 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={20} color="#fefce8" />
            </TouchableOpacity>

            <Text className="text-base font-semibold text-amber-100">
              My Profile
            </Text>

            {/* spacer to balance layout */}
            <View className="w-10" />
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {/* PROFILE HEADER CARD */}
            <View className="px-5 mt-2">
              <View
                className="bg-white/95 rounded-3xl px-5 py-5 mb-4"
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 12,
                }}
              >
                <View className="flex-row items-center">
                  <View className="w-14 h-14 rounded-full bg-emerald-100 items-center justify-center mr-4">
                    <Text className="text-lg font-semibold text-emerald-800">
                      {initials}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-emerald-900">
                      {fullName || 'User'}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      {email || 'No email'}
                    </Text>
                    <View className="flex-row items-center mt-2">
                      <View className="px-2 py-1 bg-emerald-50 rounded-full flex-row items-center">
                        <Ionicons
                          name="leaf-outline"
                          size={14}
                          color="#166534"
                        />
                        <Text className="text-[11px] text-emerald-800 ml-1">
                          Pineapple Pest Detector
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* DETAILS CARD */}
            <View className="px-5">
              <View className="bg-white/95 rounded-3xl px-5 py-6">
                <Text className="text-sm font-semibold text-emerald-900 mb-4">
                  Account Details
                </Text>

                {/* Full Name */}
                <View className="mb-4">
                  <Text className="text-gray-700 mb-2 text-xs">Full Name</Text>
                  <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 bg-gray-50">
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color="#6b7280"
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      className="flex-1 text-gray-800"
                      placeholder="Enter your name"
                      placeholderTextColor="#9CA3AF"
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </View>
                </View>

                {/* Email (usually non-editable) */}
                <View className="mb-4">
                  <Text className="text-gray-700 mb-2 text-xs">Email</Text>
                  <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 bg-gray-100">
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color="#6b7280"
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      className="flex-1 text-gray-600"
                      value={email}
                      editable={false}
                    />
                  </View>
                  <Text className="text-[10px] text-gray-400 mt-1">
                    Email is linked to your account and cannot be changed here.
                  </Text>
                </View>

                {/* Phone */}
                <View className="mb-4">
                  <Text className="text-gray-700 mb-2 text-xs">
                    Phone Number
                  </Text>
                  <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 bg-gray-50">
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color="#6b7280"
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      className="flex-1 text-gray-800"
                      placeholder="+94 7X XXX XXXX"
                      placeholderTextColor="#9CA3AF"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                {/* Farm / Location */}
                <View className="mb-1">
                  <Text className="text-gray-700 mb-2 text-xs">
                    Farm / Location
                  </Text>
                  <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 bg-gray-50">
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color="#6b7280"
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      className="flex-1 text-gray-800"
                      placeholder="E.g., Kurunegala pineapple field"
                      placeholderTextColor="#9CA3AF"
                      value={farmLocation}
                      onChangeText={setFarmLocation}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* SETTINGS CARD */}
            <View className="px-5 mt-4">
              <View className="bg-white/95 rounded-3xl px-5 py-5">
                <Text className="text-sm font-semibold text-emerald-900 mb-4">
                  Security & Preferences
                </Text>

                {/* Change password */}
                <TouchableOpacity
                  className="flex-row items-center justify-between py-3"
                  onPress={handleChangePassword}
                >
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 rounded-2xl bg-emerald-100 items-center justify-center mr-3">
                      <Ionicons
                        name="key-outline"
                        size={18}
                        color="#166534"
                      />
                    </View>
                    <View>
                      <Text className="text-sm text-emerald-900 font-medium">
                        Change password
                      </Text>
                      <Text className="text-[11px] text-gray-500">
                        Update your login password for this account.
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>

                <View className="h-px bg-gray-200 my-2" />

                {/* Notifications (placeholder) */}
                <View className="flex-row items-center justify-between py-2">
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 rounded-2xl bg-amber-100 items-center justify-center mr-3">
                      <Ionicons
                        name="notifications-outline"
                        size={18}
                        color="#92400e"
                      />
                    </View>
                    <View>
                      <Text className="text-sm text-emerald-900 font-medium">
                        Pest alerts
                      </Text>
                      <Text className="text-[11px] text-gray-500">
                        Receive alerts when high pest activity is detected.
                      </Text>
                    </View>
                  </View>
                  {/* Simple pill to indicate "On" for now */}
                  <View className="px-3 py-1 rounded-full bg-emerald-100">
                    <Text className="text-[11px] text-emerald-700 font-medium">
                      On
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* SAVE BUTTON */}
            <View className="px-5 mt-5">
              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                className="mb-2"
              >
                <LinearGradient
                  colors={
                    isSaving ? ['#a3a3a3', '#a3a3a3'] : ['#166534', '#22c55e']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-4 rounded-2xl flex-row items-center justify-center"
                >
                  <Text className="text-white font-semibold text-base">
                    {isSaving ? 'Saving…' : 'Save Changes'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text className="text-[11px] text-emerald-50/90 text-center mt-1">
                Your profile helps personalize pest detection and alerts for your
                pineapple fields.
              </Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </View>
  );
};

export default MyProfile;
