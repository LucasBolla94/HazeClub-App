import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, StyleSheet,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import Toast from 'react-native-toast-message';
import { colors, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/ui/Avatar';
import { getComments, addComment, toggleLike, checkUserLikes, toggleCommentLike, checkCommentLikes, getCommentLikeCounts } from '../../services/posts';
import { supabase } from '../../services/supabase';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

const SCREEN_WIDTH = Dimensions.get('window').width;

function DetailImage({ uri }) {
  const [imgHeight, setImgHeight] = useState(250);

  useEffect(() => {
    Image.getSize(uri, (w, h) => {
      const ratio = h / w;
      const clampedRatio = Math.max(0.5, Math.min(ratio, 1.25));
      setImgHeight(SCREEN_WIDTH * clampedRatio);
    }, () => {});
  }, [uri]);

  return (
    <Image
      source={{ uri }}
      style={[styles.postImage, { height: imgHeight }]}
      resizeMode="cover"
    />
  );
}

export default function PostDetailScreen({ route, navigation }) {
  const { postId } = route.params;
  const { user, profile } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentLikeMap, setCommentLikeMap] = useState({});
  const [commentLikeCounts, setCommentLikeCounts] = useState({});
  const inputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [postId]);

  async function loadData() {
    try {
      const { data: postData } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (id, username, display_name, avatar_url),
          likes_count:likes(count),
          comments_count:comments(count)
        `)
        .eq('id', postId)
        .single();

      setPost(postData);
      setLikesCount(postData.likes_count?.[0]?.count || 0);

      const [commentsData, likeMap] = await Promise.all([
        getComments(postId),
        checkUserLikes([postId], user.id),
      ]);

      setComments(commentsData);
      setLiked(!!likeMap[postId]);

      const commentIds = commentsData.map(c => c.id);
      const [cLikes, cCounts] = await Promise.all([
        checkCommentLikes(commentIds, user.id),
        getCommentLikeCounts(commentIds),
      ]);
      setCommentLikeMap(cLikes);
      setCommentLikeCounts(cCounts);
    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: 'Erro ao carregar post' });
    } finally {
      setLoading(false);
    }
  }

  async function handleLike() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newLiked = await toggleLike(postId, user.id);
    setLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
  }

  async function handleCommentLike(commentId) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newLiked = await toggleCommentLike(commentId, user.id);
    setCommentLikeMap(prev => ({ ...prev, [commentId]: newLiked }));
    setCommentLikeCounts(prev => ({
      ...prev,
      [commentId]: (prev[commentId] || 0) + (newLiked ? 1 : -1),
    }));
  }

  async function handleSendComment() {
    const text = newComment.trim();
    if (!text) return;
    setSending(true);
    try {
      const comment = await addComment(postId, user.id, text);
      setComments(prev => [...prev, comment]);
      setNewComment('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Erro ao comentar' });
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.text.muted} />
        <Text style={styles.errorText}>Post nao encontrado</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.errorBtn}>
          <Text style={styles.errorBtnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const postProfile = post.profiles;
  const commentsCount = comments.length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View>
            {/* Post Author */}
            <TouchableOpacity
              style={styles.authorRow}
              onPress={() => navigation.push('UserProfile', { userId: post.user_id })}
              activeOpacity={0.7}
            >
              <Avatar url={postProfile?.avatar_url} name={postProfile?.display_name} size={48} />
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>@{postProfile?.username}</Text>
              </View>
              <Text style={styles.timeAgo}>{dayjs(post.created_at).fromNow()}</Text>
            </TouchableOpacity>

            {/* Post Content */}
            {post.content ? (
              <Text style={styles.postContent}>{post.content}</Text>
            ) : null}

            {/* Post Image */}
            {post.image_url ? <DetailImage uri={post.image_url} /> : null}

            {/* Timestamp */}
            <Text style={styles.timestamp}>
              {dayjs(post.created_at).format('HH:mm · D [de] MMM[,] YYYY')}
            </Text>

            {/* Stats bar */}
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{likesCount}</Text>
                <Text style={styles.statLabel}>{likesCount === 1 ? 'curtida' : 'curtidas'}</Text>
              </View>
              <View style={styles.statDot} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{commentsCount}</Text>
                <Text style={styles.statLabel}>{commentsCount === 1 ? 'comentario' : 'comentarios'}</Text>
              </View>
            </View>

            {/* Action bar */}
            <View style={styles.actionBar}>
              <TouchableOpacity style={styles.actionItem} onPress={handleLike} activeOpacity={0.6}>
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={24}
                  color={liked ? colors.like : colors.text.secondary}
                />
                <Text style={[styles.actionLabel, liked && { color: colors.like }]}>
                  {liked ? 'Curtido' : 'Curtir'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => inputRef.current?.focus()}
                activeOpacity={0.6}
              >
                <Ionicons name="chatbubble-outline" size={22} color={colors.text.secondary} />
                <Text style={styles.actionLabel}>Comentar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem} activeOpacity={0.6}>
                <Ionicons name="share-outline" size={22} color={colors.text.secondary} />
                <Text style={styles.actionLabel}>Compartilhar</Text>
              </TouchableOpacity>
            </View>

            {/* Comments Header */}
            {commentsCount > 0 && (
              <View style={styles.commentsHeader}>
                <Text style={styles.commentsTitle}>Comentarios</Text>
              </View>
            )}
          </View>
        )}
        renderItem={({ item }) => {
          const cLiked = !!commentLikeMap[item.id];
          const cCount = commentLikeCounts[item.id] || 0;
          return (
            <View style={styles.comment}>
              <Avatar url={item.profiles?.avatar_url} name={item.profiles?.display_name} size={36} />
              <View style={styles.commentBubble}>
                <View style={styles.commentTop}>
                  <Text style={styles.commentAuthor}>@{item.profiles?.username}</Text>
                </View>
                <Text style={styles.commentText}>{item.content}</Text>
                <View style={styles.commentFooter}>
                  <Text style={styles.commentTime}>{dayjs(item.created_at).fromNow()}</Text>
                  <TouchableOpacity
                    style={styles.commentLikeBtn}
                    onPress={() => handleCommentLike(item.id)}
                    activeOpacity={0.6}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={cLiked ? 'heart' : 'heart-outline'}
                      size={14}
                      color={cLiked ? colors.like : colors.text.muted}
                    />
                    {cCount > 0 && (
                      <Text style={[styles.commentLikeCount, cLiked && { color: colors.like }]}>
                        {cCount}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyComments}>
            <Ionicons name="chatbubbles-outline" size={36} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>Sem comentarios</Text>
            <Text style={styles.emptySubtitle}>Seja o primeiro a comentar!</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Comment Input Bar */}
      <View style={styles.inputBar}>
        <Avatar url={profile?.avatar_url} name={profile?.display_name} size={34} />
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.commentInput}
            placeholder="Adicione um comentario..."
            placeholderTextColor={colors.text.muted}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={300}
          />
        </View>
        <TouchableOpacity
          onPress={handleSendComment}
          disabled={!newComment.trim() || sending}
          activeOpacity={0.6}
          style={styles.sendBtnWrap}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <View style={[styles.sendBtn, !newComment.trim() && styles.sendBtnDisabled]}>
              <Ionicons name="arrow-up" size={18} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.primary,
    gap: spacing.md,
  },
  errorText: { color: colors.text.secondary, fontSize: 16 },
  errorBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent,
  },
  errorBtnText: { color: '#fff', fontWeight: '600' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 58,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bg.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: colors.text.primary, fontSize: 17, fontWeight: '700' },
  headerRight: { width: 38 },

  listContent: { paddingBottom: 100 },

  // Author
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  authorInfo: { flex: 1, marginLeft: spacing.sm },
  authorName: { color: colors.text.primary, fontSize: 16, fontWeight: '700' },
  authorUsername: { color: colors.text.muted, fontSize: 14, marginTop: 1 },
  timeAgo: { color: colors.text.muted, fontSize: 12 },

  // Post Content
  postContent: {
    color: colors.text.primary,
    fontSize: 18,
    lineHeight: 27,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  postImage: {
    width: SCREEN_WIDTH,
    backgroundColor: colors.bg.card,
    marginBottom: spacing.sm,
  },
  timestamp: {
    color: colors.text.muted,
    fontSize: 13,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },

  // Stats
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statNumber: { color: colors.text.primary, fontSize: 14, fontWeight: '700' },
  statLabel: { color: colors.text.muted, fontSize: 14 },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.text.muted,
  },

  // Actions
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionLabel: { color: colors.text.secondary, fontSize: 13, fontWeight: '500' },

  // Comments
  commentsHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  commentsTitle: { color: colors.text.primary, fontSize: 16, fontWeight: '700' },

  comment: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  commentTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 3 },
  commentAuthor: { color: colors.text.primary, fontSize: 14, fontWeight: '600' },
  commentUsername: { color: colors.text.muted, fontSize: 12 },
  commentText: { color: colors.text.primary, fontSize: 14, lineHeight: 20 },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  commentTime: { color: colors.text.muted, fontSize: 11 },
  commentLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  commentLikeCount: {
    color: colors.text.muted,
    fontSize: 11,
    fontWeight: '600',
  },

  emptyComments: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: { color: colors.text.secondary, fontSize: 16, fontWeight: '600' },
  emptySubtitle: { color: colors.text.muted, fontSize: 14 },

  // Input Bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg.secondary,
    gap: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.bg.input,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  commentInput: {
    color: colors.text.primary,
    fontSize: 14,
    paddingVertical: 10,
    maxHeight: 80,
  },
  sendBtnWrap: { paddingBottom: 4 },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.3 },
});
