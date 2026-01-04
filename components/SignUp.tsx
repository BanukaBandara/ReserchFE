import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';

import { RootStackParamList } from './types';
import { environment } from '@/environment/environment';
import { useAppDispatch, useAppSelector } from '../store/store';
import {
  setLoading,
  loginFailure,
  persistLogin,
  clearError,
} from '../store/slices/authSlice';

const logo = require('../assets/p.png');

type SignUpNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'SignUp'
>;

const SignUp: React.FC = () => {
  const navigation = useNavigation<SignUpNavigationProp>();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (error) dispatch(clearError());
    }, [error])
  );

  useEffect(() => {
    if (error && (fullName || email || password || confirmPassword)) {
      dispatch(clearError());
    }
  }, [fullName, email, password, confirmPassword, error]);

  const validate = () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validate()) return;

    dispatch(setLoading(true));

    try {
      const response = await axios.post(
        `${environment.API_BASE_URL}api/auth/user/register`,
        {
          name: fullName.trim(),
          email: email.toLowerCase().trim(),
          password,
        },
        { timeout: 10000 }
      );

      const { success, token, user, message } = response.data;

      if (success) {
        // If backend returns token, log the user in directly
        if (token && user) {
          await dispatch(persistLogin(token, user));
          Alert.alert('Account Created', message || 'Your account has been created.', [
            {
              text: 'Go to Dashboard',
              onPress: () => navigation.navigate('Home'),
            },
          ]);
        } else {
          // Otherwise, send them back to SignIn
          Alert.alert(
            'Account Created',
            message || 'Your account has been created. Please sign in.',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('SignIn'),
              },
            ]
          );
        }
      } else {
        dispatch(loginFailure(message || 'Sign up failed'));
        Alert.alert('Error', message || 'Sign up failed');
      }
    } catch (err: any) {
      let msg = 'An error occurred during sign up';

      if (err.response) {
        const { status, data } = err.response;
        if (status === 400) {
          msg = data.message || 'Please check your input';
        } else if (status === 409) {
          msg = data.message || 'An account with this email already exists';
        } else if (status === 500) {
          msg = 'Server error. Please try again later';
        } else {
          msg = data.message || 'Sign up failed';
        }
      } else {
        msg = 'Network error. Please check your connection';
      }

      dispatch(loginFailure(msg));
      Alert.alert('Sign Up Failed', msg);
    }
  };

  const goToSignIn = () => {
    navigation.navigate('SignIn');
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
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <LinearGradient
            colors={['#064e3b', '#166534', '#facc15']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-1"
          >
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* HEADER */}
              <View className="items-center pt-10 pb-6">
                <Image
                  source={logo}
                  className="w-20 h-20 mb-3"
                  style={{ resizeMode: 'contain' }}
                />
                <Text className="text-xl font-bold text-amber-300 tracking-widest">
                  PINEAPPLE ASSISTANT
                </Text>
                <Text className="text-sm text-emerald-50 mt-2">
                  Create your account
                </Text>
              </View>

              {/* CARD */}
              <View
                className="bg-white/95 mx-5 rounded-3xl px-6 py-7"
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 15,
                }}
              >
                <Text className="text-2xl font-bold text-emerald-900 text-center mb-2">
                  Sign Up
                </Text>
                <Text className="text-center text-gray-500 text-sm mb-6">
                  Register to use the Pineapple Pest Detector system
                </Text>

                {error && (
                  <View className="bg-red-50 border border-red-200 p-3 rounded-xl mb-5">
                    <Text className="text-center text-red-600 text-xs">
                      {error}
                    </Text>
                  </View>
                )}

                {/* FULL NAME */}
                <View className="mb-4">
                  <Text className="text-gray-700 mb-2 text-sm">UserName</Text>
                  <View
                    className={`flex-row items-center border rounded-xl px-4 py-3 bg-gray-50 ${
                      isNameFocused ? 'border-emerald-600' : 'border-gray-300'
                    }`}
                  >
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={isNameFocused ? '#047857' : '#9CA3AF'}
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      className="flex-1 text-gray-800"
                      placeholder="Enter your full name"
                      placeholderTextColor="#9CA3AF"
                      value={fullName}
                      onChangeText={setFullName}
                      onFocus={() => setIsNameFocused(true)}
                      onBlur={() => setIsNameFocused(false)}
                    />
                  </View>
                </View>

                {/* EMAIL */}
                <View className="mb-4">
                  <Text className="text-gray-700 mb-2 text-sm">Email</Text>
                  <View
                    className={`flex-row items-center border rounded-xl px-4 py-3 bg-gray-50 ${
                      isEmailFocused ? 'border-emerald-600' : 'border-gray-300'
                    }`}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={isEmailFocused ? '#047857' : '#9CA3AF'}
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      className="flex-1 text-gray-800"
                      placeholder="name@example.com"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setIsEmailFocused(true)}
                      onBlur={() => setIsEmailFocused(false)}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                {/* PASSWORD */}
                <View className="mb-4">
                  <Text className="text-gray-700 mb-2 text-sm">Password</Text>
                  <View
                    className={`flex-row items-center border rounded-xl px-4 py-3 bg-gray-50 ${
                      isPasswordFocused
                        ? 'border-emerald-600'
                        : 'border-gray-300'
                    }`}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={isPasswordFocused ? '#047857' : '#9CA3AF'}
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      className="flex-1 text-gray-800"
                      placeholder="Create a password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#047857"
                      />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-[11px] text-gray-400 mt-1">
                    Minimum 6 characters.
                  </Text>
                </View>

                {/* CONFIRM PASSWORD */}
                <View className="mb-6">
                  <Text className="text-gray-700 mb-2 text-sm">
                    Confirm Password
                  </Text>
                  <View
                    className={`flex-row items-center border rounded-xl px-4 py-3 bg-gray-50 ${
                      isConfirmFocused
                        ? 'border-emerald-600'
                        : 'border-gray-300'
                    }`}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color={isConfirmFocused ? '#047857' : '#9CA3AF'}
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      className="flex-1 text-gray-800"
                      placeholder="Re-enter your password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showConfirm}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onFocus={() => setIsConfirmFocused(true)}
                      onBlur={() => setIsConfirmFocused(false)}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirm(!showConfirm)}
                    >
                      <Ionicons
                        name={showConfirm ? 'eye-off' : 'eye'}
                        size={20}
                        color="#047857"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* SIGN UP BUTTON */}
                <TouchableOpacity onPress={handleSignUp} disabled={isLoading}>
                  <LinearGradient
                    colors={
                      isLoading
                        ? ['#aaaaaa', '#aaaaaa']
                        : ['#166534', '#22c55e']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="py-4 rounded-xl flex-row justify-center items-center"
                  >
                    {isLoading && (
                      <ActivityIndicator
                        size="small"
                        color="#fff"
                        style={{ marginRight: 6 }}
                      />
                    )}
                    <Text className="text-white font-semibold text-base">
                      {isLoading ? 'Creating account…' : 'Create Account'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* ALREADY HAVE ACCOUNT */}
                <View className="flex-row justify-center mt-6">
                  <Text className="text-gray-500 text-sm">
                    Already have an account?{' '}
                  </Text>
                  <TouchableOpacity onPress={goToSignIn}>
                    <Text className="text-emerald-700 font-semibold text-sm">
                      Sign In
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </LinearGradient>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

export default SignUp;
