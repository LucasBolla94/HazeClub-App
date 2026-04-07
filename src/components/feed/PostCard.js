import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import { Avatar } from '../ui/Avatar';
import { colors, spacing, borderRadius } from '../../theme';
import { toggleLike } from '../../services/posts';
import { useAuth } from '../../hooks/useAuth';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_WIDTH = SCREEN_WIDTH - spacing.lg * 2;

function PostImage({ uri }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1);

  function handleLoad(e) {
    const { width, height } = e.nativeEvent.source;
    if (width && height) {
      const ratio = width / height;
      // Clamp between 4:5 (portrait) and 1.91:1 (landscape) like Instagram
      const clamped = Math.max(0.8, Math.min(ratio, 1.91));
      setAspectRatio(clamped);
    }
    setLoading(false);
  }

  if (error) return null;

  return (
    <View style={[styles.imageContainer, { aspectRatio }]}>
      {loading && (
        <View style={styles.imagePlaceholder}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
      <Image
        source={{ uri }}
        style={styles.image}
        resizeMode="cover"
        onLoad={handleLoad}
        onError={() => { setError(true); setLoading(false); }}
      />
    </View>
  );
}

export default function PostCard({ post, liked, onLikeToggle, onCommentPress, onProfilePress }) {
  const { user } = useAuth();
  const profile = post.profiles;
  const likesCount = post.likes_count?.[0]?.count || 0;
  const commentsCount = post.comments_count?.[0]?.count || 0;

  async function handleLike() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newLiked = await toggleLike(post.id, user.id);
    onLikeToggle(post.id, newLiked);
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.userRow} onPress={onProfilePress} activeOpacity={0.7}>
        <Avatar url={profile?.avatar_url} name={profile?.display_name} size={42} />
        <View style={styles.userInfo}>
          <Text style={styles.displayName}>@{profile?.username}</Text>
          <Text style={styles.username}>{dayjs(post.created_at).fromNow()}</Text>
        </View>
      </TouchableOpacity>

      {post.content ? <Text style={styles.content}>{post.content}</Text> : null}

      {post.image_url ? <PostImage uri={post.image_url} /> : null}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.6}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? colors.like : colors.text.muted}
          />
          <Text style={[styles.actionText, liked && { color: colors.like }]}>
            {likesCount > 0 ? likesCount : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onCommentPress} activeOpacity={0.6}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.text.muted} />
          <Text style={styles.actionText}>{commentsCount > 0 ? commentsCount : ''}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.6}>
          <Ionicons name="share-outline" size={20} color={colors.text.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  userInfo: { marginLeft: spacing.sm, flex: 1 },
  displayName: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  username: {
    color: colors.text.muted,
    fontSize: 13,
    marginTop: 1,
  },
  content: {
    color: colors.text.primary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  imageContainer: {
    width: IMAGE_WIDTH,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    backgroundColor: colors.bg.card,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xl,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    color: colors.text.muted,
    fontSize: 13,
  },
});
