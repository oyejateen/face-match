import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, Modal, Pressable, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Header } from '@/components/Header';
import { Ionicons } from '@expo/vector-icons';
import { getLocalUri } from '@/utils/imageStorage';

type Album = {
  name: string;
  matches: string[];
  targetImage: string;
  createdAt: string;
  id: string;
};

export default function LibraryScreen() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [viewer, setViewer] = useState({ visible: false, uri: '' });
  const [refreshing, setRefreshing] = useState(false);

  const loadAlbums = async () => {
    try {
      const savedAlbums = await AsyncStorage.getItem('albums');
      if (savedAlbums) {
        const parsedAlbums = JSON.parse(savedAlbums);
        console.log('Loaded albums:', parsedAlbums);
        setAlbums(parsedAlbums);
      }
    } catch (error) {
      console.error('Error loading albums:', error);
      Alert.alert('Error', 'Failed to load albums');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAlbums();
    } catch (error) {
      console.error('Error refreshing albums:', error);
      Alert.alert('Error', 'Failed to refresh albums');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAlbums();
  }, []);

  const deleteAlbum = async (albumName: string) => {
    Alert.alert(
      'Delete Album',
      `Are you sure you want to delete "${albumName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedAlbums = albums.filter(album => album.name !== albumName);
              await AsyncStorage.setItem('albums', JSON.stringify(updatedAlbums));
              setAlbums(updatedAlbums);
              Alert.alert('Success', 'Album deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete album');
            }
          },
        },
      ]
    );
  };

  const handleImagePress = (uri: string) => {
    const cleanUri = uri.replace('file://', '');
    const localUri = getLocalUri(cleanUri);
    console.log('Original URI:', uri);
    console.log('Clean URI:', cleanUri);
    console.log('Final URI:', localUri);
    setViewer({ visible: true, uri: localUri });
  };

  const renderAlbumItem = ({ item }: { item: Album }) => (
    <View style={styles.albumCard}>
      <View style={styles.albumHeader}>
        <Text style={styles.albumName}>{item.name}</Text>
        <TouchableOpacity
          onPress={() => deleteAlbum(item.name)}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={20} color="#ff4444" />
        </TouchableOpacity>
      </View>
      <View style={styles.albumContent}>
        <Pressable 
          onPress={() => handleImagePress(item.targetImage)}
          style={styles.targetImageContainer}
        >
          <Image 
            source={{ uri: getLocalUri(item.targetImage.replace('file://', '')) }} 
            style={styles.targetImage}
            resizeMode="cover"
            onError={(e) => {
              console.error('Target image error:', e.nativeEvent.error);
              console.log('Failed target URI:', item.targetImage);
            }}
          />
        </Pressable>
        <View style={styles.matchesContainer}>
          {item.matches.slice(0, 3).map((uri, index) => (
            <Pressable
              key={index}
              onPress={() => handleImagePress(uri)}
              style={styles.matchImageContainer}
            >
              <Image 
                source={{ uri: getLocalUri(uri.replace('file://', '')) }} 
                style={styles.matchImage}
                resizeMode="cover"
                onError={(e) => {
                  console.error('Match image error:', e.nativeEvent.error);
                  console.log('Failed match URI:', uri);
                }}
              />
            </Pressable>
          ))}
          {item.matches.length > 3 && (
            <View style={styles.moreMatches}>
              <Text style={styles.moreMatchesText}>+{item.matches.length - 3}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.albumDate}>
        Created: {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Library" />
      {albums.length > 0 ? (
        <FlatList
          data={albums}
          renderItem={renderAlbumItem}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.albumList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#000']}
              tintColor="#000"
            />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No albums yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Save your matches as albums to see them here
          </Text>
        </View>
      )}

      {/* Image Viewer Modal */}
      <Modal visible={viewer.visible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <Pressable 
            style={styles.modalBg} 
            onPress={() => setViewer({ visible: false, uri: '' })}
          >
            {viewer.uri && (
              <Image 
                source={{ uri: viewer.uri }} 
                style={styles.fullImage} 
                resizeMode="contain"
                onError={(e) => {
                  console.error('Modal image error:', e.nativeEvent.error);
                  console.log('Failed modal URI:', viewer.uri);
                }}
                onLoad={() => {
                  console.log('Modal image loaded successfully:', viewer.uri);
                }}
              />
            )}
          </Pressable>
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
  albumList: {
    padding: 10,
  },
  albumCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  albumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  albumName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  deleteButton: {
    padding: 4,
  },
  albumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  targetImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  targetImage: {
    width: '100%',
    height: '100%',
  },
  matchesContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  matchImage: {
    width: '100%',
    height: '100%',
  },
  moreMatches: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreMatchesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  albumDate: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
}); 