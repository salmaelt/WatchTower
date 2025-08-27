import React from "react";
import { View } from "react-native";
import WTMap from "../components/MapView";
import { listReportsByBbox } from "../api/reports";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

function regionToBbox(r:{ latitude:number; longitude:number; latitudeDelta:number; longitudeDelta:number }) {
  const minLat = r.latitude - 2*r.latitudeDelta/3;
  const maxLat = r.latitude + 2*r.latitudeDelta/3;
  const minLng = r.longitude - 2*r.longitudeDelta/3;
  const maxLng = r.longitude + 2*r.longitudeDelta/3;
  return { minLng, minLat, maxLng, maxLat };
}

function useDebouncedValue<T>(value: T, delay = 200) {
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

  const liveBbox = React.useMemo(() => regionToBbox(region), [region]);
  const debouncedBbox = useDebouncedValue(liveBbox, 300);

  const { data, isFetching } = useQuery({
    queryKey: ["reports", debouncedBbox],
    queryFn: () => listReportsByBbox(debouncedBbox),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const markers = (data?.features ?? []).map((f: any) => ({
    id: f.properties.id,
    coordinate: { latitude: f.geometry.coordinates[1], longitude: f.geometry.coordinates[0] },
    title: `Phone Theft (${f.properties.upvotes}↑)`,
    description: f.properties.description,
    color: f.properties.upvotedByMe ? "purple" : undefined,
  }));

  return (
    <View style={{ flex: 1 }}>
      <WTMap
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        markers={markers}
        loading={isFetching}
        onLongPress={(e)=> {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          navigation.navigate("CreateReport", { initialCoord: { latitude, longitude } });
        }}
        onMarkerPress={(id) => navigation.navigate("ReportDetail", { id })}
      />
    </View>
  );
}