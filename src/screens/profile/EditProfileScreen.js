import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Image, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { colors, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { pickImage, uploadImage } from '../../services/image';

const SCREEN_W = Dimensions.get('window').width;
const COVER_H = 160;

export default function EditProfileScreen({ navigation }) {
  const { profile, updateProfile, user } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [statusText, setStatusText] = useState(profile?.status_text || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url);
  const [coverUrl, setCoverUrl] = useState(profile?.cover_url);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  async function handlePickAvatar() {
    try {
      const uri = await pickImage({ aspect: [1, 1], allowsEditing: true });
      if (!uri) return;
      setUploadingAvatar(true);
      const publicUrl = await uploadImage(uri, user.id, 'avatar');
      setAvatarUrl(publicUrl);
      Toast.show({ type: 'success', text1: 'Foto atualizada!' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Erro ao enviar imagem', text2: err.message });
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handlePickCover() {
    try {
      const uri = await pickImage({ aspect: [16, 9], allowsEditing: true });
      if (!uri) return;
      setUploadingCover(true);
      const publicUrl = await uploadImage(uri, user.id, 'cover');
      setCoverUrl(publicUrl);
      Toast.show({ type: 'success', text1: 'Capa atualizada!' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Erro ao enviar capa', text2: err.message });
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleSave() {
    if (!displayName.trim()) {
      Toast.show({ type: 'error', text1: 'Nome e obrigatorio' });
      return;
    }
    setLoading(true);
    try {
      await updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim(),
        status_text: statusText.trim(),
        avatar_url: avatarUrl,
        cover_url: coverUrl,
      });
      Toast.show({ type: 'success', text1: 'Perfil atualizado!' });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Erro', text2: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Photo */}
        <TouchableOpacity
          style={styles.coverWrap}
          onPress={handlePickCover}
          disabled={uploadingCover}
          activeOpacity={0.8}
        >
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.coverImg} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={['#1a1a2e', '#12121a']}
              style={styles.coverImg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}
          <View style={styles.coverOverlay}>
            {uploadingCover ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="image-outline" size={22} color="#fff" />
                <Text style={styles.coverLabel}>
                  {coverUrl ? 'Trocar capa' : 'Adicionar capa'}
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* Avatar */}
        <View style={styles.avatarRow}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={handlePickAvatar}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
              <View style={styles.avatarLoading}>
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            ) : (
              <Avatar url={avatarUrl} name={displayName} size={86} />
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Toque para alterar</Text>
        </View>

        {/* Fields */}
        <View style={styles.fields}>
          <Input
            label="Nome"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Seu nome"
          />

          <View style={styles.statusField}>
            <Text style={styles.fieldLabel}>Frase / Pensamento</Text>
            <View style={styles.statusInputWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.accent} style={{ marginTop: 14 }} />
              <Input
                value={statusText}
                onChangeText={setStatusText}
                placeholder="No que voce esta pensando hoje?"
                maxLength={100}
                style={styles.statusInput}
              />
            </View>
            <Text style={styles.charHint}>{statusText.length}/100</Text>
          </View>

          <Input
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Conte sobre voce..."
            multiline
            maxLength={150}
          />
          <Text style={styles.charHint}>{bio.length}/150</Text>

          <View style={{ marginTop: spacing.md }}>
            <Button title="Salvar" onPress={handleSave} loading={loading} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg.secondary,
  },
  headerTitle: { color: colors.text.primary, fontSize: 17, fontWeight: '700' },
  scroll: { paddingBottom: 40 },

  // Cover
  coverWrap: {
    width: SCREEN_W,
    height: COVER_H,
    position: 'relative',
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  coverLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Avatar
  avatarRow: {
    alignItems: 'center',
    marginTop: -43,
    zIndex: 10,
  },
  avatarWrap: {
    position: 'relative',
    borderRadius: 46,
    borderWidth: 3,
    borderColor: colors.bg.primary,
  },
  avatarLoading: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.bg.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    padding: 5,
    borderWidth: 2,
    borderColor: colors.bg.primary,
  },
  avatarHint: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: 6,
  },

  // Fields
  fields: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  fieldLabel: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  statusField: {
    marginBottom: spacing.sm,
  },
  statusInputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  statusInput: {
    flex: 1,
    marginBottom: 0,
  },
  charHint: {
    color: colors.text.muted,
    fontSize: 11,
    textAlign: 'right',
    marginTop: -8,
    marginBottom: spacing.md,
  },
});
