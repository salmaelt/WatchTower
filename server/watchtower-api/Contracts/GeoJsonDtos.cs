using System.Text.Json.Serialization;

namespace WatchtowerApi.Contracts
{
    // Generic GeoJSON Point geometry (WGS84). Coordinates are [lng, lat].
    public sealed class GeoJsonPoint
    {
        [JsonPropertyName("type")] public string Type => "Point";


        // IMPORTANT: [lng, lat]
        [JsonPropertyName("coordinates")] public required double[] Coordinates { get; init; }
    }


    // Generic GeoJSON Feature wrapper
    public sealed class GeoJsonFeature<TProps>
    {
        [JsonPropertyName("type")] public string Type => "Feature";
        [JsonPropertyName("geometry")] public required GeoJsonPoint Geometry { get; init; }
        [JsonPropertyName("properties")] public required TProps Properties { get; init; }
    }


    // Generic GeoJSON FeatureCollection wrapper
    public sealed class GeoJsonFeatureCollection<TProps>
    {
        [JsonPropertyName("type")] public string Type => "FeatureCollection";
        [JsonPropertyName("features")] public List<GeoJsonFeature<TProps>> Features { get; init; } = new();
    }
}