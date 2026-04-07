import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Image, Platform, Animated, Keyboard,
  ActivityIndicator, InputAccessoryView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/ui/Avatar';
import { createPost } from '../../services/posts';
import { pickImage, uploadImage } from '../../services/image';

const INPUT_ACCESSORY_ID = 'create-post-toolbar';
const MAX_CHARS = 500;

export default function CreatePostScreen({ navigation }) {
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const inputRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(() => inputRef.current?.focus(), 400);

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    );

    return () => {
      clearTimeout(timer);
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const hasContent = content.trim().length > 0 || image;
  const charsLeft = MAX_CHARS - content.length;

  async function handlePickGallery() {
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

  async function handlePickCamera() {
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
  }

  async function handlePost() {
    if (!hasContent || loading) return;
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

  // Toolbar component — used both inline (Android) and as InputAccessoryView (iOS)
  function Toolbar() {
    return (
      <View style={styles.toolbar}>
        <View style={styles.toolbarActions}>
          <TouchableOpacity
            onPress={handlePickGallery}
            style={styles.toolBtn}
            activeOpacity={0.6}
            disabled={loading}
          >
            <Ionicons name="image-outline" size={22} color={colors.accent} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePickCamera}
            style={styles.toolBtn}
            activeOpacity={0.6}
            disabled={loading}
          >
            <Ionicons name="camera-outline" size={22} color={colors.accent} />
          </TouchableOpacity>

          <View style={styles.toolSep} />

          <Text style={[
            styles.charCount,
            charsLeft <= 50 && charsLeft > 0 && styles.charCountWarn,
            charsLeft <= 0 && styles.charCountMax,
          ]}>
            {charsLeft}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handlePost}
          disabled={loading || !hasContent}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.postPill}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.postPillText}>{uploadProgress || 'Postando...'}</Text>
            </View>
          ) : (
            <LinearGradient
              colors={hasContent ? ['#9d84fd', '#7c5cfc'] : ['#2a2a40', '#2a2a40']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.postPill}
            >
              <Ionicons name="send" size={16} color={hasContent ? '#fff' : colors.text.muted} />
              <Text style={[styles.postPillText, !hasContent && { color: colors.text.muted }]}>
                Publicar
              </Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          hitSlop={12}
        >
          <Ionicons name="chevron-down" size={26} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Novo Post</Text>

        <View style={{ width: 40 }} />
      </View>

      {/* Compose */}
      <View style={styles.compose}>
        <Avatar url={profile?.avatar_url} name={profile?.display_name} size={42} />
        <View style={styles.composeBody}>
          <Text style={styles.composeName}>@{profile?.username}</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="No que voce esta pensando?"
            placeholderTextColor={colors.text.muted}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={MAX_CHARS}
            scrollEnabled
            inputAccessoryViewID={Platform.OS === 'ios' ? INPUT_ACCESSORY_ID : undefined}
          />
        </View>
      </View>

      {/* Image Preview */}
      {image && (
        <View style={styles.imageWrap}>
          <Image source={{ uri: image }} style={styles.previewImg} resizeMode="cover" />
          <TouchableOpacity
            style={styles.removeImg}
            onPress={() => {
              setImage(null);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <View style={styles.removeImgCircle}>
              <Ionicons name="close" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Spacer to push toolbar down */}
      <View style={styles.flex} />

      {/* iOS: toolbar sticks above keyboard via InputAccessoryView */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
          <Toolbar />
        </InputAccessoryView>
      )}

      {/* Show toolbar at bottom when keyboard is hidden (iOS) or always (Android) */}
      {(Platform.OS === 'android' || !keyboardVisible) && (
        <View style={{ paddingBottom: Platform.OS === 'ios' ? insets.bottom : spacing.sm }}>
          <Toolbar />
        </View>
      )}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compose: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: 12,
  },
  composeBody: { flex: 1 },
  composeName: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  composeUsername: {
    color: colors.text.muted,
    fontWeight: '400',
    fontSize: 13,
  },
  input: {
    color: colors.text.primary,
    fontSize: 17,
    lineHeight: 24,
    textAlignVertical: 'top',
    minHeight: 100,
    maxHeight: 200,
    paddingTop: 8,
    paddingBottom: 8,
  },
  imageWrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  previewImg: {
    width: '100%',
    height: 220,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
  },
  removeImg: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  removeImgCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: colors.bg.secondary,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolSep: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  charCount: {
    color: colors.text.muted,
    fontSize: 13,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  charCountWarn: { color: '#fccc5c' },
  charCountMax: { color: colors.error },
  postPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
  },
  postPillText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
