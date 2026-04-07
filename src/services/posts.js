import { supabase } from './supabase';

export async function getFeed(page = 0, limit = 20) {
  const from = page * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (id, username, display_name, avatar_url),
      likes_count:likes(count),
      comments_count:comments(count)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data, count };
}

export async function getUserPosts(userId, page = 0, limit = 20) {
  const from = page * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (id, username, display_name, avatar_url),
      likes_count:likes(count),
      comments_count:comments(count)
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data, count };
}

export async function createPost(userId, content, imageUrl = null) {
  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id: userId, content, image_url: imageUrl })
    .select(`
      *,
      profiles:user_id (id, username, display_name, avatar_url),
      likes_count:likes(count),
      comments_count:comments(count)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function deletePost(postId) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);
  if (error) throw error;
}

export async function toggleLike(postId, userId) {
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    await supabase.from('likes').delete().eq('id', existing.id);
    return false;
  } else {
    await supabase.from('likes').insert({ post_id: postId, user_id: userId });
    return true;
  }
}

export async function checkUserLikes(postIds, userId) {
  if (!postIds.length) return {};
  const { data } = await supabase
    .from('likes')
    .select('post_id')
    .eq('user_id', userId)
    .in('post_id', postIds);

  const likeMap = {};
  (data || []).forEach(l => { likeMap[l.post_id] = true; });
  return likeMap;
}

export async function getComments(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles:user_id (id, username, display_name, avatar_url)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function addComment(postId, userId, content) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select(`
      *,
      profiles:user_id (id, username, display_name, avatar_url)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteComment(commentId) {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) throw error;
}

// Image upload moved to services/image.js
