import React from "react";
import MapView, {
  Marker,
  Region,
  PROVIDER_GOOGLE,
  LongPressEvent,
  Callout,
} from "react-native-maps";
import { View, ActivityIndicator, Text, Pressable } from "react-native";

export type MapMarker = {
  id: number;
  coordinate: { latitude: number; longitude: number };
  title: string;
  description: string;
  color?: string;
};

type Props = {
  region: Region; // parent controls this
  onRegionChangeComplete: (r: Region) => void;
  markers: MapMarker[];
  onLongPress?: (e: LongPressEvent) => void;
  onMarkerPress?: (id: number) => void; // called when user taps callout / button
  loading?: boolean;
};

// Approx Greater London bounds
const LONDON_BOUNDS = {
  minLat: 51.261, // south
  maxLat: 51.686, // north
  minLng: -0.563, // west
  maxLng: 0.280, // east
};

function clampRegion(r: Region, b = LONDON_BOUNDS): Region {
  const maxLatDelta = b.maxLat - b.minLat;
  const maxLngDelta = b.maxLng - b.minLng;

  let latitudeDelta = Math.min(r.latitudeDelta, maxLatDelta);
  let longitudeDelta = Math.min(r.longitudeDelta, maxLngDelta);

  const minLatCenter = b.minLat + latitudeDelta / 2;
  const maxLatCenter = b.maxLat - latitudeDelta / 2;
  const minLngCenter = b.minLng + longitudeDelta / 2;
  const maxLngCenter = b.maxLng - longitudeDelta / 2;

  const latitude = Math.min(Math.max(r.latitude, minLatCenter), maxLatCenter);
  const longitude = Math.min(Math.max(r.longitude, minLngCenter), maxLngCenter);

  return { latitude, longitude, latitudeDelta, longitudeDelta };
}

export default function WTMap({
  region,
  onRegionChangeComplete,
  markers,
  onLongPress,
  onMarkerPress,
  loading,
}: Props) {
  const clamped = clampRegion(region);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        region={clamped}
        minZoomLevel={9}
        maxZoomLevel={18}
        onRegionChangeComplete={(r) => onRegionChangeComplete(clampRegion(r))}
        onLongPress={onLongPress}
      >
        {markers.map((m) => (
          <Marker
            key={m.id}
            coordinate={m.coordinate}
            title={m.title}
            description={m.description}
            pinColor={m.color}
          >
            {/* First tap shows this popup */}
            <Callout onPress={() => onMarkerPress?.(m.id)}>
              <View style={{ maxWidth: 240 }}>
                <Text style={{ fontWeight: "700", marginBottom: 4 }}>{m.title}</Text>
                <Text numberOfLines={3} style={{ opacity: 0.8 }}>
                  {m.description}
                </Text>

                <Pressable
                  onPress={() => onMarkerPress?.(m.id)}
                  style={({ pressed }) => ({
                    marginTop: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: pressed ? "#e7eefc" : "#2a72ff",
                    alignSelf: "flex-start",
                  })}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>View details</Text>
                </Pressable>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {loading && (
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            backgroundColor: "white",
            padding: 6,
            borderRadius: 6,
          }}
          pointerEvents="none"
        >
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
}