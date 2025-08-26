// MapScreen.tsx
import React from "react";
import { View } from "react-native";
import WTMap from "../components/MapView";
import { listReportsByBbox } from "../api/reports";
import { useQuery, keepPreviousData } from "@tanstack/react-query"; // 👈 import helper

function regionToBbox(r:{ latitude:number; longitude:number; latitudeDelta:number; longitudeDelta:number }) {
  const minLat = r.latitude - r.latitudeDelta/2;
  const maxLat = r.latitude + r.latitudeDelta/2;
  const minLng = r.longitude - r.longitudeDelta/2;
  const maxLng = r.longitude + r.longitudeDelta/2;
  return { minLng, minLat, maxLng, maxLat };
}

// simple debounce hook
function useDebouncedValue<T>(value: T, delay = 250) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export default function MapScreen({ navigation }: any) {
  const [region, setRegion] = React.useState({
    latitude: 51.5074, longitude: -0.1278, latitudeDelta: 0.2, longitudeDelta: 0.2
  });

  // live bbox changes as map moves; debouncedBbox drives the query
  const liveBbox = React.useMemo(() => regionToBbox(region), [region]);
  const debouncedBbox = useDebouncedValue(liveBbox, 300);

  const { data, isFetching } = useQuery({
    queryKey: ["reports", debouncedBbox],                     // 🔑 run when debounced bbox changes
    queryFn: () => listReportsByBbox(debouncedBbox),
    placeholderData: keepPreviousData,                        // ✅ v5 replacement
    staleTime: 15_000,                                        // reduces refetch churn while panning a bit
  });

  const markers = (data?.features ?? []).map(f => ({
    id: f.properties.id,
    coordinate: { latitude: f.geometry.coordinates[1], longitude: f.geometry.coordinates[0] },
    title: `${f.properties.type} (${f.properties.upvotes}↑)`,
    description: f.properties.description,
    color: f.properties.upvotedByMe ? "purple" : undefined,
  }));

  return (
    <View style={{ flex: 1 }}>
      <WTMap
        region={region}
        onRegionChangeComplete={setRegion}                      // 👈 no refetch() here
        markers={markers}
        loading={isFetching}
        onLongPress={(e)=> {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          navigation.navigate("CreateReport", {                 // 👈 correct route name
            initialCoord: { latitude, longitude }
          });
        }}
        onMarkerPress={(id)=> navigation.navigate("ReportDetail", { id })}
      />
    </View>
  );
}

