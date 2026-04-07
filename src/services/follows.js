import { supabase } from './supabase';

/**
 * Toggle follow: if already following, unfollow. Otherwise, follow.
 * Returns { following: boolean }
 */
export async function toggleFollow(followerId, followingId) {
  const { data: existing } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    return false;
  } else {
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId });
    if (error) throw error;
    return true;
  }
}

/**
 * Check if userId follows targetId
 */
export async function isFollowing(userId, targetId) {
  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', userId)
    .eq('following_id', targetId)
    .maybeSingle();

  return !!data;
}

/**
 * Get follower and following counts for a user
 */
export async function getFollowCounts(userId) {
  const [followersRes, followingRes] = await Promise.all([
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', userId),
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', userId),
  ]);

  return {
    followers: followersRes.count || 0,
    following: followingRes.count || 0,
  };
}

/**
 * Get list of followers (profiles that follow userId)
 */
export async function getFollowers(userId, page = 0, limit = 30) {
  const from = page * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from('follows')
    .select('follower_id, profiles:follower_id (id, username, display_name, avatar_url)')
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return (data || []).map(d => d.profiles);
}

/**
 * Get list of users that userId follows
 */
export async function getFollowing(userId, page = 0, limit = 30) {
  const from = page * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from('follows')
    .select('following_id, profiles:following_id (id, username, display_name, avatar_url)')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return (data || []).map(d => d.profiles);
}

/**
 * Check follow status for multiple userIds at once (batch)
 * Returns map { userId: true/false }
 */
export async function checkFollowBatch(myUserId, targetIds) {
  if (!targetIds.length) return {};
  const { data } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', myUserId)
    .in('following_id', targetIds);

  const map = {};
  targetIds.forEach(id => { map[id] = false; });
  (data || []).forEach(d => { map[d.following_id] = true; });
  return map;
}
