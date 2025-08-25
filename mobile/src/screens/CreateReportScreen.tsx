import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import MapView, {
  Marker,
  MapPressEvent,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

type Coord = { latitude: number; longitude: number };

const API_BASE_URL: string =
  (Constants as any)?.expoConfig?.extra?.API_BASE_URL ??
  (Constants as any)?.manifest2?.extra?.API_BASE_URL ??
  "http://10.0.2.2:5000"; // Android emulator -> host machine

const TOKEN_KEY = "authToken";

export default function CreateReportScreen() {
  const navigation = useNavigation<any>();

  // Map + marker
  const [region, setRegion] = useState<Region>({
    latitude: 51.5074,
    longitude: -0.1278,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });
  const [marker, setMarker] = useState<Coord | null>(null);

  // Form fields — match CreateReportRequest DTO
  const [type, setType] = useState("phone-theft");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState<string>(
    new Date().toISOString()
  ); // ISO string is fine for DateTimeOffset

  // grab token early; if missing, go to login
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const t = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!t) {
        navigation.navigate("Login");
        return;
      }
      setToken(t);
    })();
  }, [navigation]);

  // Optional: center on user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      setRegion((r) => ({
        ...r,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }));
    })();
  }, []);

  const onMapPress = useCallback((e: MapPressEvent) => {
    const c = e.nativeEvent.coordinate;
    setMarker({ latitude: c.latitude, longitude: c.longitude });
  }, []);

  const canSubmit = useMemo(
    () => !!marker && type.trim().length > 0 && description.trim().length > 0 && occurredAt.trim().length > 0,
    [marker, type, description, occurredAt]
  );

  const submit = useCallback(async () => {
    if (!token) {
      navigation.navigate("Login");
      return;
    }
    if (!marker) {
      Alert.alert("Pick a location", "Tap the map to drop the marker.");
      return;
    }

    const payload = {
      type: type.trim(),
      description: description.trim(),
      occurredAt,          // ISO 8601 string; server expects DateTimeOffset
      lat: marker.latitude,
      lng: marker.longitude,
    };

    try {
      const res = await axios.post(`${API_BASE_URL}/reports`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Success -> back or to detail screen
      Alert.alert("Report created", "Thank you for contributing.");
      navigation.goBack();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        // Not authorized -> go to Login
        navigation.navigate("Login");
        return;
      }
      const msg =
        err?.response?.data?.title ||
        err?.response?.data?.detail ||
        err?.message ||
        "Something went wrong";
      Alert.alert("Failed to create report", String(msg));
    }
  }, [token, marker, type, description, occurredAt, navigation]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1 }}>
        <MapView
          style={{ flex: 1 }}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onPress={onMapPress}
          onRegionChangeComplete={setRegion}
        >
          {marker && <Marker coordinate={marker} />}
        </MapView>

        <ScrollView
          style={styles.form}
          contentContainerStyle={styles.formInner}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Type</Text>
          <TextInput
            value={type}
            onChangeText={setType}
            placeholder="e.g., phone-theft"
            style={styles.input}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What happened?"
            style={[styles.input, styles.textarea]}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Occurred At (ISO)</Text>
          <TextInput
            value={occurredAt}
            onChangeText={setOccurredAt}
            placeholder="YYYY-MM-DDTHH:mm:ss.sssZ"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={{ marginBottom: 12 }}>
            <Button title="Use current time" onPress={() => setOccurredAt(new Date().toISOString())} />
          </View>

          <Button title="Use my current location" onPress={async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
              Alert.alert("Permission required", "Location permission was not granted.");
              return;
            }
            const loc = await Location.getCurrentPositionAsync({});
            const c = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            setMarker(c);
            setRegion((r) => ({ ...r, ...c, latitudeDelta: 0.02, longitudeDelta: 0.02 }));
          }} />

          <View style={{ height: 12 }} />

          <Button title="Submit Report" onPress={submit} disabled={!canSubmit} />
          {!marker && (
            <Text style={styles.helper}>Tip: tap the map to place the marker.</Text>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: {
    backgroundColor: "#ffffffff",
  },
  formInner: {
    padding: 12,
  },
  label: {
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#fafafa",
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  helper: {
    marginTop: 8,
    opacity: 0.7,
  },
});