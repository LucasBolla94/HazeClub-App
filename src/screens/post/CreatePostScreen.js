import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Image, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Keyboard, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { colors, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/ui/Avatar';
import { createPost } from '../../services/posts';
import * as ImagePicker from 'expo-image-picker';
import { pickImage, uploadImage } from '../../services/image';

export default function CreatePostScreen({ navigation }) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const inputRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    // Auto-focus after modal animation
    const timer = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  const hasContent = content.trim().length > 0 || image;

  async function handlePickImage() {
    Keyboard.dismiss();
    try {
      const uri = await pickImage({ allowsEditing: true });
      if (uri) {
        setImage(uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: err.message });
    }
  }

  function handleClose() {
    if (hasContent) {
      // Simple confirm - could use Alert.alert for native feel
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    navigation.goBack();
  }

  async function handlePost() {
    if (!hasContent) return;
    setLoading(true);
    Keyboard.dismiss();
    try {
      let imageUrl = null;
      if (image) {
        setUploadProgress('Enviando imagem...');
        imageUrl = await uploadImage(image, user.id, 'post');
      }
      setUploadProgress('Publicando...');
      await createPost(user.id, content.trim(), imageUrl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Publicado!' });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Erro ao postar', text2: err.message });
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={12}>
          <Ionicons name="close" size={26} color={colors.text.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.postBtn, !hasContent && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={loading || !hasContent}
          activeOpacity={0.7}
        >
          {loading ? (
            <View style={styles.postBtnLoading}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.postBtnLoadingText}>
                {uploadProgress || 'Postando...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.postBtnText}>Publicar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Drag indicator (modal feel) */}
      <View style={styles.dragIndicator} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Compose area */}
          <View style={styles.compose}>
            <Avatar url={profile?.avatar_url} name={profile?.display_name} size={40} />
            <View style={styles.composeRight}>
              <Text style={styles.composeName}>{profile?.display_name}</Text>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="No que voce esta pensando?"
                placeholderTextColor={colors.text.muted}
                value={content}
                onChangeText={setContent}
                multiline
                maxLength={500}
                scrollEnabled={false}
              />
            </View>
          </View>

          {/* Image Preview */}
          {image && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: image }} style={styles.previewImg} resizeMode="cover" />
              <TouchableOpacity
                style={styles.removeImgBtn}
                onPress={() => {
                  setImage(null);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.removeImgCircle}>
                  <Ionicons name="close" size={18} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Bottom Toolbar */}
        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            <TouchableOpacity
              onPress={handlePickImage}
              style={styles.toolBtn}
              activeOpacity={0.6}
              disabled={loading}
            >
              <Ionicons name="image" size={22} color={colors.accent} />
              <Text style={styles.toolLabel}>Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                Keyboard.dismiss();
                try {
                  const { status } = await ImagePicker.requestCameraPermissionsAsync();
                  if (status !== 'granted') {
                    Toast.show({ type: 'error', text1: 'Permissao da camera negada' });
                    return;
                  }
                  const result = await ImagePicker.launchCameraAsync({
                    quality: 1,
                    allowsEditing: true,
                  });
                  if (!result.canceled) {
                    setImage(result.assets[0].uri);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                } catch (err) {
                  Toast.show({ type: 'error', text1: err.message });
                }
              }}
              style={styles.toolBtn}
              activeOpacity={0.6}
              disabled={loading}
            >
              <Ionicons name="camera" size={22} color={colors.accent} />
              <Text style={styles.toolLabel}>Camera</Text>
            </TouchableOpacity>
          </View>

          <Text style={[
            styles.charCount,
            content.length > 450 && styles.charCountWarn,
            content.length >= 500 && styles.charCountMax,
          ]}>
            {content.length}/500
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 58,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  postBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtnDisabled: { opacity: 0.35 },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  postBtnLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postBtnLoadingText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    flexGrow: 1,
  },
  compose: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  composeRight: { flex: 1 },
  composeName: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    color: colors.text.primary,
    fontSize: 17,
    lineHeight: 24,
    textAlignVertical: 'top',
    minHeight: 80,
    paddingTop: 0,
  },
  imagePreview: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImg: {
    width: '100%',
    height: 280,
    backgroundColor: colors.bg.card,
  },
  removeImgBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  removeImgCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg.secondary,
  },
  toolbarLeft: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
  },
  toolLabel: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '500',
  },
  charCount: {
    color: colors.text.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  charCountWarn: { color: '#fccc5c' },
  charCountMax: { color: colors.error },
});
