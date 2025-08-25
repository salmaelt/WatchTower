import React from "react";
import MapView, {
  Marker,
  Region,
  PROVIDER_GOOGLE,
  LongPressEvent,
} from "react-native-maps";
import { View, ActivityIndicator } from "react-native";

export type MapMarker = {
  id: number;
  coordinate: { latitude: number; longitude: number };
  title: string;
  description: string;
  color?: string;
};

type Props = {
  /** Fully controlled region (parent owns state) */
  region: Region;
  /** Fires once the user stops panning/zooming */
  onRegionChangeComplete: (r: Region) => void;

  /** Markers to render. Optional so this component can be reused in “create report”. */
  markers?: MapMarker[];

  onLongPress?: (e: LongPressEvent) => void;
  onMarkerPress?: (id: number) => void;
  loading?: boolean;

  /** Optional hard bounds to keep the camera inside (defaults to Greater London). */
  clampToLondon?: boolean;
};

// Approx Greater London bounds
const LONDON_BOUNDS = {
  minLat: 51.261, // south
  maxLat: 51.686, // north
  minLng: -0.563, // west
  maxLng: 0.280,  // east
};

function clampRegion(r: Region, b = LONDON_BOUNDS): Region {
  // Prevent zooming out beyond the bbox
  const maxLatDelta = b.maxLat - b.minLat;
  const maxLngDelta = b.maxLng - b.minLng;

  let latitudeDelta = Math.min(r.latitudeDelta, maxLatDelta);
  let longitudeDelta = Math.min(r.longitudeDelta, maxLngDelta);

  // Keep the visible corners inside bounds
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
  markers = [],
  onLongPress,
  onMarkerPress,
  loading,
  clampToLondon = true,
}: Props) {
  const clamped = clampToLondon ? clampRegion(region) : region;

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        region={clamped}                 // 🔒 controlled map (no initialRegion)
        minZoomLevel={9}
        maxZoomLevel={18}
        onRegionChangeComplete={(r) =>
          onRegionChangeComplete(clampToLondon ? clampRegion(r) : r)
        }
        onLongPress={onLongPress}
      >
        {markers.map((m) => (
          <Marker
            key={m.id}
            coordinate={m.coordinate}
            title={m.title}
            description={m.description}
            pinColor={m.color}
            onPress={() => onMarkerPress?.(m.id)}
          />
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
