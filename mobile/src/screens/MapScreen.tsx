import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text, Platform } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { palette } from '../theme';

const GREEN = palette.green ?? '#2f6b57';
const GREEN_D = palette.greenD ?? '#285a49';
const BG = (palette as any).bg ?? '#ffffff';

// London bounds (rough)
const LONDON_BOUNDS = {
  north: 51.70,
  south: 51.28,
  west: -0.51,
  east: 0.33,
};

const INITIAL_REGION: Region = {
  latitude: 51.5072,
  longitude: -0.1276,
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
};

function clamp(v: number, min: number, max: number) {
  'worklet';
  return Math.max(min, Math.min(max, v));
}

// Keep center within bounds while respecting current zoom/deltas
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

  const onRegionChangeComplete = (r: Region) => {
    const clamped = clampRegion(r);
    // Avoid feedback loop
    if (
      Math.abs(clamped.latitude - r.latitude) > 1e-6 ||
      Math.abs(clamped.longitude - r.longitude) > 1e-6
    ) {
      setRegion(clamped);
    } else {
      setRegion(r);
    }
  };

  const goLive = () => nav.navigate('ReportsTab');

  return (
    <View style={styles.screen}>
      {/* Green bordered map "box" */}
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

      {/* See Reports button, above the dock */}
      <Pressable style={({ pressed }) => [styles.liveBtn, pressed && { transform: [{ translateY: 1 }] }]} onPress={goLive}>
        <Text style={styles.liveBtnText}>See Reports</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
    padding: 16,              // space from edges so box looks framed
    paddingBottom: 100,       // leave space for the rounded tab dock
  },
  mapBox: {
    flex: 1,
    borderWidth: 3,
    borderColor: GREEN,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0b0b0b', // like web sandbox behind tiles
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  liveBtn: {
    position: 'absolute',
    right: 24,
    bottom: 96,              // sits above the tab bar
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  liveBtnText: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.3,
    fontSize: 14,
  },
});