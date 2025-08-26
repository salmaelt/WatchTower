import React from 'react';
import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import { Pressable, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import MapScreen from './src/screens/MapScreen';
import ReportsListScreen from './src/screens/ReportsListScreen';
import ReportDetailScreen from './src/screens/ReportDetailScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import CreateReportScreen from './src/screens/CreateReportScreen';
import ProfileScreen from './src/screens/ProfileScreen'; // make this; shows username + logout

// ---------- Route param types ----------
export type MapStackParamList = {
  MapHome: undefined;
  CreateReport: { initialCoord?: { latitude: number; longitude: number } } | undefined;
  ReportDetail: { id: number };
};

export type ReportsStackParamList = {
  ReportsHome: undefined;
  ReportDetail: { id: number };
};

export type ProfileStackParamList = {
  Login: {
    redirectTo?: {
      tab?: 'MapTab' | 'ReportsTab';
      screen: keyof MapStackParamList | keyof ReportsStackParamList | 'MapHome';
      params?: any;
    };
  } | undefined;
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

// App.tsx
function MapStack() {
  const { token } = useAuth(); // <— read auth here

  return (
    <MapStackNav.Navigator>
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
                  // polite gate
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
                              // after login, return to CreateReport
                              redirectTo: { tab: 'MapTab', screen: 'CreateReport' },
                            },
                          }),
                      },
                    ]
                  );
                }
              }}
            >
              <Ionicons name="add-circle-outline" size={24} />
            </Pressable>
          ),
        })}
      />
      <MapStackNav.Screen name="CreateReport" component={CreateReportScreen} options={{ title: 'Create Report' }} />
      <MapStackNav.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: 'Report' }} />
    </MapStackNav.Navigator>
  );
}

function ReportsStack() {
  return (
    <ReportsStackNav.Navigator>
      <ReportsStackNav.Screen name="ReportsHome" component={ReportsListScreen} options={{ title: 'Reports' }} />
      <ReportsStackNav.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: 'Report' }} />
    </ReportsStackNav.Navigator>
  );
}

function ProfileStack() {
  const { token, isReady } = useAuth();

  // Optional: simple splash while reading token from SecureStore once
  if (!isReady) return null;

  return (
    <ProfileStackNav.Navigator>
      {token ? (
        <ProfileStackNav.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: "Profile" }}
        />
      ) : (
        <>
          <ProfileStackNav.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: "Login" }}
          />
          <ProfileStackNav.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: "Register" }}
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
          <NavigationContainer>
            <Tab.Navigator
              initialRouteName="MapTab"
              screenOptions={({ route }) => ({
                headerShown: false, // Stack headers manage titles
                tabBarHideOnKeyboard: true,
                tabBarIcon: ({ focused, color, size }) => {
                  const name =
                    route.name === 'MapTab' ? (focused ? 'map' : 'map-outline') :
                    route.name === 'ReportsTab' ? (focused ? 'list' : 'list-outline') :
                    (focused ? 'person' : 'person-outline');
                  return <Ionicons name={name as any} size={size} color={color} />;
                },
              })}
            >
              <Tab.Screen name="MapTab" component={MapStack} options={{ title: 'Map' }} />
              <Tab.Screen name="ReportsTab" component={ReportsStack} options={{ title: 'Reports' }} />
              <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile' }} />
            </Tab.Navigator>
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}