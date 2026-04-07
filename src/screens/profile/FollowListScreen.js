import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/ui/Avatar';
import { getFollowers, getFollowing, toggleFollow, checkFollowBatch } from '../../services/follows';

export default function FollowListScreen({ navigation, route }) {
  const { userId, tab = 'followers', username } = route.params;
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(tab);
  const [list, setList] = useState([]);
  const [followMap, setFollowMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadList();
  }, [activeTab]);

  async function loadList() {
    setLoading(true);
    try {
      const data = activeTab === 'followers'
        ? await getFollowers(userId)
        : await getFollowing(userId);

      setList(data);

      const ids = data.map(p => p.id).filter(id => id !== user.id);
      const map = await checkFollowBatch(user.id, ids);
      setFollowMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleFollow(targetId) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nowFollowing = await toggleFollow(user.id, targetId);
    setFollowMap(prev => ({ ...prev, [targetId]: nowFollowing }));
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>@{username}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'followers' && styles.tabActive]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[styles.tabText, activeTab === 'followers' && styles.tabTextActive]}>
            Seguidores
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.tabActive]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>
            Seguindo
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isMe = item.id === user.id;
            const amFollowing = !!followMap[item.id];

            return (
              <TouchableOpacity
                style={styles.userRow}
                onPress={() => navigation.push('UserProfile', { userId: item.id })}
                activeOpacity={0.7}
              >
                <Avatar url={item.avatar_url} name={item.display_name} size={46} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>@{item.username}</Text>
                </View>
                {!isMe && (
                  <TouchableOpacity
                    style={[styles.followBtn, amFollowing && styles.followBtnActive]}
                    onPress={() => handleToggleFollow(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.followBtnText, amFollowing && styles.followBtnTextActive]}>
                      {amFollowing ? 'Seguindo' : 'Seguir'}
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color={colors.text.muted} />
              <Text style={styles.emptyText}>
                {activeTab === 'followers' ? 'Nenhum seguidor' : 'Nao segue ninguem'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 58,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bg.secondary,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: colors.text.primary, fontSize: 17, fontWeight: '700' },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    color: colors.text.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.text.primary,
  },

  // User row
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  userInfo: { flex: 1 },
  userName: { color: colors.text.primary, fontSize: 15, fontWeight: '600' },

  // Follow button
  followBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
  },
  followBtnActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  followBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  followBtnTextActive: {
    color: colors.text.secondary,
  },

  empty: {
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: { color: colors.text.muted, fontSize: 15 },
});
