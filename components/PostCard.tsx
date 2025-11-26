import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { environment } from '@/environment/environment';

const { width } = Dimensions.get('window');


interface Comment {
  _id: string;
  text: string;
  userId: {
    _id: string;
    username: string;
    email: string;
    registrationId: string;
    type: string;
  };
  createdAt: string;
}

interface RootState {
  auth: {
    token: string | null;
    user: {
      _id: string;
      username: string;
    } | null;
  };
}

interface PostCardProps {
  item: {
    _id: string;
    photos?: string[];
    status: 'lost' | 'found';
    createdAt: string;
    isResolved?: boolean;
    name: string;
    description?: string;
    location: string;
    date: string;
    category: string;
    userId?: {
      _id: string;
      username?: string;
    };
    contactInfo?: string;
    timeSince?: string;
  };
  onPress?: (item: any) => void;
}

const PostCard: React.FC<PostCardProps> = ({ item, onPress }) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Comment['userId'] | null>(null);
  const [userModalVisible, setUserModalVisible] = useState(false);

  // Get auth data from Redux
  const { token, user } = useSelector((state: RootState) => state.auth);
  const currentUserId = user?._id || '';

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${environment.API_BASE_URL}api/comments/${item._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.success) {
        setComments(response.data.comments);
      }
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${environment.API_BASE_URL}api/comments`,
        {
          itemId: item._id,
          text: commentText.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.data.success) {
        setComments([response.data.comment, ...comments]);
        setCommentText('');
        Alert.alert('Success', 'Comment added successfully');
      }
    } catch (error: any) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axios.delete(
                `${environment.API_BASE_URL}api/comments/${commentId}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              
              if (response.data.success) {
                setComments(comments.filter(c => c._id !== commentId));
                Alert.alert('Success', 'Comment deleted successfully');
              }
            } catch (error: any) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  const handleCommentsPress = () => {
    setCommentsVisible(true);
    fetchComments();
  };

  const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      if (diffMinutes <= 1) return 'Just now';
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatReportDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleImagePress = (index: number) => {
    setCurrentImageIndex(index);
    setPreviewVisible(true);
  };

  const handlePreviewScroll = (event: { nativeEvent: { contentOffset: { x: any; }; }; }) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentImageIndex(index);
  };

  const renderImageCollage = () => {
    if (!item.photos || item.photos.length === 0) {
      return (
        <View
          className="bg-gray-100 rounded-xl items-center justify-center"
          style={{ width: '100%', height: 200 }}
        >
          <Ionicons
            name={item.status === 'lost' ? 'search-outline' : 'checkmark-circle-outline'}
            size={48}
            color="#06b6d4"
          />
          <Text className="text-gray-500 mt-2 text-sm">No images available</Text>
        </View>
      );
    }

    const photos = item.photos;
    const photoCount = photos.length;

    if (photoCount === 1) {
      return (
        <TouchableOpacity onPress={() => handleImagePress(0)}>
          <Image
            source={{ uri: photos[0] }}
            style={{ width: '100%', height: 200 }}
            className="rounded-xl"
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }

    if (photoCount === 2) {
      return (
        <View className="flex-row space-x-1">
          {photos.slice(0, 2).map((photo, index) => (
            <TouchableOpacity
              key={index}
              className="flex-1"
              onPress={() => handleImagePress(index)}
            >
              <Image
                source={{ uri: photo }}
                style={{ height: 200 }}
                className="rounded-xl"
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (photoCount === 3) {
      return (
        <View className="flex-row space-x-1">
          <TouchableOpacity className="flex-1" onPress={() => handleImagePress(0)}>
            <Image
              source={{ uri: photos[0] }}
              style={{ height: 200 }}
              className="rounded-xl"
              resizeMode="cover"
            />
          </TouchableOpacity>
          <View className="flex-1 space-y-1">
            {photos.slice(1, 3).map((photo, index) => (
              <TouchableOpacity
                key={index + 1}
                onPress={() => handleImagePress(index + 1)}
              >
                <Image
                  source={{ uri: photo }}
                  style={{ height: 99.5 }}
                  className="rounded-xl"
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    return (
      <View className="flex-row space-x-1">
        <TouchableOpacity className="flex-1" onPress={() => handleImagePress(0)}>
          <Image
            source={{ uri: photos[0] }}
            style={{ height: 200 }}
            className="rounded-xl"
            resizeMode="cover"
          />
        </TouchableOpacity>
        <View className="flex-1 space-y-1">
          <TouchableOpacity onPress={() => handleImagePress(1)}>
            <Image
              source={{ uri: photos[1] }}
              style={{ height: 99.5 }}
              className="rounded-xl"
              resizeMode="cover"
            />
          </TouchableOpacity>
          <TouchableOpacity className="relative" onPress={() => handleImagePress(2)}>
            <Image
              source={{ uri: photos[2] }}
              style={{ height: 99.5 }}
              className="rounded-xl"
              resizeMode="cover"
            />
            {photoCount > 3 && (
              <View className="absolute inset-0 bg-black/60 rounded-xl items-center justify-center">
                <Text className="text-white font-bold text-lg">+{photoCount - 3}</Text>
                <Text className="text-white text-xs">more</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleUserPress = (userInfo: Comment['userId']) => {
    setSelectedUser(userInfo);
    setUserModalVisible(true);
  };

  const renderCommentsModal = () => (
    <Modal
      visible={commentsVisible}
      animationType="slide"
      onRequestClose={() => setCommentsVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-gray-50"
      >
        <View className="flex-1">
          {/* Header */}
          <LinearGradient colors={['#ffffff', '#f0fdfa']} className="px-4 pt-12 pb-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-800">Comments</Text>
              <TouchableOpacity onPress={() => setCommentsVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Comments List */}
          <ScrollView className="flex-1 px-4 py-2">
            {loading && comments.length === 0 ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#06b6d4" />
              </View>
            ) : comments.length === 0 ? (
              <View className="py-12 items-center">
                <Ionicons name="chatbubble-outline" size={48} color="#9ca3af" />
                <Text className="text-gray-500 mt-2">No comments yet</Text>
                <Text className="text-gray-400 text-sm">Be the first to comment!</Text>
              </View>
            ) : (
              comments.map((comment) => (
                <View key={comment._id} className="bg-white rounded-lg p-3 mb-2">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <TouchableOpacity 
                        onPress={() => handleUserPress(comment.userId)}
                        className="flex-row items-center mb-1"
                      >
                        <View className="w-6 h-6 bg-teal-500 rounded-full items-center justify-center mr-2">
                          <Text className="text-white text-xs font-bold">
                            {comment.userId.username.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text className="font-medium text-gray-800">
                          {comment.userId.username}
                        </Text>
                        <Text className="text-gray-400 text-xs ml-2">
                          {formatDate(comment.createdAt)}
                        </Text>
                      </TouchableOpacity>
                      <Text className="text-gray-700 ml-8">{comment.text}</Text>
                    </View>
                    {comment.userId._id === currentUserId && (
                      <TouchableOpacity
                        onPress={() => handleDeleteComment(comment._id)}
                        className="ml-2 p-1"
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Comment Input */}
          <View className="bg-white border-t border-gray-200 px-4 py-3">
            <View className="flex-row items-center space-x-2">
              <TextInput
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-gray-800"
                placeholder="Write a comment..."
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                onPress={handleAddComment}
                disabled={loading || !commentText.trim()}
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  commentText.trim() ? 'bg-cyan-500' : 'bg-gray-300'
                }`}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="send" size={18} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderUserModal = () => (
    <Modal
      visible={userModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setUserModalVisible(false)}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-white rounded-2xl w-full max-w-sm p-6">
          {/* Close Button */}
          <TouchableOpacity
            onPress={() => setUserModalVisible(false)}
            className="absolute top-3 right-3 z-10"
          >
            <Ionicons name="close-circle" size={28} color="#9ca3af" />
          </TouchableOpacity>

          {/* User Avatar */}
          <View className="items-center mb-4">
            <View className="w-20 h-20 bg-teal-500 rounded-full items-center justify-center mb-3">
              <Text className="text-white text-3xl font-bold">
                {selectedUser?.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className="text-2xl font-bold text-gray-800">
              {selectedUser?.username}
            </Text>
          </View>

          {/* User Details */}
          <View className="space-y-3">
            {/* Email */}
            <View className="bg-gray-50 rounded-lg p-3">
              <View className="flex-row items-center">
                <Ionicons name="mail-outline" size={20} color="#06b6d4" />
                <View className="ml-3 flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Email</Text>
                  <Text className="text-sm text-gray-800 font-medium">
                    {selectedUser?.email}
                  </Text>
                </View>
              </View>
            </View>

            {/* Registration ID */}
            <View className="bg-gray-50 rounded-lg p-3">
              <View className="flex-row items-center">
                <Ionicons name="card-outline" size={20} color="#06b6d4" />
                <View className="ml-3 flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Registration ID</Text>
                  <Text className="text-sm text-gray-800 font-medium">
                    {selectedUser?.registrationId}
                  </Text>
                </View>
              </View>
            </View>

            {/* User Type */}
            <View className="bg-gray-50 rounded-lg p-3">
              <View className="flex-row items-center">
                <Ionicons name="person-outline" size={20} color="#06b6d4" />
                <View className="ml-3 flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Type</Text>
                  <Text className="text-sm text-gray-800 font-medium capitalize">
                    {selectedUser?.type}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            onPress={() => setUserModalVisible(false)}
            className="mt-6"
          >
            <LinearGradient
              colors={['#0891b2', '#06b6d4']}
              className="py-3 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">Close</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderImagePreview = () => (
    <Modal
      visible={previewVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setPreviewVisible(false)}
    >
      <View className="flex-1 bg-black">
        <View className="absolute top-0 left-0 right-0 z-10 pt-safe">
          <View className="flex-row items-center justify-between px-4 py-3">
            <TouchableOpacity
              onPress={() => setPreviewVisible(false)}
              className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white font-medium">
              {currentImageIndex + 1} of {item.photos?.length || 0}
            </Text>
            <View className="w-10" />
          </View>
        </View>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handlePreviewScroll}
          scrollEventThrottle={16}
          contentOffset={{ x: currentImageIndex * width, y: 0 }}
        >
          {item.photos?.map((photo, index) => (
            <View key={index} style={{ width }} className="flex-1 items-center justify-center">
              <Image
                source={{ uri: photo }}
                style={{ width: width - 20, height: '80%' }}
                resizeMode="contain"
              />
            </View>
          ))}
        </ScrollView>

        {item.photos && item.photos.length > 1 && (
          <View className="absolute bottom-0 left-0 right-0 pb-safe">
            <View className="flex-row justify-center space-x-2 py-4">
              {item.photos.map((_, index) => (
                <View
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );

  return (
    <>
      <TouchableOpacity
        onPress={() => onPress && onPress(item)}
        className="bg-white rounded-2xl p-4 mb-8 mx-6"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View
              className={`px-3 py-1 rounded-full ${
                item.status === 'lost' ? 'bg-red-100' : 'bg-teal-100'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  item.status === 'lost' ? 'text-red-600' : 'text-teal-600'
                }`}
              >
                {item.status.toUpperCase()}
              </Text>
            </View>
            <Text className="text-gray-400 text-xs ml-2">
              Posted {formatDate(item.createdAt)}
            </Text>
          </View>

          {item.isResolved && (
            <View className="bg-green-100 px-2 py-1 rounded-full">
              <Text className="text-green-600 text-xs font-medium">RESOLVED</Text>
            </View>
          )}
        </View>

        {/* Image Collage */}
        {renderImageCollage()}

        {/* Item Details */}
        <View className="mt-4">
          <Text className="text-lg font-bold text-gray-800 mb-1" numberOfLines={2}>
            {item.name}
          </Text>

          {item.description && (
            <Text className="text-sm text-gray-600 mb-3" numberOfLines={3}>
              {item.description}
            </Text>
          )}

          {/* Location and Date */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <Ionicons name="location-outline" size={16} color="#06b6d4" />
              <Text className="text-sm text-gray-700 ml-1 flex-1" numberOfLines={1}>
                {item.location}
              </Text>
            </View>

            <View className="flex-row items-center ml-3">
              <Ionicons name="calendar-outline" size={16} color="#06b6d4" />
              <Text className="text-sm text-gray-700 ml-1">
                {formatReportDate(item.date)}
              </Text>
            </View>
          </View>

          {/* Category and User Info */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="bg-cyan-50 px-2 py-1 rounded-lg">
                <Text className="text-cyan-700 text-xs font-medium capitalize">
                  {item.category}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-6 h-6 bg-teal-500 rounded-full items-center justify-center mr-2">
                <Text className="text-white text-xs font-bold">
                  {item.userId?.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <Text className="text-xs text-gray-600">
                {item.userId?.username || 'Anonymous'}
              </Text>
            </View>
          </View>

          {/* Contact Info */}
          {item.contactInfo && (
            <LinearGradient
              colors={item.status === 'found' ? ['#f0fdfa', '#ccfbf1'] : ['#fef2f2', '#fecaca']}
              className="mt-3 p-3 rounded-lg"
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="call-outline"
                  size={14}
                  color={item.status === 'found' ? '#0f766e' : '#dc2626'}
                />
                <Text
                  className={`text-xs font-medium ml-1 ${
                    item.status === 'found' ? 'text-teal-700' : 'text-red-700'
                  }`}
                >
                  Contact: {item.contactInfo}
                </Text>
              </View>
            </LinearGradient>
          )}

          {/* Comments Button */}
          <TouchableOpacity
            onPress={handleCommentsPress}
            className="mt-3 flex-row items-center justify-center bg-gray-50 rounded-lg py-2"
          >
            <Ionicons name="chatbubble-outline" size={16} color="#06b6d4" />
            <Text className="text-cyan-600 text-sm font-medium ml-2">View Comments</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Modals */}
      {renderImagePreview()}
      {renderCommentsModal()}
      {renderUserModal()}
    </>
  );
};

export default PostCard;