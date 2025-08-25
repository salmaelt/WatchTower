// Domain/CommentUpvote.cs
namespace WatchtowerApi.Domain
{
    // Composite PK (CommentId, UserId). Ensures one upvote per user per comment.
    public class CommentUpvote
    {
        public long CommentId { get; set; }
        public Comment? Comment { get; set; }

        public long UserId { get; set; }
        public User? User { get; set; }

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}