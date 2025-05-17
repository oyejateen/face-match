import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, FlatList, Modal, Pressable, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { saveImage, saveImages, getLocalUri } from '@/utils/imageStorage';

type ImageAsset = {
  uri: string;
  fileName?: string;
  type?: string;
};

export default function FaceMatchScreen() {
  const router = useRouter();
  const [targetImage, setTargetImage] = useState<ImageAsset | null>(null);
  const [comparisonImages, setComparisonImages] = useState<ImageAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<{ matches: string[], non_matches: string[] } | null>(null);
  const [viewer, setViewer] = useState({ visible: false, uri: '' });
  const [albumName, setAlbumName] = useState('');
  const [showAlbumInput, setShowAlbumInput] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Pick a single target image
  const pickTargetImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setTargetImage({
          uri: asset.uri,
          fileName: asset.fileName || undefined,
          type: asset.mimeType || undefined,
        });
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to pick image');
    }
  };

  // Pick multiple comparison images
  const pickComparisonImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const assets = result.assets.map(asset => ({
          uri: asset.uri,
          fileName: asset.fileName || undefined,
          type: asset.mimeType || undefined,
        }));
        setComparisonImages(assets);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to pick images');
    }
  };

  // Remove a comparison image
  const removeComparisonImage = (idx: number) => {
    setComparisonImages((imgs) => imgs.filter((_, i) => i !== idx));
  };

  // Upload images to backend and get results
  const findMatch = async () => {
    if (!targetImage || comparisonImages.length < 2) {
      Alert.alert('Error', 'Please select a target image and at least 2 comparison images');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);
    setUploadProgress(0);

    try {
      // Save images locally first
      const savedTargetPath = await saveImage(targetImage.uri);
      const savedComparisonPaths = await saveImages(comparisonImages.map(img => img.uri));

      const formData = new FormData();
      
      // Add target image
      formData.append('target', {
        uri: getLocalUri(savedTargetPath),
        name: targetImage.fileName || 'target.jpg',
        type: targetImage.type || 'image/jpeg',
      } as any);

      // Add comparison images
      savedComparisonPaths.forEach((path, idx) => {
        formData.append('comparisons', {
          uri: getLocalUri(path),
          name: `comparison_${idx}.jpg`,
          type: 'image/jpeg',
        } as any);
      });

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('http://192.168.122.166:5000/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error');
      }

      const data = await response.json();
      
      // Create a map of filenames to local paths
      const filenameToPath = new Map(
        savedComparisonPaths.map((path, index) => [
          `comparison_${index}.jpg`,
          path
        ])
      );
      
      // Map filenames back to local image paths using the filename map
      const matches = data.matches.map((filename: string) => {
        return filenameToPath.get(filename);
      }).filter(Boolean) as string[];
      
      const nonMatches = data.non_matches.map((filename: string) => {
        return filenameToPath.get(filename);
      }).filter(Boolean) as string[];

      // Navigate to results screen with local paths
      router.push({
        pathname: '/results',
        params: {
          matches: JSON.stringify(matches),
          non_matches: JSON.stringify(nonMatches),
          targetImage: savedTargetPath,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process images';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Save matches as album
  const saveAsAlbum = async () => {
    if (!albumName.trim() || !results?.matches.length) {
      Alert.alert('Error', 'Please enter an album name and ensure you have matches to save');
      return;
    }

    try {
      const newAlbum = {
        name: albumName.trim(),
        matches: results.matches,
        targetImage: targetImage?.uri || '',
        createdAt: new Date().toISOString(),
      };

      const savedAlbums = await AsyncStorage.getItem('albums');
      const albums = savedAlbums ? JSON.parse(savedAlbums) : [];
      
      // Check if album name already exists
      if (albums.some((album: any) => album.name === newAlbum.name)) {
        Alert.alert('Error', 'An album with this name already exists');
        return;
      }

      albums.push(newAlbum);
      await AsyncStorage.setItem('albums', JSON.stringify(albums));
      
      setShowSaveDialog(false);
      setAlbumName('');
      Alert.alert('Success', 'Album saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save album');
    }
  };

  // Render image item for FlatList
  const renderImageItem = ({ item }: { item: string }) => (
    <Pressable 
      onPress={() => setViewer({ visible: true, uri: getLocalUri(item) })}
      style={styles.imageContainer}
    >
      <Image 
        source={{ uri: getLocalUri(item) }} 
        style={styles.resultImage}
        resizeMode="cover"
      />
    </Pressable>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Face Match</Text>
      {/* Target Image Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Target Image</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={pickTargetImage} disabled={loading}>
          {targetImage ? (
            <Image source={{ uri: targetImage.uri }} style={styles.image} />
          ) : (
            <Text style={styles.uploadText}>Upload Target Face</Text>
          )}
        </TouchableOpacity>
        {targetImage && (
          <TouchableOpacity onPress={() => setTargetImage(null)} style={styles.removeBtn} disabled={loading}>
            <Text style={styles.removeBtnText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* Comparison Images Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comparison Images</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={pickComparisonImages} disabled={loading}>
          {comparisonImages.length > 0 ? (
            <ScrollView horizontal>
              {comparisonImages.map((img, idx) => (
                <View key={idx} style={{ alignItems: 'center' }}>
                  <Image source={{ uri: img.uri }} style={styles.imageSmall} />
                  <TouchableOpacity onPress={() => removeComparisonImage(idx)} disabled={loading}>
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.uploadText}>Upload Comparison Images</Text>
          )}
        </TouchableOpacity>
      </View>
      {/* Match Button */}
      <TouchableOpacity 
        style={[styles.matchButton, (!targetImage || comparisonImages.length < 2 || loading) && styles.disabled]} 
        disabled={!targetImage || comparisonImages.length < 2 || loading} 
        onPress={findMatch}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.loadingText}>
              Processing... {uploadProgress}%
            </Text>
          </View>
        ) : (
          <Text style={styles.matchButtonText}>Find Match</Text>
        )}
      </TouchableOpacity>
      {/* Error Message */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {/* Results Section */}
      {results && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsHeader}>Results</Text>
          <View style={styles.dualColumnContainer}>
            <View style={styles.column}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Matches ({results.matches.length})</Text>
                {results.matches.length > 0 && !showAlbumInput && (
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={() => setShowSaveDialog(true)}
                  >
                    <Text style={styles.saveButtonText}>Save as Album</Text>
                  </TouchableOpacity>
                )}
              </View>
              {showAlbumInput && (
                <View style={styles.albumInputContainer}>
                  <TextInput
                    style={styles.albumInput}
                    placeholder="Enter album name"
                    value={albumName}
                    onChangeText={setAlbumName}
                  />
                  <View style={styles.albumInputButtons}>
                    <TouchableOpacity 
                      style={[styles.albumButton, styles.cancelButton]}
                      onPress={() => {
                        setShowAlbumInput(false);
                        setAlbumName('');
                      }}
                    >
                      <Text style={styles.albumButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.albumButton, styles.saveAlbumButton]}
                      onPress={saveAsAlbum}
                    >
                      <Text style={styles.albumButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              <FlatList
                data={results.matches}
                keyExtractor={(item, idx) => item + idx}
                renderItem={renderImageItem}
                numColumns={2}
                contentContainerStyle={styles.flatListContent}
                ListEmptyComponent={<Text style={styles.uploadText}>No matches</Text>}
              />
            </View>
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Non-Matches ({results.non_matches.length})</Text>
              <FlatList
                data={results.non_matches}
                keyExtractor={(item, idx) => item + idx}
                renderItem={renderImageItem}
                numColumns={2}
                contentContainerStyle={styles.flatListContent}
                ListEmptyComponent={<Text style={styles.uploadText}>No non-matches</Text>}
              />
            </View>
          </View>
        </View>
      )}
      {/* Image Viewer Modal */}
      <Modal visible={viewer.visible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <Pressable style={styles.modalBg} onPress={() => setViewer({ visible: false, uri: '' })}>
            <Image source={{ uri: viewer.uri }} style={styles.fullImage} resizeMode="contain" />
          </Pressable>
        </View>
      </Modal>
      {/* Save Album Dialog */}
      <Modal
        visible={showSaveDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save as Album</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter album name"
              value={albumName}
              onChangeText={setAlbumName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowSaveDialog(false);
                  setAlbumName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveAlbumButton]}
                onPress={saveAsAlbum}
              >
                <Text style={styles.saveAlbumButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#222',
  },
  section: {
    width: '100%',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#222',
  },
  uploadBox: {
    height: 120,
    borderWidth: 2,
    borderColor: '#111',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  uploadText: {
    color: '#888',
    fontSize: 16,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  imageSmall: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  matchButton: {
    backgroundColor: '#111',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 8,
    marginTop: 16,
    opacity: 1,
  },
  matchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  removeBtn: {
    marginTop: 8,
    alignSelf: 'center',
  },
  removeBtnText: {
    color: '#d00',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#d00',
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  resultsContainer: {
    width: '100%',
    marginTop: 32,
    marginBottom: 32,
  },
  resultsHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
    textAlign: 'center',
  },
  dualColumnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginHorizontal: 4,
  },
  flatListContent: {
    gap: 8,
  },
  resultImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    margin: 4,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '80%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
  },
  albumInputContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  albumInput: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  albumInputButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  albumButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  saveAlbumButton: {
    backgroundColor: '#111',
  },
  albumButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  matchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#222',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveAlbumButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  imageContainer: {
    width: '48%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
}); 