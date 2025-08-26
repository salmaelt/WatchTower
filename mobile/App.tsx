// App.tsx
import React from 'react';
import { Pressable, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  NavigationContainer,
  DefaultTheme,
  NavigatorScreenParams,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider, useAuth } from './src/auth/AuthContext';
import MapScreen from './src/screens/MapScreen';
import ReportsListScreen from './src/screens/ReportsListScreen';
import ReportDetailScreen from './src/screens/ReportDetailScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import CreateReportScreen from './src/screens/CreateReportScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { palette } from './src/theme';

// ---------- Route param types ----------
export type MapStackParamList = {
  MapHome: undefined;
  CreateReport:
    | { initialCoord?: { latitude: number; longitude: number } }
    | undefined;
  ReportDetail: { id: number };
};

export type ReportsStackParamList = {
  ReportsHome: undefined;
  ReportDetail: { id: number };
};

export type ProfileStackParamList = {
  Login:
    | {
        redirectTo?: {
          tab?: 'MapTab' | 'ReportsTab';
          screen:
            | keyof MapStackParamList
            | keyof ReportsStackParamList
            | 'MapHome';
          params?: any;
        };
      }
    | undefined;
  Register: undefined;
  Profile: undefined;
};

export type RootTabParamList = {
  MapTab: NavigatorScreenParams<MapStackParamList>;
  ReportsTab: NavigatorScreenParams<ReportsStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// ---------- Stacks / Tabs ----------
const Tab = createBottomTabNavigator<RootTabParamList>();
const MapStackNav = createNativeStackNavigator<MapStackParamList>();
const ReportsStackNav = createNativeStackNavigator<ReportsStackParamList>();
const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();

// ---------- Theme ----------
const GREEN = palette.green ?? '#2f6b57';
const GREEN_D = palette.greenD ?? '#285a49';
const INK = palette.ink ?? '#0f172a';
const BG = (palette as any).bg ?? '#ffffff';

// React Navigation theme (screen background, etc.)
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: BG,
    primary: GREEN,
    text: INK,
    card: '#ffffff',
    border: 'transparent',
  },
};

// Shared header styling for every stack screen
const stackScreenOptions = {
  headerStyle: { backgroundColor: GREEN },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '900' as const },
};

// ---------- Nested stacks ----------
function MapStack() {
  const { token } = useAuth();

  return (
    <MapStackNav.Navigator screenOptions={stackScreenOptions}>
      <MapStackNav.Screen
        name="MapHome"
        component={MapScreen}
        options={({ navigation }) => ({
          title: 'Map',
          headerRight: () => (
            <Pressable
              hitSlop={8}
              style={{ paddingHorizontal: 8 }}
              onPress={() => {
                if (token) {
                  navigation.navigate('CreateReport');
                } else {
                  Alert.alert(
                    'Login required',
                    'You need to log in to create a report.',
                    [
                      { text: 'Not now', style: 'cancel' },
                      {
                        text: 'Log in',
                        style: 'default',
                        onPress: () =>
                          (navigation as any).navigate('ProfileTab', {
                            screen: 'Login',
                            params: {
                              redirectTo: { tab: 'MapTab', screen: 'CreateReport' },
                            },
                          }),
                      },
                    ]
                  );
                }
              }}
            >
              {/* white icon to contrast the green header */}
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
            </Pressable>
          ),
        })}
      />
      <MapStackNav.Screen
        name="CreateReport"
        component={CreateReportScreen}
        options={{ title: 'Create Report' }}
      />
      <MapStackNav.Screen
        name="ReportDetail"
        component={ReportDetailScreen}
        options={{ title: 'Report' }}
      />
    </MapStackNav.Navigator>
  );
}

function ReportsStack() {
  return (
    <ReportsStackNav.Navigator screenOptions={stackScreenOptions}>
      <ReportsStackNav.Screen
        name="ReportsHome"
        component={ReportsListScreen}
        options={{ title: 'Reports' }}
      />
      <ReportsStackNav.Screen
        name="ReportDetail"
        component={ReportDetailScreen}
        options={{ title: 'Report' }}
      />
    </ReportsStackNav.Navigator>
  );
}

function ProfileStack() {
  const { token, isReady } = useAuth();
  if (!isReady) return null; // simple splash while loading token

  return (
    <ProfileStackNav.Navigator screenOptions={stackScreenOptions}>
      {token ? (
        <ProfileStackNav.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
      ) : (
        <>
          <ProfileStackNav.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Sign in' }}
          />
          <ProfileStackNav.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Create account' }}
          />
        </>
      )}
    </ProfileStackNav.Navigator>
  );
}

// ---------- App ----------
const qc = new QueryClient();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={qc}>
        <AuthProvider>
          <NavigationContainer theme={navTheme}>
            <Tab.Navigator
              initialRouteName="MapTab"
              screenOptions={({ route }) => ({
                headerShown: false, // stack headers handle titles
                tabBarHideOnKeyboard: true,
                tabBarActiveTintColor: '#fff',
                tabBarInactiveTintColor: 'rgba(234,245,239,0.9)', // light mint text
                tabBarLabelStyle: { fontSize: 12, fontWeight: '800' },
                tabBarItemStyle: { paddingVertical: 4, borderRadius: 14 },
                // Rounded "pill" dock — matches web bottom nav feel
                tabBarStyle: {
                  position: 'absolute',
                  left: 16,
                  right: 16,
                  bottom: 16,
                  height: 64,
                  borderRadius: 20,
                  backgroundColor: GREEN,
                  borderTopWidth: 0,
                  paddingBottom: 6,
                  paddingTop: 6,
                  // shadow/elevation
                  elevation: 10,
                  shadowColor: '#000',
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 6 },
                },
                tabBarIcon: ({ focused, color, size }) => {
                  const name =
                    route.name === 'MapTab'
                      ? focused
                        ? 'map'
                        : 'map-outline'
                      : route.name === 'ReportsTab'
                      ? focused
                        ? 'list'
                        : 'list-outline'
                      : focused
                      ? 'person'
                      : 'person-outline';
                  return <Ionicons name={name as any} size={size} color={color} />;
                },
              })}
            >
              <Tab.Screen
                name="MapTab"
                component={MapStack}
                options={{ title: 'Home' }}
              />
              <Tab.Screen
                name="ReportsTab"
                component={ReportsStack}
                options={{ title: 'Live' }}
              />
              <Tab.Screen
                name="ProfileTab"
                component={ProfileStack}
                options={{ title: 'User' }}
              />
            </Tab.Navigator>
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}