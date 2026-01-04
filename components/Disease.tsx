import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  const getSeverityColor = (sev: Prediction['severity']) => {
    if (sev === 'Low') return { bg: '#d1fae5', text: '#065f46' };
    if (sev === 'Medium') return { bg: '#fef3c7', text: '#92400e' };
    return { bg: '#fee2e2', text: '#991b1b' };
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
    <View style={{ flex: 1, backgroundColor: '#064e3b' }}>
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <LinearGradient
          colors={['#064e3b', '#166534', '#15803d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1 }}
        >
          {/* Fixed Header */}
          <View style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 16,
            backgroundColor: 'rgba(0,0,0,0.15)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ color: '#fef3c7', fontSize: 20, fontWeight: '700', letterSpacing: 0.3 }}>
                  Disease Detection
                </Text>
                <Text style={{ color: '#fef9e7', fontSize: 12, marginTop: 4, opacity: 0.9 }}>
                  AI-powered pineapple disease identification
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(254, 243, 199, 0.15)',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(254, 243, 199, 0.3)',
                }}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={16} color="#fef3c7" />
                <Text style={{ fontSize: 12, color: '#fef3c7', marginLeft: 6, fontWeight: '600' }}>
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView 
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Image Card */}
            <View style={{
              backgroundColor: '#ffffff',
              borderRadius: 20,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 5,
            }}>
              <Text style={{ color: '#064e3b', fontWeight: '700', fontSize: 15, marginBottom: 14 }}>
                Image Upload
              </Text>
              
              <View style={{
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: '#f3f4f6',
                height: 240,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#e5e7eb',
                borderStyle: 'dashed',
              }}>
                {imageUri ? (
                  <Image 
                    source={{ uri: imageUri }} 
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons name="cloud-upload-outline" size={48} color="#9ca3af" />
                    <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 12, fontWeight: '500' }}>
                      No image selected
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', marginTop: 16, gap: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#f0fdf4',
                    borderWidth: 1.5,
                    borderColor: '#86efac',
                    borderRadius: 14,
                    paddingVertical: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={pickFromCamera}
                >
                  <Ionicons name="camera" size={20} color="#166534" />
                  <Text style={{ color: '#166534', fontWeight: '700', marginLeft: 8, fontSize: 14 }}>
                    Camera
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#f0fdf4',
                    borderWidth: 1.5,
                    borderColor: '#86efac',
                    borderRadius: 14,
                    paddingVertical: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={pickFromGallery}
                >
                  <Ionicons name="images" size={20} color="#166534" />
                  <Text style={{ color: '#166534', fontWeight: '700', marginLeft: 8, fontSize: 14 }}>
                    Gallery
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={analyzeImage}
                disabled={isAnalyzing}
                style={{ marginTop: 16 }}
              >
                <LinearGradient
                  colors={isAnalyzing ? ['#9ca3af', '#9ca3af'] : ['#15803d', '#16a34a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 16,
                    borderRadius: 14,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {isAnalyzing && <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />}
                  <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>
                    {isAnalyzing ? 'Analyzing Image...' : 'Analyze Image'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Result Card */}
            {prediction && (
              <View style={{
                backgroundColor: '#ffffff',
                borderRadius: 20,
                padding: 20,
                marginTop: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 5,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={{ color: '#064e3b', fontWeight: '700', fontSize: 17 }}>
                    Detection Result
                  </Text>
                  <View style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                    backgroundColor: getSeverityColor(prediction.severity).bg,
                  }}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: getSeverityColor(prediction.severity).text,
                    }}>
                      {prediction.severity} Risk
                    </Text>
                  </View>
                </View>
                
                <Text style={{ color: '#064e3b', fontSize: 18, fontWeight: '700', marginTop: 8 }}>
                  {prediction.disease}
                </Text>
                <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 4, fontWeight: '500' }}>
                  {confidenceText}
                </Text>
                
                <View style={{ marginTop: 18, paddingTop: 18, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
                  <Text style={{ color: '#064e3b', fontWeight: '700', fontSize: 14, marginBottom: 10 }}>
                    Recommended Actions
                  </Text>
                  {prediction.notes.map((n, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' }}>
                      <Ionicons name="checkmark-circle" size={18} color="#16a34a" style={{ marginTop: 2 }} />
                      <Text style={{ color: '#374151', fontSize: 13, marginLeft: 10, flex: 1, lineHeight: 20 }}>
                        {n}
                      </Text>
                    </View>
                  ))}
                </View>
                
                <View style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: '#e5e7eb',
                }}>
                  <Text style={{ fontSize: 11, color: '#9ca3af', lineHeight: 16, textAlign: 'center' }}>
                    ⚠️ AI-assisted diagnosis. Please consult with a certified agronomist for critical decisions.
                  </Text>
                </View>
              </View>
            )}

            {/* Treatment & Prevention */}
            <View style={{ marginTop: 28 }}>
              <Text style={{ color: '#fef3c7', fontWeight: '700', fontSize: 17, marginBottom: 14 }}>
                Disease Reference Guide
              </Text>

              {DISEASES.map((item) => {
                const isExpanded = expandedDiseases.includes(item.disease);
                return (
                  <TouchableOpacity
                    key={item.disease}
                    onPress={() => toggleDisease(item.disease)}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      elevation: 3,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#dc2626', fontWeight: '700', fontSize: 15, flex: 1 }}>
                        {item.disease}
                      </Text>
                      <Ionicons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="#6b7280" 
                      />
                    </View>
                    
                    {isExpanded && (
                      <View style={{ marginTop: 14 }}>
                        <Text style={{ color: '#064e3b', fontWeight: '700', fontSize: 13, marginBottom: 8 }}>
                          Prevention Tips
                        </Text>
                        {item.prevention.map((tip, idx) => (
                          <Text key={idx} style={{ color: '#4b5563', fontSize: 12, marginBottom: 6, lineHeight: 18 }}>
                            • {tip}
                          </Text>
                        ))}
                        
                        <Text style={{ color: '#064e3b', fontWeight: '700', fontSize: 13, marginTop: 12, marginBottom: 8 }}>
                          Treatment Steps
                        </Text>
                        {item.remedies.map((step, idx) => (
                          <Text key={idx} style={{ color: '#4b5563', fontSize: 12, marginBottom: 6, lineHeight: 18 }}>
                            {idx + 1}. {step}
                          </Text>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Footer */}
            <View style={{ marginTop: 24, paddingVertical: 16 }}>
              <Text style={{ fontSize: 11, color: 'rgba(254, 249, 231, 0.7)', textAlign: 'center', lineHeight: 16 }}>
                Powered by AI Technology
              </Text>
              <Text style={{ fontSize: 11, color: 'rgba(254, 249, 231, 0.7)', textAlign: 'center', marginTop: 4 }}>
                Pineapple Disease & Pest Research Project
              </Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </View>
  );
};

export default Pd;