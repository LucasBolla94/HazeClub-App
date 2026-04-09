import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { getFeed, checkUserLikes } from '../../services/posts';
import PostCard from '../../components/feed/PostCard';

export default function FeedScreen({ navigation }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [likeMap, setLikeMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  async function loadPosts(pageNum = 0, refresh = false) {
    try {
      const { data, count } = await getFeed(pageNum);
      const postIds = data.map(p => p.id);
      const likes = await checkUserLikes(postIds, user.id);

      if (refresh || pageNum === 0) {
        setPosts(data);
      } else {
        setPosts(prev => [...prev, ...data]);
      }
      setLikeMap(prev => refresh || pageNum === 0 ? likes : { ...prev, ...likes });
      setHasMore((pageNum + 1) * 20 < count);
    } catch (err) {
      console.error('Feed error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setPage(0);
      loadPosts(0, true);
    }, [])
  );

  function handleRefresh() {
    setRefreshing(true);
    setPage(0);
    loadPosts(0, true);
  }

  function handleLoadMore() {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage);
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
      <View style={styles.header}>
        <Text style={styles.logo}>HazeClub</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            liked={!!likeMap[item.id]}
            onLikeToggle={handleLikeToggle}
            onCommentPress={() => navigation.navigate('PostDetail', { postId: item.id })}
            onProfilePress={() => navigation.navigate('UserProfile', { userId: item.user_id })}
            onDeleted={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="newspaper-outline" size={48} color={colors.text.muted} />
            <Text style={styles.emptyText}>Nenhum post ainda</Text>
            <Text style={styles.emptySubtext}>Seja o primeiro a postar!</Text>
          </View>
        }
        contentContainerStyle={[{ paddingBottom: 100 }, posts.length === 0 && styles.emptyContainer]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    ...typography.h2,
    color: colors.accent,
    fontWeight: '900',
    letterSpacing: 1,
  },
  empty: { alignItems: 'center', paddingTop: 100 },
  emptyContainer: { flexGrow: 1 },
  emptyText: { ...typography.h3, color: colors.text.secondary, marginTop: spacing.md },
  emptySubtext: { ...typography.body, color: colors.text.muted, marginTop: spacing.xs },
});
