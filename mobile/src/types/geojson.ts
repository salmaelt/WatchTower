export type GeoJsonPoint = { type: "Point"; coordinates: [number, number] }; // [lng, lat]
export type GeoJsonFeature<P> = { type: "Feature"; geometry: GeoJsonPoint; properties: P };
export type GeoJsonFeatureCollection<P> = { type: "FeatureCollection"; features: GeoJsonFeature<P>[] };