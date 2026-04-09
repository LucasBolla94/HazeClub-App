import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  RefreshControl, ActivityIndicator, Image, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/ui/Avatar';
import { getUserPosts, checkUserLikes } from '../../services/posts';
import { isFollowing, toggleFollow, getFollowCounts } from '../../services/follows';
import PostCard from '../../components/feed/PostCard';

const SCREEN_W = Dimensions.get('window').width;
const COVER_H = 180;
const AVATAR_SIZE = 86;

export default function ProfileScreen({ navigation, route }) {
  const { user, profile: myProfile, signOut } = useAuth();
  const viewUserId = route?.params?.userId || user?.id;
  const isMe = viewUserId === user?.id;

  const [viewProfile, setViewProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likeMap, setLikeMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

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

      const followCounts = await getFollowCounts(viewUserId);
      setStats({ posts: count, followers: followCounts.followers, following: followCounts.following });

      if (!isMe) {
        const amFollowing = await isFollowing(user.id, viewUserId);
        setFollowing(amFollowing);
      }
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

  async function handleFollow() {
    setFollowLoading(true);
    try {
      const nowFollowing = await toggleFollow(user.id, viewUserId);
      setFollowing(nowFollowing);
      setStats(prev => ({
        ...prev,
        followers: prev.followers + (nowFollowing ? 1 : -1),
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  }

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
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <View>
            {/* Cover Photo */}
            <View style={styles.coverWrap}>
              {viewProfile?.cover_url ? (
                <Image
                  source={{ uri: viewProfile.cover_url }}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={['#1a1a2e', '#12121a', '#0a0a0f']}
                  style={styles.coverImage}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              {/* Dark overlay for readability */}
              <LinearGradient
                colors={['transparent', 'rgba(10,10,15,0.8)']}
                style={styles.coverOverlay}
                start={{ x: 0.5, y: 0.2 }}
                end={{ x: 0.5, y: 1 }}
              />

              {/* Back button */}
              {!isMe && (
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="chevron-back" size={22} color="#fff" />
                </TouchableOpacity>
              )}

              {/* Edit cover (only own profile) */}
              {isMe && (
                <TouchableOpacity
                  style={styles.editCoverBtn}
                  onPress={() => navigation.navigate('EditProfile')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-outline" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            {/* Avatar overlapping cover */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarBorder}>
                <Avatar
                  url={viewProfile?.avatar_url}
                  name={viewProfile?.display_name}
                  size={AVATAR_SIZE}
                />
              </View>
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfo}>
              <Text style={styles.username}>@{viewProfile?.username}</Text>

              {/* Status text / frase */}
              {viewProfile?.status_text ? (
                <View style={styles.statusWrap}>
                  <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.accent} />
                  <Text style={styles.statusText}>{viewProfile.status_text}</Text>
                </View>
              ) : null}

              {viewProfile?.bio ? (
                <Text style={styles.bio}>{viewProfile.bio}</Text>
              ) : null}

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{stats.posts}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
                <TouchableOpacity
                  style={styles.stat}
                  onPress={() => navigation.navigate('FollowList', {
                    userId: viewUserId,
                    tab: 'followers',
                    username: viewProfile?.username,
                  })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.statNum}>{stats.followers}</Text>
                  <Text style={styles.statLabel}>Seguidores</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stat}
                  onPress={() => navigation.navigate('FollowList', {
                    userId: viewUserId,
                    tab: 'following',
                    username: viewProfile?.username,
                  })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.statNum}>{stats.following}</Text>
                  <Text style={styles.statLabel}>Seguindo</Text>
                </TouchableOpacity>
              </View>

              {/* Actions */}
              {isMe ? (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('EditProfile')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil-outline" size={16} color={colors.text.primary} />
                    <Text style={styles.editBtnText}>Editar Perfil</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={signOut}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="log-out-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.followMainBtn, following && styles.followMainBtnActive]}
                    onPress={handleFollow}
                    disabled={followLoading}
                    activeOpacity={0.7}
                  >
                    {followLoading ? (
                      <ActivityIndicator size="small" color={following ? colors.text.secondary : '#fff'} />
                    ) : (
                      <>
                        <Ionicons
                          name={following ? 'checkmark' : 'person-add-outline'}
                          size={16}
                          color={following ? colors.text.secondary : '#fff'}
                        />
                        <Text style={[styles.followMainBtnText, following && styles.followMainBtnTextActive]}>
                          {following ? 'Seguindo' : 'Seguir'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Posts divider */}
            <View style={styles.postsDivider}>
              <Ionicons name="grid-outline" size={16} color={colors.text.muted} />
              <Text style={styles.postsDividerText}>Posts</Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            liked={!!likeMap[item.id]}
            onLikeToggle={handleLikeToggle}
            onCommentPress={() => navigation.navigate('PostDetail', { postId: item.id })}
            onProfilePress={() => {}}
            onDeleted={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
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
            <Ionicons name="document-text-outline" size={40} color={colors.text.muted} />
            <Text style={styles.emptyText}>Nenhum post ainda</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary },

  // Cover
  coverWrap: {
    width: SCREEN_W,
    height: COVER_H,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editCoverBtn: {
    position: 'absolute',
    top: 52,
    right: spacing.md,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginTop: -(AVATAR_SIZE / 2),
    zIndex: 10,
  },
  avatarBorder: {
    borderRadius: (AVATAR_SIZE + 6) / 2,
    borderWidth: 3,
    borderColor: colors.bg.primary,
    backgroundColor: colors.bg.primary,
  },

  // Info
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.bg.primary,
  },
  username: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    backgroundColor: colors.bg.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    maxWidth: '90%',
  },
  statusText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontStyle: 'italic',
    flexShrink: 1,
  },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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

  // Follow button (other user)
  followMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    minWidth: 120,
    justifyContent: 'center',
  },
  followMainBtnActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  followMainBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  followMainBtnTextActive: {
    color: colors.text.secondary,
  },

  // Posts divider
  postsDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg.secondary,
  },
  postsDividerText: {
    color: colors.text.muted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  listContent: { paddingBottom: 100 },
  empty: { padding: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  emptyText: { color: colors.text.muted, fontSize: 15 },
});
