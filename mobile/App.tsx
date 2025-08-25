import React from 'react';
import { Pressable } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import MapScreen from './src/screens/MapScreen';
import ReportsListScreen from './src/screens/ReportsListScreen';
import ReportDetailScreen from './src/screens/ReportDetailScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import CreateReportScreen from './src/screens/CreateReportScreen'; // ✅ NEW

const qc = new QueryClient();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MapStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MapHome"
        component={MapScreen}
        options={({ navigation }) => ({
          title: 'Map',
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate('CreateReport')}
              hitSlop={8}
              style={{ paddingHorizontal: 8 }}
            >
              <Ionicons name="add-circle-outline" size={24} />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="CreateReport"
        component={CreateReportScreen}
        options={{ title: 'Create Report' }}
      />
    </Stack.Navigator>
  );
}

function ReportsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ReportsHome" component={ReportsListScreen} options={{ title: 'Reports' }} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ title: 'Report' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={qc}>
        <NavigationContainer>
          <Tab.Navigator
            initialRouteName="MapTab"
            screenOptions={({ route }) => ({
              // Hide the *tab* headers; inner Stack headers stay visible
              headerShown: false,
              tabBarIcon: ({ focused, color, size }) => {
                const name =
                  route.name === 'MapTab' ? (focused ? 'map' : 'map-outline') :
                  route.name === 'ReportsTab' ? (focused ? 'list' : 'list-outline') :
                  (focused ? 'person' : 'person-outline');
                return <Ionicons name={name as any} size={size} color={color} />;
              },
            })}
          >
            {/* ✅ Map tab now uses a Stack that includes CreateReport */}
            <Tab.Screen name="MapTab" component={MapStack} options={{ title: 'Map' }} />
            <Tab.Screen name="ReportsTab" component={ReportsStack} options={{ title: 'Reports' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile' }} />
          </Tab.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
