import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { colors, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { pickImage, uploadImage } from '../../services/image';

export default function EditProfileScreen({ navigation }) {
  const { profile, updateProfile, user } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
        avatar_url: avatarUrl,
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={handlePickAvatar}
          disabled={uploadingAvatar}
        >
          {uploadingAvatar ? (
            <View style={[styles.avatarLoading, { width: 90, height: 90, borderRadius: 45 }]}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : (
            <Avatar url={avatarUrl} name={displayName} size={90} />
          )}
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        <Input
          label="Nome"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Seu nome"
        />
        <Input
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Conte sobre voce..."
          multiline
          maxLength={150}
        />

        <Button title="Salvar" onPress={handleSave} loading={loading} />
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
  scroll: { padding: spacing.xl },
  avatarWrap: { alignSelf: 'center', marginBottom: spacing.xl, position: 'relative' },
  avatarLoading: {
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
    padding: 6,
  },
});
