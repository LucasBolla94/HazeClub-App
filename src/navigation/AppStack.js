import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, View, StyleSheet, Animated, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '../theme';

import FeedScreen from '../screens/feed/FeedScreen';
import SearchScreen from '../screens/search/SearchScreen';
import CreatePostScreen from '../screens/post/CreatePostScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import PostDetailScreen from '../screens/post/PostDetailScreen';
import FollowListScreen from '../screens/profile/FollowListScreen';

const Tab = createBottomTabNavigator();
const RootStack = createStackNavigator();
const FeedNav = createStackNavigator();
const SearchNav = createStackNavigator();
const ProfileNav = createStackNavigator();

function FeedStack() {
  return (
    <FeedNav.Navigator screenOptions={{ headerShown: false }}>
      <FeedNav.Screen name="FeedHome" component={FeedScreen} />
      <FeedNav.Screen name="PostDetail" component={PostDetailScreen} />
      <FeedNav.Screen name="UserProfile" component={ProfileScreen} />
      <FeedNav.Screen name="FollowList" component={FollowListScreen} />
    </FeedNav.Navigator>
  );
}

function SearchStack() {
  return (
    <SearchNav.Navigator screenOptions={{ headerShown: false }}>
      <SearchNav.Screen name="SearchHome" component={SearchScreen} />
      <SearchNav.Screen name="UserProfile" component={ProfileScreen} />
      <SearchNav.Screen name="PostDetail" component={PostDetailScreen} />
      <SearchNav.Screen name="FollowList" component={FollowListScreen} />
    </SearchNav.Navigator>
  );
}

function ProfileStack() {
  return (
    <ProfileNav.Navigator screenOptions={{ headerShown: false }}>
      <ProfileNav.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileNav.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileNav.Screen name="PostDetail" component={PostDetailScreen} />
      <ProfileNav.Screen name="FollowList" component={FollowListScreen} />
    </ProfileNav.Navigator>
  );
}

// Animated tab icon with active indicator
function TabIcon({ name, focused, color }) {
  const scale = useRef(new Animated.Value(1)).current;
  const dotOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.15 : 1,
        friction: 5,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.timing(dotOpacity, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <View style={styles.tabIconWrap}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={focused ? name : `${name}-outline`} size={24} color={color} />
      </Animated.View>
      <Animated.View style={[styles.activeDot, { opacity: dotOpacity }]} />
    </View>
  );
}

// Floating create button with gradient
function CreateButton({ onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.88,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 200,
      useNativeDriver: true,
    }).start();
  }

  return (
    <TouchableOpacity
      style={styles.createBtn}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      activeOpacity={1}
    >
      <Animated.View style={[styles.createBtnShadow, { transform: [{ scale }] }]}>
        <LinearGradient
          colors={['#9d84fd', '#7c5cfc', '#5c8cfc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.createBtnGradient}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

function EmptyScreen() {
  return <View style={{ flex: 1, backgroundColor: colors.bg.primary }} />;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarShowLabel: false,
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Feed: 'home',
            Search: 'search',
            CreateTab: 'add-circle',
            Profile: 'person',
          };
          return <TabIcon name={icons[route.name]} focused={focused} color={color} />;
        },
        tabBarBackground: () => (
          <View style={styles.tabBarBg}>
            <LinearGradient
              colors={['rgba(18,18,26,0.97)', 'rgba(10,10,15,0.99)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={styles.tabBarTopLine} />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Feed" component={FeedStack} />
      <Tab.Screen name="Search" component={SearchStack} />
      <Tab.Screen
        name="CreateTab"
        component={EmptyScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('CreatePost');
          },
        })}
        options={{
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <CreateButton onPress={() => props.onPress?.()} />
          ),
        }}
      />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

export default function AppStack() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Main" component={MainTabs} />
      <RootStack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          presentation: 'modal',
          gestureEnabled: true,
          animationTypeForReplace: 'push',
        }}
      />
    </RootStack.Navigator>
  );
}

const BOTTOM_INSET = Platform.OS === 'ios' ? 28 : 12;

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    height: 64 + BOTTOM_INSET,
    paddingBottom: BOTTOM_INSET,
    paddingTop: 8,
  },
  tabBarBg: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  tabBarTopLine: {
    position: 'absolute',
    top: 0,
    left: spacing.xl,
    right: spacing.xl,
    height: 0.5,
    backgroundColor: 'rgba(124,92,252,0.2)',
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginTop: 4,
  },
  createBtn: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtnShadow: {
    shadowColor: '#7c5cfc',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
  },
  createBtnGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
