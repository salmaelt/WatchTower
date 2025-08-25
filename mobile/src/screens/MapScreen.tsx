import React from "react";
import { View } from "react-native";
import WTMap from "../components/MapView";
import { listReportsByBbox } from "../api/reports";
import { useQuery } from "@tanstack/react-query";

function regionToBbox(r:{ latitude:number; longitude:number; latitudeDelta:number; longitudeDelta:number }) {
  const minLat = r.latitude - r.latitudeDelta/2;
  const maxLat = r.latitude + r.latitudeDelta/2;
  const minLng = r.longitude - r.longitudeDelta/2;
  const maxLng = r.longitude + r.longitudeDelta/2;
  return { minLng, minLat, maxLng, maxLat };
}

export default function MapScreen({ navigation }: any) {
  const [region, setRegion] = React.useState({ latitude:51.5074, longitude:-0.1278, latitudeDelta:0.2, longitudeDelta:0.2 });
  const bbox = regionToBbox(region);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["reports", bbox],
    queryFn: () => listReportsByBbox(bbox),
  });

  const markers = (data?.features ?? []).map(f => ({
    id: f.properties.id,
    coordinate: { latitude: f.geometry.coordinates[1], longitude: f.geometry.coordinates[0] },
    title: `${f.properties.type} (${f.properties.upvotes}↑)`,
    description: f.properties.description,
    color: f.properties.upvotedByMe ? "purple" : undefined,
  }));

  return (
    <View style={{ flex:1 }}>
      <WTMap
        region={region}
        onRegionChangeComplete={(r)=>{ setRegion(r); refetch(); }}
        markers={markers}
        loading={isFetching}
        onLongPress={(e)=> {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          navigation.navigate("ReportForm", { lat: latitude, lng: longitude });
        }}
        onMarkerPress={(id)=> navigation.navigate("ReportDetail", { id })}
      />
    </View>
  );
}