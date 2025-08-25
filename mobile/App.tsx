import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MapScreen from "./src/screens/MapScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import ReportDetailScreen from "./src/screens/ReportDetailScreen";
import ReportForm from "./src/components/ReportForm";

const Stack = createNativeStackNavigator();
const qc = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
          <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
          <Stack.Screen name="ReportForm" component={ReportForm} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}