// src/screens/CreateReportScreen.tsx
import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  Alert,
  View,
  Text,
  TextInput,
  StyleSheet,
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { KeyboardAvoidingView } from "react-native";
import LoadingButton from "../components/LoadingButton";
import { useAuth } from "../auth/AuthContext";

type Coord = { latitude: number; longitude: number };

export default function CreateReportScreen() {
  const navigation = useNavigation<any>();
  const { requireAuth } = useAuth();

  // Safe area + header => vertical offset so the keyboard clears the navbar
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const kbdOffset = Platform.select({
    ios: headerHeight + insets.top,
    android: 0,
    default: 0,
  }) as number;

  // Half-screen map region (controlled)
  const [region, setRegion] = useState<Region>({
    latitude: 51.5074,
    longitude: -0.1278,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });
  const [marker, setMarker] = useState<Coord | null>(null);

  // Form fields — align with API contract
  const [type, setType] = useState("phone_theft");
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState<string>(new Date().toISOString());
  const [submitting, setSubmitting] = useState(false);

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

  const useCurrentLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Location permission was not granted.");
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    const c = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    setMarker(c);
    setRegion((r) => ({ ...r, ...c, latitudeDelta: 0.02, longitudeDelta: 0.02 }));
  }, []);

  const submit = useCallback(async () => {
    if (!requireAuth(navigation as any, { tab: "MapTab", screen: "CreateReport" })) return;

    if (!marker) {
      Alert.alert("Pick a location", "Tap the map to drop the marker.");
      return;
    }

    const payload = {
      type: type.trim(),
      description: description.trim(),
      occurredAt,
      lat: marker.latitude,
      lng: marker.longitude,
    };

    try {
      await axios.post("/reports", payload); // baseURL + auth set globally
      Alert.alert("Report created", "Thank you for contributing.");
      navigation.goBack();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
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
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={kbdOffset}
      >
        <View style={{ flex: 1 }}>
          {/* Map area */}
          <View style={{ height: "38%" }}>
            <MapView
              style={{ flex: 1 }}
              provider={PROVIDER_GOOGLE}
              region={region}
              onRegionChangeComplete={setRegion}
              onPress={onMapPress}
            >
              {marker && <Marker coordinate={marker} />}
            </MapView>
          </View>

          {/* Form */}
          <ScrollView
            style={styles.form}
            contentContainerStyle={[
              styles.formInner,
              { paddingBottom: 16 + insets.bottom }, // space above the bottom safe area
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            contentInsetAdjustmentBehavior="automatic"
          >
            <Text style={styles.label}>Type</Text>
            <TextInput
              value={type}
              onChangeText={setType}
              placeholder='e.g., "phone_theft"'
              style={styles.input}
              autoCapitalize="none"
              placeholderTextColor="#666"
              returnKeyType="next"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What happened?"
              style={[styles.input, styles.textarea]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
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
              returnKeyType="done"
            />

            <View style={{ height: 8 }} />

            <LoadingButton
              title="Use current time"
              variant="outline"
              onPressAsync={async () => setOccurredAt(new Date().toISOString())}
              fullWidth
            />

            <View style={{ height: 8 }} />

            <LoadingButton
              title="Use my current location"
              variant="outline"
              onPressAsync={useCurrentLocation}
              fullWidth
            />

            <View style={{ height: 12 }} />

            <LoadingButton
              title="Submit report"
              variant="primary"
              disabled={!canSubmit}
              onPressAsync={submit}
              onLoadingChange={setSubmitting}
              loading={submitting}
              fullWidth
            />

            {!marker && <Text style={styles.helper}>Tip: tap the map to place the marker.</Text>}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  form: { backgroundColor: "#fff", flex: 1 },
  formInner: { padding: 12 },
  label: { fontWeight: "600", marginTop: 8, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#fafafa",
  },
  textarea: { minHeight: 96 },
  helper: { marginTop: 8, opacity: 0.7 },
});
