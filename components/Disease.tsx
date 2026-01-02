
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

type Prediction = {
  disease: string;
  confidence: number;
  severity: 'Low' | 'Medium' | 'High';
  notes: string[];
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type DiseaseInfo = {
  disease: string;
  prevention: string[];
  remedies: string[];
};

// Diseases
const DISEASES: DiseaseInfo[] = [
  {
    disease: 'Crown Rot',
    prevention: [
      'Avoid waterlogging and improve drainage.',
      'Use disease-free planting material.',
      'Ensure proper spacing between plants.',
    ],
    remedies: [
      'Remove affected crowns immediately.',
      'Apply recommended fungicides if necessary.',
      'Consult an agronomist for expert advice.',
    ],
  },
  {
    disease: 'Fruit Fasciation',
    prevention: [
      'Maintain hygiene in the field.',
      'Remove infected debris promptly.',
      'Avoid injury to young fruits during cultivation.',
    ],
    remedies: [
      'Prune infected fruits to prevent spread.',
      'Monitor closely for recurring symptoms.',
      'Consult agronomist for corrective measures.',
    ],
  },
  {
    disease: 'Fruit Rot',
    prevention: [
      'Avoid overhead irrigation; keep fruits dry.',
      'Ensure good air circulation between plants.',
      'Remove decayed fruits regularly.',
    ],
    remedies: [
      'Remove and destroy infected fruits.',
      'Use fungicide sprays recommended by experts.',
      'Maintain field sanitation.',
    ],
  },
  {
    disease: 'Mealybug Wilt',
    prevention: [
      'Inspect plants regularly for mealybugs.',
      'Encourage natural predators.',
      'Avoid spreading infestation via contaminated tools.',
    ],
    remedies: [
      'Use appropriate insecticides.',
      'Remove heavily infested plants.',
      'Apply organic or chemical control as needed.',
    ],
  },
  {
    disease: 'Root Rot',
    prevention: [
      'Improve soil drainage.',
      'Avoid overwatering.',
      'Plant in well-aerated soils.',
    ],
    remedies: [
      'Remove infected roots and replant healthy ones.',
      'Apply fungicides if necessary.',
      'Monitor plant health regularly.',
    ],
  },
];

const Pd: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);

  // Collapsible state for diseases
  const [expandedDiseases, setExpandedDiseases] = useState<string[]>([]);

  const confidenceText = useMemo(() => {
    if (!prediction) return '';
    return `${Math.round(prediction.confidence * 100)}% confidence`;
  }, [prediction]);

  const toggleDisease = (name: string) => {
    setExpandedDiseases((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    );
  };

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
    if (!res.canceled) setImageUri(res.assets[0].uri);
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
    if (!res.canceled) setImageUri(res.assets[0].uri);
  };

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
        disease: 'Crown Rot (Suspected)',
        confidence: 0.88,
        severity: 'Medium',
        notes: [
          'Remove infected crowns immediately.',
          'Ensure proper drainage and avoid waterlogging.',
          'Consult an agronomist for fungicide recommendations.',
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

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Do you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-emerald-900">
      <View className="flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <LinearGradient
          colors={['#064e3b', '#166534', '#facc15']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="flex-1"
        >
          {/* Header */}
          <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-amber-100 text-lg font-semibold">
                Disease Identification
              </Text>
              <Text className="text-emerald-50/90 text-xs mt-1">
                Capture a pineapple leaf image and let AI identify possible disease symptoms.
              </Text>
            </View>
            <TouchableOpacity
              className="flex-row items-center bg-emerald-900/40 px-3 py-2 rounded-full"
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={18} color="#fefce8" />
                  <Text className="text-xs text-amber-100 ml-1 font-medium">
                      Sign Out
                  </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Image Card */}
            <View className="px-5 mt-2">
              <View className="bg-white/95 rounded-3xl p-4">
                <Text className="text-emerald-900 font-semibold text-sm mb-3">Image Preview</Text>
                <View className="rounded-2xl overflow-hidden bg-gray-100 h-56 items-center justify-center">
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <View className="items-center">
                      <Ionicons name="image-outline" size={36} color="#9CA3AF" />
                      <Text className="text-gray-400 text-xs mt-2">No image selected</Text>
                    </View>
                  )}
                </View>

                <View className="flex-row mt-4">
                  <TouchableOpacity
                    className="flex-1 bg-emerald-50 border border-emerald-200 rounded-2xl py-3 flex-row items-center justify-center mr-2"
                    onPress={pickFromCamera}
                  >
                    <Ionicons name="camera-outline" size={18} color="#166534" />
                    <Text className="text-emerald-800 font-semibold ml-2 text-sm">Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-emerald-50 border border-emerald-200 rounded-2xl py-3 flex-row items-center justify-center"
                    onPress={pickFromGallery}
                  >
                    <Ionicons name="images-outline" size={18} color="#166534" />
                    <Text className="text-emerald-800 font-semibold ml-2 text-sm">Gallery</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={analyzeImage}
                  disabled={isAnalyzing}
                  className="mt-3"
                >
                  <LinearGradient
                    colors={isAnalyzing ? ['#a3a3a3', '#a3a3a3'] : ['#166534', '#22c55e']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="py-4 rounded-2xl flex-row justify-center items-center"
                  >
                    {isAnalyzing && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
                    <Text className="text-white font-semibold text-base">
                      {isAnalyzing ? 'Analyzing…' : 'Analyze Image'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Result */}
            {prediction && (
              <View className="px-5 mt-4">
                <View className="bg-white/95 rounded-3xl p-5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-emerald-900 font-bold text-base">Result</Text>
                    <View className={`px-3 py-1 rounded-full ${severityBadgeClass(prediction.severity)}`}>
                      <Text className={`text-xs font-semibold ${severityTextClass(prediction.severity)}`}>
                        {prediction.severity} risk
                      </Text>
                    </View>
                  </View>
                  <Text className="text-emerald-900 text-lg font-semibold mt-2">{prediction.disease}</Text>
                  <Text className="text-gray-500 text-xs mt-1">{confidenceText}</Text>
                  <View className="mt-4">
                    <Text className="text-emerald-900 font-semibold text-sm mb-2">Recommended Actions</Text>
                    {prediction.notes.map((n, idx) => (
                      <View key={idx} className="flex-row mb-2">
                        <Ionicons name="checkmark-circle" size={16} color="#166534" />
                        <Text className="text-gray-700 text-sm ml-2 flex-1">{n}</Text>
                      </View>
                    ))}
                  </View>
                  <Text className="text-[11px] text-gray-400 mt-3">
                    Note: AI-assisted suggestion. Confirm with an agronomist for critical decisions.
                  </Text>
                </View>
              </View>
            )}

            {/* Treatment & Prevention - Only Diseases */}
            <View className="px-5 mt-6">
              <Text className="text-amber-100 font-semibold text-base mb-3">
                Treatment & Prevention
              </Text>

              {/* Diseases */}
              {DISEASES.map((item) => (
                <TouchableOpacity
                  key={item.disease}
                  onPress={() => toggleDisease(item.disease)}
                  className="bg-white rounded-2xl p-4 mb-3"
                >
                  <Text className="text-red-700 font-semibold">{item.disease}</Text>
                  {expandedDiseases.includes(item.disease) && (
                    <>
                      <Text className="text-emerald-900 font-semibold mt-2">Prevention Tips:</Text>
                      {item.prevention.map((tip, idx) => (
                        <Text key={idx} className="text-gray-700 text-xs mt-1">• {tip}</Text>
                      ))}
                      <Text className="text-emerald-900 font-semibold mt-2">Remedies:</Text>
                      {item.remedies.map((step, idx) => (
                        <Text key={idx} className="text-gray-700 text-xs mt-1">{idx + 1}. {step}</Text>
                      ))}
                    </>
                  )}
                </TouchableOpacity>
              ))}

              <View className="px-5 mt-4 mb-10">
                <Text className="text-[11px] text-emerald-50/90 text-center">
                  Powered by AI • Pineapple Disease & Pest Research Project
                </Text>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </View>
  );
};

export default Pd;
