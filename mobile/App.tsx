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

const stackScreenOptions = {
  headerStyle: { backgroundColor: GREEN },
  headerTintColor: '#fff',
  headerTitle: 'WATCHTOWER',
  headerTitleStyle: {
    fontWeight: '900' as const,
    letterSpacing: 1,
  },
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
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
            </Pressable>
          ),
        })}
      />
      <MapStackNav.Screen
        name="CreateReport"
        component={CreateReportScreen}
        options={{}}
      />
      <MapStackNav.Screen
        name="ReportDetail"
        component={ReportDetailScreen}
        options={{}}
      />
    </MapStackNav.Navigator>
  );
}

function ReportsStack() {
  return (
    <ReportsStackNav.Navigator screenOptions={stackScreenOptions}>
      <ReportsStackNav.Screen name="ReportsHome" component={ReportsListScreen} />
      <ReportsStackNav.Screen name="ReportDetail" component={ReportDetailScreen} />
    </ReportsStackNav.Navigator>
  );
}

function ProfileStack() {
  const { token, isReady } = useAuth();
  if (!isReady) return null;

  return (
    <ProfileStackNav.Navigator screenOptions={stackScreenOptions}>
      {token ? (
        <ProfileStackNav.Screen name="Profile" component={ProfileScreen} />
      ) : (
        <>
          <ProfileStackNav.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerTitle: 'WATCHTOWER' }}
          />
          <ProfileStackNav.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerTitle: 'WATCHTOWER' }}
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
                headerShown: false,
                tabBarHideOnKeyboard: true,
                tabBarActiveTintColor: '#fff',
                tabBarInactiveTintColor: 'rgba(234,245,239,0.9)',
                tabBarLabelStyle: { fontSize: 12, fontWeight: '800' },
                tabBarItemStyle: { paddingVertical: 4, borderRadius: 14 },
                tabBarStyle: {
                  position: 'absolute',
                  left: sideInset,
                  right: sideInset,
                  bottom: 16,
                  height: 64,
                  borderRadius: 20,
                  backgroundColor: GREEN,
                  borderTopWidth: 0,
                  paddingBottom: 6,
                  paddingTop: 6,
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
              <Tab.Screen name="MapTab" component={MapStack} options={{ title: 'Home' }} />
              <Tab.Screen name="ReportsTab" component={ReportsStack} options={{ title: 'Live' }} />
              <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'User' }} />
            </Tab.Navigator>
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}