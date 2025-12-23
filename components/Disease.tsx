import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from './types';


type Prediction = {
  disease: string;
  confidence: number; // 0..1
  severity: 'Low' | 'Medium' | 'High';
  notes: string[];
};

const Pd: React.FC = () => {
  const insets = useSafeAreaInsets();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);

  const confidenceText = useMemo(() => {
    if (!prediction) return '';
    return `${Math.round(prediction.confidence * 100)}% confidence`;
  }, [prediction]);

  const pickFromGallery = async () => {
    setPrediction(null);

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please allow gallery access.');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
      aspect: [4, 3],
      base64: false,
    });

    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
    }
  };

  const pickFromCamera = async () => {
    setPrediction(null);

    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please allow camera access.');
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      quality: 0.9,
      allowsEditing: true,
      aspect: [4, 3],
      base64: false,
    });

    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
    }
  };

  // Placeholder analysis function (replace with your ML model call / API call)
  const analyzeImage = async () => {
    if (!imageUri) {
      Alert.alert('No Image', 'Please capture or select an image first.');
      return;
    }

    setIsAnalyzing(true);
    setPrediction(null);

    try {
      await new Promise((r) => setTimeout(r, 1200));

      const fakeResult: Prediction = {
        disease: 'Leaf Spot (Suspected)',
        confidence: 0.86,
        severity: 'Medium',
        notes: [
          'Remove heavily infected leaves and dispose away from the field.',
          'Avoid overhead irrigation; reduce leaf wetness duration.',
          'Monitor nearby plants for spreading symptoms.',
          'If symptoms increase, consult an agronomist for suitable fungicide.',
        ],
      };

      setPrediction(fakeResult);
    } catch {
      Alert.alert('Error', 'Failed to analyze the image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const severityBadgeClass = (sev: Prediction['severity']) => {
    if (sev === 'Low') return 'bg-emerald-100';
    if (sev === 'Medium') return 'bg-amber-100';
    return 'bg-red-100';
  };

  const severityTextClass = (sev: Prediction['severity']) => {
    if (sev === 'Low') return 'text-emerald-700';
    if (sev === 'Medium') return 'text-amber-800';
    return 'text-red-700';
  };

  return (
    <View className="flex-1 bg-emerald-900">
      <View
        className="flex-1"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <LinearGradient
          colors={['#064e3b', '#166534', '#facc15']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="flex-1"
        >
          {/* Header */}
          <View className="px-5 pt-4 pb-3">
            <Text className="text-amber-100 text-lg font-semibold">
              Disease Identification
            </Text>
            <Text className="text-emerald-50/90 text-xs mt-1">
              Capture a pineapple leaf image and let AI identify possible disease
              symptoms.
            </Text>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Image Preview Card */}
            <View className="px-5 mt-2">
              <View
                className="bg-white/95 rounded-3xl p-4"
                style={{
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 12,
                }}
              >
                <Text className="text-emerald-900 font-semibold text-sm mb-3">
                  Image Preview
                </Text>

                <View className="rounded-2xl overflow-hidden bg-gray-100 h-56 items-center justify-center">
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="items-center">
                      <Ionicons name="image-outline" size={36} color="#9CA3AF" />
                      <Text className="text-gray-400 text-xs mt-2">
                        No image selected
                      </Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <View className="flex-row mt-4">
                  <TouchableOpacity
                    className="flex-1 bg-emerald-50 border border-emerald-200 rounded-2xl py-3 flex-row items-center justify-center mr-2"
                    onPress={pickFromCamera}
                  >
                    <Ionicons name="camera-outline" size={18} color="#166534" />
                    <Text className="text-emerald-800 font-semibold ml-2 text-sm">
                      Camera
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 bg-emerald-50 border border-emerald-200 rounded-2xl py-3 flex-row items-center justify-center"
                    onPress={pickFromGallery}
                  >
                    <Ionicons name="images-outline" size={18} color="#166534" />
                    <Text className="text-emerald-800 font-semibold ml-2 text-sm">
                      Gallery
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Analyze Button */}
                <TouchableOpacity
                  onPress={analyzeImage}
                  disabled={isAnalyzing}
                  className="mt-3"
                >
                  <LinearGradient
                    colors={
                      isAnalyzing
                        ? ['#a3a3a3', '#a3a3a3']
                        : ['#166534', '#22c55e']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="py-4 rounded-2xl flex-row justify-center items-center"
                  >
                    {isAnalyzing && (
                      <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                    )}
                    <Text className="text-white font-semibold text-base">
                      {isAnalyzing ? 'Analyzing…' : 'Analyze Image'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Result Card */}
            {prediction && (
              <View className="px-5 mt-4">
                <View className="bg-white/95 rounded-3xl p-5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-emerald-900 font-bold text-base">
                      Result
                    </Text>

                    <View
                      className={`px-3 py-1 rounded-full ${severityBadgeClass(
                        prediction.severity
                      )}`}
                    >
                      <Text
                        className={`text-xs font-semibold ${severityTextClass(
                          prediction.severity
                        )}`}
                      >
                        {prediction.severity} risk
                      </Text>
                    </View>
                  </View>

                  <Text className="text-emerald-900 text-lg font-semibold mt-2">
                    {prediction.disease}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1">
                    {confidenceText}
                  </Text>

                  <View className="mt-4">
                    <Text className="text-emerald-900 font-semibold text-sm mb-2">
                      Recommended Actions
                    </Text>

                    {prediction.notes.map((n, idx) => (
                      <View key={idx} className="flex-row mb-2">
                        <Ionicons name="checkmark-circle" size={16} color="#166534" />
                        <Text className="text-gray-700 text-sm ml-2 flex-1">
                          {n}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <Text className="text-[11px] text-gray-400 mt-3">
                    Note: AI-assisted suggestion. Confirm with an agronomist for
                    critical decisions.
                  </Text>
                </View>
              </View>
            )}

            {/* Footer */}
            <View className="px-5 mt-4">
              <Text className="text-[11px] text-emerald-50/90 text-center">
                Powered by AI • Pineapple Disease & Pest Research Project
              </Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </View>
  );
};

export default Pd;
