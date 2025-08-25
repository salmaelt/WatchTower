// File: Contracts/CommentDtos.cs
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace WatchtowerApi.Contracts
{
    public sealed class CreateCommentRequest
    {
        [Required]
        [JsonPropertyName("commentText")] public string CommentText { get; set; } = default!;
    }


    public sealed class CommentDto
    {
        [JsonPropertyName("id")] public long Id { get; init; }
        [JsonPropertyName("userId")] public long UserId { get; init; }
        [JsonPropertyName("username")] public string Username { get; init; } = default!;
        [JsonPropertyName("commentText")] public string CommentText { get; init; } = default!;
        [JsonPropertyName("createdAt")] public DateTimeOffset CreatedAt { get; init; }
        [JsonPropertyName("upvotes")] public int Upvotes { get; init; }
        [JsonPropertyName("upvotedByMe")] public bool UpvotedByMe { get; init; }
    }


    public sealed class CommentUpvoteStateDto
    {
        [JsonPropertyName("id")] public long Id { get; init; }
        [JsonPropertyName("upvotes")] public int Upvotes { get; init; }
        [JsonPropertyName("upvotedByMe")] public bool UpvotedByMe { get; init; }
    }
}