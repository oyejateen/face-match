import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const IMAGE_DIRECTORY = `${FileSystem.documentDirectory}images/`;

// Ensure the images directory exists
export const ensureImageDirectory = async () => {
  const dirInfo = await FileSystem.getInfoAsync(IMAGE_DIRECTORY);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_DIRECTORY, { intermediates: true });
  }
};

// Save an image from URI to local storage
export const saveImage = async (uri: string): Promise<string> => {
  try {
    await ensureImageDirectory();
    
    // Generate a unique filename
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const destination = `${IMAGE_DIRECTORY}${filename}`;
    
    // Copy the file to our local directory
    await FileSystem.copyAsync({
      from: uri,
      to: destination
    });
    
    return destination;
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
};

// Save multiple images and return their local paths
export const saveImages = async (uris: string[]): Promise<string[]> => {
  try {
    const savedPaths = await Promise.all(uris.map(uri => saveImage(uri)));
    return savedPaths;
  } catch (error) {
    console.error('Error saving images:', error);
    throw error;
  }
};

// Get the local URI for an image
export const getLocalUri = (path: string): string => {
  if (Platform.OS === 'android') {
    // Remove any existing file:// prefix
    const cleanPath = path.replace('file://', '');
    return `file://${cleanPath}`;
  }
  return path;
};

// Delete an image from local storage
export const deleteImage = async (path: string): Promise<void> => {
  try {
    await FileSystem.deleteAsync(path);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// Delete multiple images from local storage
export const deleteImages = async (paths: string[]): Promise<void> => {
  try {
    await Promise.all(paths.map(path => deleteImage(path)));
  } catch (error) {
    console.error('Error deleting images:', error);
    throw error;
  }
}; 