import React from "react";
import MapView, {
  Marker,
  Region,
  PROVIDER_GOOGLE,
  LongPressEvent,
  Callout,
} from "react-native-maps";
import { View, ActivityIndicator, Text } from "react-native";
import { palette } from "../theme"; // palette.green

export type MapMarker = {
  id: number;
  coordinate: { latitude: number; longitude: number };
  title: string;
  description: string;
  color?: string;
};

type Props = {
  initialRegion: Region;                                   // uncontrolled start
  onRegionChangeComplete: (r: Region) => void;
  markers: MapMarker[];
  onLongPress?: (e: LongPressEvent) => void;
  onMarkerPress?: (id: number) => void;                    // bubble to screen for navigation
  loading?: boolean;
};

// Greater London bounds (southWest / northEast)
const LONDON_SW = { latitude: 51.261, longitude: -0.3 };
const LONDON_NE = { latitude: 51.686, longitude: 0.1 };

export default function WTMap({
  initialRegion,
  onRegionChangeComplete,
  markers,
  onLongPress,
  onMarkerPress,
  loading,
}: Props) {
  const mapRef = React.useRef<MapView | null>(null);
  const lastRegionRef = React.useRef<Region | null>(null);

  React.useEffect(() => {
    (mapRef.current as any)?.setMapBoundaries(LONDON_NE, LONDON_SW);
  }, []);

  const handleRegionChangeComplete = (r: Region) => {
    lastRegionRef.current = r;
    onRegionChangeComplete(r);
  };

  // Tiny helper: center on a coord, keeping current zoom. Nudge up a bit so callout fits.
  const centerOn = (coord: { latitude: number; longitude: number }) => {
    const r = lastRegionRef.current;
    if (!r) return;
    const nudge = r.latitudeDelta * 0.18; // move marker slightly down so callout has room above
    (mapRef.current as any)?.animateToRegion(
      {
        latitude: coord.latitude - nudge / 2,
        longitude: coord.longitude,
        latitudeDelta: r.latitudeDelta,
        longitudeDelta: r.longitudeDelta,
      },
      250
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        onRegionChangeComplete={handleRegionChangeComplete}
        // Let the map auto-move when the marker is pressed…
        // (we also call centerOn in case the platform doesn’t do enough)
        // moveOnMarkerPress is true by default, so we can omit it.
        minZoomLevel={9}
        maxZoomLevel={18}
        onLongPress={onLongPress}
      >
        {markers.map((m) => (
          <Marker
            key={m.id}
            coordinate={m.coordinate}
            pinColor={m.color}
            onPress={() => centerOn(m.coordinate)}                 // ensure centering on marker tap
            onCalloutPress={() => onMarkerPress?.(m.id)}           // Android-friendly callout press
          >
            <Callout onPress={() => onMarkerPress?.(m.id)}>
              <View style={{ minWidth: 200 }}>
                <Text style={{ fontWeight: "bold" }} numberOfLines={1}>{m.title}</Text>
                {!!m.description && (
                  <Text style={{ marginTop: 4 }} numberOfLines={4}>{m.description}</Text>
                )}
                <View
                  style={{
                    marginTop: 8,
                    backgroundColor: palette.green,
                    borderRadius: 10,
                    paddingVertical: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>View Details</Text>
                </View>
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