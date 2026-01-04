import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import axios from "axios";
import { RootStackParamList } from "./types";
import { environment } from "@/environment/environment";
import { useAppDispatch, useAppSelector } from "../store/store";
import {
  setLoading,
  loginFailure,
  persistLogin,
  clearError,
} from "../store/slices/authSlice";

const logo = require("../assets/p.png");

type SignInNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "SignIn"
>;

const SignIn: React.FC = () => {
  const navigation = useNavigation<SignInNavigationProp>();
  const dispatch = useAppDispatch();
  const hasNavigated = useRef(false);
  const insets = useSafeAreaInsets();

  const { isLoading, error, isAuthenticated, token } = useAppSelector(
    (state) => state.auth
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shouldAutoNavigate, setShouldAutoNavigate] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      hasNavigated.current = false;
      setShouldAutoNavigate(false);

      if (error) dispatch(clearError());
    }, [error])
  );

  useEffect(() => {
    if (
      isAuthenticated &&
      token &&
      shouldAutoNavigate &&
      !hasNavigated.current
    ) {
      hasNavigated.current = true;
      setTimeout(() => {
        navigation.navigate("Home");
      }, 150);
    }
  }, [isAuthenticated, token, shouldAutoNavigate, navigation]);

  useEffect(() => {
    if (error && (email || password)) {
      dispatch(clearError());
    }
  }, [email, password, error]);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email");
      return;
    }

    dispatch(setLoading(true));

    try {
      const response = await axios.post(
        `${environment.API_BASE_URL}api/auth/user/login`,
        {
          email: email.toLowerCase().trim(),
          password,
        },
        { timeout: 10000 }
      );

      const { success, token, user, message } = response.data;

      if (success && token) {
        await dispatch(persistLogin(token, user));
        setShouldAutoNavigate(true);

        Alert.alert("Success", message || "Login successful!", [
          {
            text: "OK",
            onPress: () => {
              hasNavigated.current = true;
              navigation.navigate("Home");
            },
          },
        ]);
      } else {
        dispatch(loginFailure(message || "Login failed"));
        Alert.alert("Error", message || "Login failed");
      }
    } catch (err: any) {
      let msg = "An error occurred";

      if (err.response) {
        if (err.response.status === 401) msg = "Invalid email or password";
        else msg = err.response.data.message || "Login failed";
      } else {
        msg = "Network error. Please try again.";
      }

      dispatch(loginFailure(msg));
      Alert.alert("Login Failed", msg);
    }
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
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <LinearGradient
            colors={["#064e3b", "#166534", "#facc15"]}
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
                  className="w-28 h-28 mb-4"
                  style={{ resizeMode: "contain" }}
                />
                <Text className="text-xl font-bold text-amber-300 tracking-widest">
                  PINEAPPLE ASSISTANT
                </Text>
                <Text className="text-sm text-emerald-50 mt-2">
                  Smart Pest Detection & Alerts
                </Text>
              </View>

              {/* CARD */}
              <View
                className="bg-white/95 mx-5 rounded-3xl px-6 py-7"
                style={{
                  shadowColor: "#000",
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 15,
                }}
              >
                <Text className="text-2xl font-bold text-emerald-900 text-center mb-2">
                  Sign In
                </Text>
                <Text className="text-center text-gray-500 text-sm mb-6">
                  Enter your login details below
                </Text>

                {error && (
                  <View className="bg-red-50 border border-red-200 p-3 rounded-xl mb-5">
                    <Text className="text-center text-red-600 text-xs">
                      {error}
                    </Text>
                  </View>
                )}

                {/* EMAIL */}
                <View className="mb-4">
                  <Text className="text-gray-700 mb-2 text-sm">Email</Text>
                  <View
                    className={`flex-row items-center border rounded-xl px-4 py-3 bg-gray-50 ${
                      isEmailFocused ? "border-emerald-600" : "border-gray-300"
                    }`}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={isEmailFocused ? "#047857" : "#9CA3AF"}
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
                        ? "border-emerald-600"
                        : "border-gray-300"
                    }`}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={isPasswordFocused ? "#047857" : "#9CA3AF"}
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      className="flex-1 text-gray-800"
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={20}
                        color="#047857"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    Alert.alert("Forgot Password", "Reset link will be sent.")
                  }
                  className="self-end mb-5"
                >
                  <Text className="text-emerald-700 text-xs font-medium">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                {/* SIGN IN BUTTON */}
                <TouchableOpacity onPress={handleSignIn} disabled={isLoading}>
                  <LinearGradient
                    colors={
                      isLoading
                        ? ["#aaaaaa", "#aaaaaa"]
                        : ["#166534", "#22c55e"]
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
                      {isLoading ? "Signing in…" : "Sign In"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* DIVIDER */}
                <View className="flex-row items-center my-6">
                  <View className="flex-1 h-px bg-gray-200" />
                  <Text className="mx-3 text-gray-400 text-xs">New here?</Text>
                  <View className="flex-1 h-px bg-gray-200" />
                </View>

                {/* SIGN UP */}
                <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
                  <View className="py-4 rounded-xl border border-emerald-600 bg-emerald-50/50">
                    <Text className="text-center text-emerald-700 font-semibold">
                      Create New Account
                    </Text>
                  </View>
                </TouchableOpacity>
                
              </View>
            </ScrollView>
          </LinearGradient>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

export default SignIn;
