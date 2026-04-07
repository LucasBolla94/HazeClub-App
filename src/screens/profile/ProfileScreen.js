import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/ui/Avatar';
import { getUserPosts, checkUserLikes } from '../../services/posts';
import PostCard from '../../components/feed/PostCard';

export default function ProfileScreen({ navigation, route }) {
  const { user, profile: myProfile, signOut } = useAuth();
  const viewUserId = route?.params?.userId || user?.id;
  const isMe = viewUserId === user?.id;

  const [viewProfile, setViewProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likeMap, setLikeMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ posts: 0 });

  async function loadProfile() {
    try {
      if (isMe) {
        setViewProfile(myProfile);
      } else {
        const { supabase } = require('../../services/supabase');
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', viewUserId)
          .single();
        setViewProfile(data);
      }

      const { data: postsData, count } = await getUserPosts(viewUserId);
      const postIds = postsData.map(p => p.id);
      const likes = await checkUserLikes(postIds, user.id);

      setPosts(postsData);
      setLikeMap(likes);
      setStats({ posts: count });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [viewUserId, myProfile])
  );

  function handleLikeToggle(postId, liked) {
    setLikeMap(prev => ({ ...prev, [postId]: liked }));
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        const currentCount = p.likes_count?.[0]?.count || 0;
        return {
          ...p,
          likes_count: [{ count: liked ? currentCount + 1 : currentCount - 1 }],
        };
      })
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <View>
            <View style={styles.header}>
              {!isMe && (
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              )}
              <View style={styles.profileInfo}>
                <Avatar
                  url={viewProfile?.avatar_url}
                  name={viewProfile?.display_name}
                  size={80}
                />
                <Text style={styles.displayName}>{viewProfile?.display_name}</Text>
                <Text style={styles.username}>@{viewProfile?.username}</Text>
                {viewProfile?.bio ? (
                  <Text style={styles.bio}>{viewProfile.bio}</Text>
                ) : null}

                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statNum}>{stats.posts}</Text>
                    <Text style={styles.statLabel}>Posts</Text>
                  </View>
                </View>

                {isMe && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => navigation.navigate('EditProfile')}
                    >
                      <Text style={styles.editBtnText}>Editar Perfil</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
                      <Ionicons name="log-out-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.divider} />
          </View>
        )}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            liked={!!likeMap[item.id]}
            onLikeToggle={handleLikeToggle}
            onCommentPress={() => navigation.navigate('PostDetail', { postId: item.id })}
            onProfilePress={() => {}}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadProfile();
            }}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum post</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bg.secondary,
  },
  backBtn: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  profileInfo: { alignItems: 'center', paddingHorizontal: spacing.lg },
  displayName: { ...typography.h2, color: colors.text.primary, marginTop: spacing.md },
  username: { color: colors.text.muted, fontSize: 15, marginTop: 2 },
  bio: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.xl,
  },
  stat: { alignItems: 'center' },
  statNum: { color: colors.text.primary, fontSize: 18, fontWeight: '800' },
  statLabel: { color: colors.text.muted, fontSize: 13, marginTop: 2 },
  actionRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  editBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  editBtnText: { color: colors.text.primary, fontSize: 14, fontWeight: '600' },
  logoutBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    padding: spacing.sm,
  },
  divider: { height: 1, backgroundColor: colors.border },
  empty: { padding: spacing.xxl, alignItems: 'center' },
  emptyText: { color: colors.text.muted, fontSize: 15 },
});
