import React from "react";
import { View } from "react-native";
import WTMap from "../components/MapView";
import { listReportsByBbox } from "../api/reports";
import { useQuery } from "@tanstack/react-query";

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

function regionToBbox(r: Region) {
  const minLat = r.latitude - r.latitudeDelta / 2;
  const maxLat = r.latitude + r.latitudeDelta / 2;
  const minLng = r.longitude - r.longitudeDelta / 2;
  const maxLng = r.longitude + r.longitudeDelta / 2;
  return { minLng, minLat, maxLng, maxLat };
}

/** Small debounce to avoid hammering the API while panning */
function useDebounced<T>(value: T, ms = 200): T {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Round so the queryKey is stable enough to dedupe properly */
function roundBBox(
  b: { minLng: number; minLat: number; maxLng: number; maxLat: number },
  dp = 5
) {
  const f = (n: number) => Number(n.toFixed(dp));
  return {
    minLng: f(b.minLng),
    minLat: f(b.minLat),
    maxLng: f(b.maxLng),
    maxLat: f(b.maxLat),
  };
}

export default function MapScreen({ navigation }: any) {
  // Start centered on London
  const [region, setRegion] = React.useState<Region>({
    latitude: 51.5074,
    longitude: -0.1278,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  });

  // Convert -> debounce -> round for a nice, stable query key + fewer calls
  const bboxRaw = regionToBbox(region);
  const bboxDebounced = useDebounced(bboxRaw, 200);
  const bbox = roundBBox(bboxDebounced, 5);

  const { data, isFetching } = useQuery({
    // IMPORTANT: use primitives in the key so identity changes when numbers change
    queryKey: ["reports", bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat],
    queryFn: () => listReportsByBbox(bbox),
    // keep markers on-screen while new bbox loads, and avoid constant GC
    staleTime: 5_000,
    gcTime: 120_000,
  });

  const markers =
    (data?.features ?? []).map((f) => ({
      id: f.properties.id,
      coordinate: {
        latitude: f.geometry.coordinates[1],
        longitude: f.geometry.coordinates[0],
      },
      title: `${f.properties.type} (${f.properties.upvotes}↑)`,
      description: f.properties.description,
      color: f.properties.upvotedByMe ? "purple" : undefined,
    })) ?? [];

  return (
    <View style={{ flex: 1 }}>
      <WTMap
        region={region}
        // ✅ Let queryKey drive fetching; no manual refetch() (prevents “no request logged” race)
        onRegionChangeComplete={setRegion}
        markers={markers}
        loading={isFetching}
        onLongPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          navigation.navigate("ReportForm", { lat: latitude, lng: longitude });
        }}
        onMarkerPress={(id) => navigation.navigate("ReportDetail", { id })}
      />
    </View>
  );
}
