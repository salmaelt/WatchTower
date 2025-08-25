import React from 'react';
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

const qc = new QueryClient();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
            <Tab.Screen name="MapTab" component={MapScreen} options={{ title: 'Map' }} />
            <Tab.Screen name="ReportsTab" component={ReportsStack} options={{ title: 'Reports' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile' }} />
          </Tab.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}