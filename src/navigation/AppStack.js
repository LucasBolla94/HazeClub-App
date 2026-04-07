import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';

import FeedScreen from '../screens/feed/FeedScreen';
import SearchScreen from '../screens/search/SearchScreen';
import CreatePostScreen from '../screens/post/CreatePostScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import PostDetailScreen from '../screens/post/PostDetailScreen';

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
    </FeedNav.Navigator>
  );
}

function SearchStack() {
  return (
    <SearchNav.Navigator screenOptions={{ headerShown: false }}>
      <SearchNav.Screen name="SearchHome" component={SearchScreen} />
      <SearchNav.Screen name="UserProfile" component={ProfileScreen} />
      <SearchNav.Screen name="PostDetail" component={PostDetailScreen} />
    </SearchNav.Navigator>
  );
}

function ProfileStack() {
  return (
    <ProfileNav.Navigator screenOptions={{ headerShown: false }}>
      <ProfileNav.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileNav.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileNav.Screen name="PostDetail" component={PostDetailScreen} />
    </ProfileNav.Navigator>
  );
}

function CreateButton({ onPress }) {
  return (
    <TouchableOpacity
      style={styles.createBtn}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      activeOpacity={0.8}
    >
      <View style={styles.createBtnInner}>
        <Ionicons name="add" size={28} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

// Placeholder for the Create tab (never actually rendered)
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
        tabBarIcon: ({ color }) => {
          const icons = {
            Feed: 'home',
            Search: 'search',
            CreateTab: 'add',
            Profile: 'person',
          };
          return <Ionicons name={icons[route.name]} size={24} color={color} />;
        },
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
          tabBarButton: (props) => (
            <CreateButton
              onPress={() => props.onPress?.()}
            />
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

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bg.secondary,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 85,
    paddingBottom: 25,
    paddingTop: 10,
  },
  createBtn: {
    top: -15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtnInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
