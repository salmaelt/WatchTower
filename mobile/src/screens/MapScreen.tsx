// src/screens/MapScreen.tsx
import React, { useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text, Platform, Alert } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { palette } from '../theme';

const GREEN = palette.green ?? '#2f6b57';
const BG = (palette as any).bg ?? '#ffffff';

// London bounds
const LONDON_BOUNDS = { north: 51.70, south: 51.28, west: -0.51, east: 0.33 };

const INITIAL_REGION: Region = {
  latitude: 51.5072,
  longitude: -0.1276,
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const isInsideLondon = (lat: number, lng: number) =>
  lat >= LONDON_BOUNDS.south && lat <= LONDON_BOUNDS.north &&
  lng >= LONDON_BOUNDS.west  && lng <= LONDON_BOUNDS.east;

function clampRegion(r: Region): Region {
  const halfLat = r.latitudeDelta / 2;
  const halfLng = r.longitudeDelta / 2;
  const minLat = LONDON_BOUNDS.south + halfLat;
  const maxLat = LONDON_BOUNDS.north - halfLat;
  const minLng = LONDON_BOUNDS.west + halfLng;
  const maxLng = LONDON_BOUNDS.east - halfLng;

  return {
    ...r,
    latitude: clamp(r.latitude, minLat, maxLat),
    longitude: clamp(r.longitude, minLng, maxLng),
  };
}

export default function MapScreen() {
  const nav = useNavigation<any>();
  const mapRef = useRef<MapView | null>(null);
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [bounded, setBounded] = useState(true); // lock to London by default

  const onRegionChangeComplete = (r: Region) => {
    if (!bounded) { setRegion(r); return; }
    const clamped = clampRegion(r);
    // avoid feedback loop
    if (Math.abs(clamped.latitude - r.latitude) > 1e-6 ||
        Math.abs(clamped.longitude - r.longitude) > 1e-6) {
      setRegion(clamped);
    } else {
      setRegion(r);
    }
  };

  const goLive = () => nav.navigate('ReportsTab');

  const flyTo = (lat: number, lng: number, zoomDelta = 0.05) => {
    const target: Region = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: zoomDelta,
      longitudeDelta: zoomDelta,
    };
    setRegion(target);
    mapRef.current?.animateToRegion(target, 500);
  };

  const seeMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Enable location to see your position.');
      return;
    }
    const fix = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      maximumAge: 10000,
    });
    const { latitude, longitude } = fix.coords;

    if (isInsideLondon(latitude, longitude)) {
      if (!bounded) setBounded(true);
      flyTo(latitude, longitude, 0.03);
    } else {
      Alert.alert(
        'Outside London',
        'Your current location is outside the London bounds.',
        [
          { text: 'Stay on London', style: 'cancel' },
          {
            text: 'Unlock & go',
            onPress: () => {
              setBounded(false);
              flyTo(latitude, longitude, 0.08);
            },
          },
        ]
      );
    }
  };

  const backToLondon = () => {
    setBounded(true);
    flyTo(INITIAL_REGION.latitude, INITIAL_REGION.longitude, 0.25);
  };

  return (
    <View style={styles.screen}>
      {/* Green bordered map box */}
      <View style={styles.mapBox}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          region={region}
          onRegionChangeComplete={onRegionChangeComplete}
          showsUserLocation
          showsMyLocationButton={Platform.OS === 'android'}
          rotateEnabled={false}
          pitchEnabled={false}
        />
      </View>

      {/* CTA: See Reports (right) */}
      <Pressable
        style={({ pressed }) => [styles.btn, styles.btnPrimary, styles.btnRight, pressed && styles.btnPressed]}
        onPress={goLive}
      >
        <Text style={styles.btnText}>See Reports</Text>
      </Pressable>

      {/* CTA: See My Location (left) */}
      <Pressable
        style={({ pressed }) => [styles.btn, styles.btnPrimary, styles.btnLeft, pressed && styles.btnPressed]}
        onPress={seeMyLocation}
      >
        <Text style={styles.btnText}>See My Location</Text>
      </Pressable>

      {/* Back to London (only when unlocked) */}
      {!bounded && (
        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnGhost, styles.btnCenter, pressed && styles.btnPressed]}
          onPress={backToLondon}
        >
          <Text style={[styles.btnText, { color: GREEN }]}>Back to London</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
    padding: 16,
    paddingBottom: 100, // leave space for the rounded tab dock
  },
  mapBox: {
    flex: 1,
    borderWidth: 3,
    borderColor: GREEN,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0b0b0b',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  btn: {
    position: 'absolute',
    bottom: 96, // above the tab bar
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  btnPrimary: { backgroundColor: GREEN },
  btnGhost: { backgroundColor: '#fff', borderWidth: 2, borderColor: GREEN },
  btnRight: { right: 24 },
  btnLeft: { left: 24 },
  btnCenter: { left: '50%', transform: [{ translateX: -80 }], bottom: 160 }, // small pill in middle
  btnText: { color: '#fff', fontWeight: '800', letterSpacing: 0.3, fontSize: 12 },
  btnPressed: { transform: [{ translateY: 1 }] },
});
