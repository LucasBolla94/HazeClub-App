import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';

const SUPABASE_URL = 'https://db.hazeclub.online';

const IMAGE_CONFIG = {
  post: {
    maxWidth: 1080,
    quality: 0.8,
    bucket: 'posts',
  },
  avatar: {
    maxWidth: 400,
    quality: 0.8,
    bucket: 'avatars',
  },
};

/**
 * Pick image from gallery. Returns local URI or null.
 */
export async function pickImage({ aspect, allowsEditing = true } = {}) {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permissao para acessar a galeria foi negada. Va em Ajustes e habilite.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    allowsEditing,
    aspect,
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
}

/**
 * Compress and resize image. Returns processed URI.
 */
async function processImage(uri, type = 'post') {
  const config = IMAGE_CONFIG[type];

  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: config.maxWidth } }],
    {
      compress: config.quality,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  return manipulated.uri;
}

/**
 * Read a local file URI as ArrayBuffer.
 * Uses fetch() which works reliably with local file:// URIs in React Native.
 */
async function readFileAsArrayBuffer(uri) {
  const response = await fetch(uri);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Upload image to Supabase Storage.
 * Pipeline: compress -> read as ArrayBuffer -> upload
 */
export async function uploadImage(uri, userId, type = 'post') {
  const config = IMAGE_CONFIG[type];

  // 1. Compress and resize
  const processedUri = await processImage(uri, type);

  // 2. Read file as ArrayBuffer
  const arrayBuffer = await readFileAsArrayBuffer(processedUri);

  // 3. Unique filename
  const fileName = type === 'avatar'
    ? `${userId}/avatar.jpg`
    : `${userId}/${Date.now()}.jpg`;

  // 4. Upload
  const { data, error } = await supabase.storage
    .from(config.bucket)
    .upload(fileName, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: type === 'avatar',
      cacheControl: '3600',
    });

  if (error) throw error;

  // 5. Public URL
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${config.bucket}/${data.path}`;
  return publicUrl;
}
