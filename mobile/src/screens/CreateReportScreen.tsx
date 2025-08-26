// src/screens/CreateReportScreen.tsx
import React, { useCallback, useMemo, useState, useEffect } from "react";
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
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../auth/AuthContext"; // <- global auth (token + requireAuth)

type Coord = { latitude: number; longitude: number };

export default function CreateReportScreen() {
  const navigation = useNavigation<any>();
  const { requireAuth } = useAuth(); // belt-and-braces check on submit

  // Half-screen map region (controlled)
  const [region, setRegion] = useState<Region>({
    latitude: 51.5074,
    longitude: -0.1278,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });
  const [marker, setMarker] = useState<Coord | null>(null);

  // Form fields — align with API contract
  const [type, setType] = useState("phone_theft"); // underscore ✅
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState<string>(new Date().toISOString());

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
    () => !!marker && !!type.trim() && !!description.trim() && !!occurredAt.trim(),
    [marker, type, description, occurredAt]
  );

  const submit = useCallback(async () => {
    // If not authed, show login and bounce. Keeps guests out of this write path.
    if (!requireAuth(navigation as any, { tab: "MapTab", screen: "CreateReport" })) return;

    if (!marker) {
      Alert.alert("Pick a location", "Tap the map to drop the marker.");
      return;
    }

    const payload = {
      type: type.trim(),                // e.g. "phone_theft"
      description: description.trim(),
      occurredAt,                       // ISO 8601 string
      lat: marker.latitude,
      lng: marker.longitude,
    };

    try {
      // axios baseURL + Authorization are set globally in AuthContext
      await axios.post("/reports", payload);
      Alert.alert("Report created", "Thank you for contributing.");
      navigation.goBack();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        // token expired mid-flight → send to login with redirect back
        requireAuth(navigation as any, { tab: "MapTab", screen: "CreateReport" });
        return;
      }
      const msg =
        err?.response?.data?.title ||
        err?.response?.data?.detail ||
        err?.message ||
        "Something went wrong";
      Alert.alert("Failed to create report", String(msg));
    }
  }, [requireAuth, navigation, marker, type, description, occurredAt]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1 }}>
        {/* Half-height map (controlled region to avoid 'blue tiles') */}
        <View style={{ height: "46%" }}>
          <MapView
            style={{ flex: 1 }}
            provider={PROVIDER_GOOGLE}
            region={region}                         // <-- controlled
            onRegionChangeComplete={setRegion}
            onPress={onMapPress}
          >
            {marker && <Marker coordinate={marker} />}
          </MapView>
        </View>

        {/* Form */}
        <ScrollView
          style={styles.form}
          contentContainerStyle={styles.formInner}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Type</Text>
          <TextInput
            value={type}
            onChangeText={setType}
            placeholder='e.g., "phone_theft"'
            style={styles.input}
            autoCapitalize="none"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What happened?"
            style={[styles.input, styles.textarea]}
            multiline
            numberOfLines={4}
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>Occurred At (ISO)</Text>
          <TextInput
            value={occurredAt}
            onChangeText={setOccurredAt}
            placeholder="YYYY-MM-DDTHH:mm:ss.sssZ"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#666"
          />
          <View style={{ marginBottom: 12 }}>
            <Button title="Use current time" onPress={() => setOccurredAt(new Date().toISOString())} />
          </View>

          <Button
            title="Use my current location"
            onPress={async () => {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== "granted") {
                Alert.alert("Permission required", "Location permission was not granted.");
                return;
              }
              const loc = await Location.getCurrentPositionAsync({});
              const c = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
              setMarker(c);
              setRegion((r) => ({ ...r, ...c, latitudeDelta: 0.02, longitudeDelta: 0.02 }));
            }}
          />

          <View style={{ height: 12 }} />

          <Button title="Submit Report" onPress={submit} disabled={!canSubmit} />
          {!marker && <Text style={styles.helper}>Tip: tap the map to place the marker.</Text>}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: { backgroundColor: "#fff" },
  formInner: { padding: 12 },
  label: { fontWeight: "600", marginTop: 8, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: "#ddd", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 10, backgroundColor: "#fafafa",
  },
  textarea: { minHeight: 96, textAlignVertical: "top" },
  helper: { marginTop: 8, opacity: 0.7 },
});