import React from "react";
import MapView, {
  Marker,
  Region,
  PROVIDER_GOOGLE,
  LongPressEvent, // ✅ correct type for onLongPress
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
  region: Region;
  onRegionChangeComplete: (r: Region) => void;
  markers: MapMarker[];
  onLongPress?: (e: LongPressEvent) => void; // ✅ fixed
  onMarkerPress?: (id: number) => void;
  loading?: boolean;
};

export default function WTMap({
  region,
  onRegionChangeComplete,
  markers,
  onLongPress,
  onMarkerPress,
  loading,
}: Props) {
  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onRegionChangeComplete={onRegionChangeComplete}
        onLongPress={onLongPress} // ✅ now correctly typed
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