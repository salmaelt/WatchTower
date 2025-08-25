// File: Contracts/ReportDtos.cs
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace WatchtowerApi.Contracts
{
    // Incoming for get markers endpoint
    public sealed class ReportListQuery
    {
        // Raw bbox string: minLng,minLat,maxLng,maxLat
        [Required]
        [JsonPropertyName("bbox")] public string Bbox { get; set; } = default!;


        // Repeatable query param (?type=a&type=b)
        [JsonPropertyName("type")] public List<string>? Type { get; set; }


        // Inclusive date filters (occurredAt). Accepts YYYY-MM-DD
        [JsonPropertyName("from")] public DateTimeOffset? From { get; set; }
        [JsonPropertyName("to")] public DateTimeOffset? To { get; set; }
    }

    // Incoming for create report endpoint
    public sealed class CreateReportRequest
    {
        [Required]
        [JsonPropertyName("type")] public string Type { get; set; } = default!;


        [Required]
        [JsonPropertyName("description")] public string Description { get; set; } = default!;


        [Required]
        [JsonPropertyName("occurredAt")] public DateTimeOffset OccurredAt { get; set; }


        [Required, Range(-90, 90)]
        [JsonPropertyName("lat")] public double Lat { get; set; }


        [Required, Range(-180, 180)]
        [JsonPropertyName("lng")] public double Lng { get; set; }
    }

    // Outgoing for create report endpoint
    public sealed class CreateReportResponse
    {
        [JsonPropertyName("id")] public long Id { get; init; }
        [JsonPropertyName("status")] public string Status { get; init; } = default!;
        [JsonPropertyName("createdAt")] public DateTimeOffset CreatedAt { get; init; }
        [JsonPropertyName("updatedAt")] public DateTimeOffset? UpdatedAt { get; init; }
    }

    //  Incoming for update report endpoint
    public sealed class UpdateReportRequest
    {
        [Required]
        [JsonPropertyName("description")] public string Description { get; set; } = default!;
    }


    // Outgoing for update report endpoint
    public sealed class UpdateReportResponse
    {
        [JsonPropertyName("id")] public long Id { get; init; }
        [JsonPropertyName("updatedAt")] public DateTimeOffset UpdatedAt { get; init; }
    }


    // Outgoing for upvote endpoints
    public sealed class ReportUpvoteStateDto
    {
        [JsonPropertyName("id")] public long Id { get; init; }
        [JsonPropertyName("upvotes")] public int Upvotes { get; init; }
        [JsonPropertyName("upvotedByMe")] public bool UpvotedByMe { get; init; }
    }


    // Nested within DTOs containing Users
    public sealed class ReportUserDto
    {
        [JsonPropertyName("id")] public long Id { get; init; }
        [JsonPropertyName("username")] public string Username { get; init; } = default!;
    }


    // Properties payload for GeoJSON Feature (used in GET /reports and GET /reports/{id})
    public sealed class ReportPropertiesDto
    {
        [JsonPropertyName("id")] public long Id { get; init; }
        [JsonPropertyName("type")] public string Type { get; init; } = default!;
        [JsonPropertyName("occurredAt")] public DateTimeOffset OccurredAt { get; init; }
        [JsonPropertyName("createdAt")] public DateTimeOffset CreatedAt { get; init; }
        [JsonPropertyName("updatedAt")] public DateTimeOffset? UpdatedAt { get; init; }
        [JsonPropertyName("status")] public string Status { get; init; } = default!;
        [JsonPropertyName("upvotes")] public int Upvotes { get; init; }
        [JsonPropertyName("upvotedByMe")] public bool UpvotedByMe { get; init; }
        [JsonPropertyName("description")] public string Description { get; init; } = default!;
        [JsonPropertyName("user")] public ReportUserDto User { get; init; } = default!;
    }


    // Type aliases (usage hints):
    // - GeoJsonFeature<ReportPropertiesDto> for GET /reports/{id}
    // - GeoJsonFeatureCollection<ReportPropertiesDto> for GET /reports
}