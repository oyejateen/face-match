import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, Pressable, Modal, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getLocalUri } from '@/utils/imageStorage';

type ResultsParams = {
  matches: string[];
  non_matches: string[];
  targetImage: string;
};

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<ResultsParams>();
  const [viewer, setViewer] = useState({ visible: false, uri: '' });
  const [albumName, setAlbumName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Parse the results from params
  const matches = JSON.parse((params.matches as unknown as string) || '[]') as string[];
  const nonMatches = JSON.parse((params.non_matches as unknown as string) || '[]') as string[];
  const targetImage = params.targetImage as string;

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

  const saveAsAlbum = async () => {
    if (!albumName.trim()) {
      Alert.alert('Error', 'Please enter an album name');
      return;
    }

    try {
      const newAlbum = {
        name: albumName.trim(),
        matches: matches,
        targetImage: targetImage,
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

  return (
    <View style={styles.container}>
      {/* Target Image */}
      <View style={styles.targetSection}>
        <Text style={styles.sectionTitle}>Target Image</Text>
        <Pressable 
          onPress={() => setViewer({ visible: true, uri: getLocalUri(targetImage) })}
          style={styles.targetImageContainer}
        >
          <Image 
            source={{ uri: getLocalUri(targetImage) }} 
            style={styles.targetImage}
            resizeMode="cover"
          />
        </Pressable>
      </View>

      {/* Matches Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Matches ({matches.length})</Text>
          {matches.length > 0 && (
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={() => setShowSaveDialog(true)}
            >
              <Text style={styles.saveButtonText}>Save as Album</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={matches}
          renderItem={renderImageItem}
          keyExtractor={(item, index) => `match-${index}`}
          numColumns={2}
          contentContainerStyle={styles.imageGrid}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No matches found</Text>
          }
        />
      </View>

      {/* Non-Matches Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Non-Matches ({nonMatches.length})</Text>
        <FlatList
          data={nonMatches}
          renderItem={renderImageItem}
          keyExtractor={(item, index) => `nonmatch-${index}`}
          numColumns={2}
          contentContainerStyle={styles.imageGrid}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No non-matches found</Text>
          }
        />
      </View>

      {/* Image Viewer Modal */}
      <Modal visible={viewer.visible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <Pressable style={styles.modalBg} onPress={() => setViewer({ visible: false, uri: '' })}>
            <Image 
              source={{ uri: viewer.uri }} 
              style={styles.fullImage} 
              resizeMode="contain"
            />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  targetSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 12,
  },
  targetImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  targetImage: {
    width: '100%',
    height: '100%',
  },
  imageGrid: {
    gap: 8,
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
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
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
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveAlbumButton: {
    backgroundColor: '#007AFF',
  },
  saveAlbumButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
}); 